import type { Room, SocketEvent, PresenceEvent, PresenceEvents } from '@superviz/socket-client';
import type { EventBus } from '@superviz/sdk/dist/services/event-bus';
import type { Participant } from '@superviz/sdk';
import { Presence3dEvents } from '../types';
import type { Logger } from '../../common/utils/logger';
import { Mode } from '../../types';
import type { MpSdk as Matterport, Rotation } from '../../common/types/matterport.types';
import type { PositionInfo } from '../../types';
import { SWEEP_DURATION } from '../../common/constants/presence';

export class RealtimeEvents {
  private followParticipantId?: string;
  private localFollowParticipantId?: string;
  private isSweeping: boolean = false;

  constructor(
    private room: Room,
    private eventBus: EventBus,
    private logger: Logger,
    private matterportSdk: Matterport,
    private localParticipantId: string,
    private positionInfos: Record<string, PositionInfo>,
    private mpInputComponent: Matterport.Scene.IComponent,
    private onParticipantLeaveCallback: (event: PresenceEvent<Participant>) => void,
  ) {}

  public subscribeToRealtimeEvents(): void {
    this.logger.log('matterport component @ subscribeToRealtimeEvents');
    this.room.on<Participant>(Presence3dEvents.PARTICIPANT_JOINED, this.onParticipantJoined);
    this.room.presence.on('presence.leave' as PresenceEvents, this.onParticipantLeave);
    this.room.on<{ id?: string }>(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.on<{ id?: string }>(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  }

  public subscribeToEventBusEvents(): void {
    this.logger.log('matterport component @ subscribeToEventBusEvents');
    this.eventBus.subscribe('realtime.go-to-participant', this.goTo);
    this.eventBus.subscribe('realtime.local-follow-participant', this.localFollow);
    this.eventBus.subscribe('realtime.follow-participant', this.follow);
  }

  public unsubscribeFromRealtimeEvents(): void {
    this.logger.log('matterport component @ unsubscribeToRealtimeEvents');
    this.room.presence.off('presence.leave' as PresenceEvents);
    this.room.off(Presence3dEvents.PARTICIPANT_JOINED, this.onParticipantJoined);
    this.room.off(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.off(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  }

  public unsubscribeFromEventBusEvents(): void {
    this.eventBus.unsubscribe('realtime.go-to-participant', this.goTo);
    this.eventBus.unsubscribe('realtime.local-follow-participant', this.localFollow);
    this.eventBus.unsubscribe('realtime.follow-participant', this.follow);
  }

  private onFollowParticipantUpdate = (event: SocketEvent<{ id: string | undefined }>): void => {
    if (event.data.id === this.localParticipantId) return;
    this.logger.log('three js component @ onFollowParticipantUpdate', event.data.id);
    this.followParticipantId = event.data.id;
    this.moveToAnotherParticipant(event.data.id);
  };

  private onGatherUpdate = (event: SocketEvent<{ id: string | undefined }>): void => {
    this.logger.log('three js component @ onGatherUpdate', event.data.id);

    if (event.data.id === this.localParticipantId) return;

    this.eventBus.publish('realtime.go-to-participant', event.data.id);
  };

  public gather(): void {
    this.logger.log('matterport component @ gather');
    this.room.emit(Presence3dEvents.GATHER, { id: this.localParticipantId });
  }

  public follow(participantId?: string): void {
    this.logger.log('matterport component @ follow');
    this.room.emit(Presence3dEvents.FOLLOW_ME, { id: participantId });
  }

  private localFollow = (participantId?: string): void => {
    this.localFollowParticipantId = participantId;
  };

  private moveToAnotherParticipant = (participantId: string): void => {
    if (!this.positionInfos[participantId] || participantId === this.localParticipantId) {
      return;
    }
    const { mode, sweep } = this.positionInfos[participantId];

    if (mode === Mode.INSIDE && sweep) {
      const rotation: Rotation = this.positionInfos[participantId].rotation || {
        x: 0,
        y: 0,
      };

      this.moveToSweep(sweep, rotation);
    }

    if (mode === Mode.DOLLHOUSE || mode === Mode.FLOORPLAN) {
      const transition = this.matterportSdk.Mode.TransitionType.FLY;
      const { position, rotation, floor } = this.positionInfos[participantId];
      this.matterportSdk.Mode.moveTo(mode, {
        position,
        rotation,
        transition,
        zoom: 25,
      });

      if (mode === Mode.FLOORPLAN && floor !== undefined) {
        if (floor === -1) {
          this.matterportSdk.Floor.showAll();
        } else {
          this.matterportSdk.Floor.moveTo(floor);
        }
      }
    }
  };

  private moveToSweep(sweepId: string, rotation: Rotation) {
    if (this.isSweeping) {
      return;
    }
    if (this.mpInputComponent) {
      this.mpInputComponent.inputs.userNavigationEnabled = false;
    }
    this.isSweeping = true;
    this.matterportSdk.Sweep.moveTo(sweepId, {
      transitionTime: SWEEP_DURATION,
      transition: this.matterportSdk.Sweep.Transition.FLY,
      rotation: rotation,
    })
      .catch((e) => {
        console.log('[SuperViz] Error when trying to sweep', e);
      })
      .finally(() => {
        this.isSweeping = false;
        if (this.mpInputComponent) {
          this.mpInputComponent.inputs.userNavigationEnabled = true;
        }
      });
  }

  private onParticipantJoined = (event: SocketEvent<Participant>): void => {
    this.logger.log('matterport component @ onParticipantJoined', event.data);
  };

  private onParticipantLeave = (event: PresenceEvent<Participant>): void => {
    this.logger.log('matterport component @ onParticipantLeave', event);
    this.onParticipantLeaveCallback(event);
  };

  private goTo = (participantId: string): void => {
    this.moveToAnotherParticipant(participantId);
  };
}
