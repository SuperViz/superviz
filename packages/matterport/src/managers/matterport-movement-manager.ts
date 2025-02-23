import { SocketEvent } from '@superviz/socket-client';
import PubSub from 'pubsub-js';

import type { MpSdk as Matterport, Rotation } from '../common/types/matterport.types';
import { SWEEP_DURATION } from '../constants/avatar';
import { Mode, Presence3dEvents } from '../types';

import { ParticipantManager } from './participant-manager';

export class MatterportMovementManager {
  private mpInputComponent: Matterport.Scene.IComponent;
  private isSweeping: boolean = false;
  private followParticipantId: string | undefined;
  private currentLocalMode: Matterport.Mode.Mode;
  constructor(private readonly matterportSdk: Matterport) {
    PubSub.subscribe(Presence3dEvents.GO_TO_PARTICIPANT, this.goTo.bind(this));
    PubSub.subscribe(Presence3dEvents.FOLLOW_ME, this.followMe.bind(this));
    // PubSub.subscribe(Presence3dEvents.FOLLOW_PARTICIPANT, this.follow.bind(this));
    // PubSub.subscribe(Presence3dEvents.LOCAL_FOLLOW_PARTICIPANT, this.localFollow.bind(this));
  }

  public async addInputComponent(): Promise<void> {
    const [mpInputObject] = await this.matterportSdk.Scene.createObjects(1);
    const mpInputNode = mpInputObject.addNode();
    this.mpInputComponent = mpInputNode.addComponent('mp.input', {
      eventsEnabled: false,
      userNavigationEnabled: true,
    });
    mpInputNode.start();
  }

  public goTo = (e: any, payload: { participantId: string }): void => {
    this.moveToAnotherParticipant(payload.participantId);
  };

  public moveToAnotherParticipant = (participantId: string): void => {
    if (participantId === ParticipantManager.instance.getLocalParticipant.id) {
      console.log('Controls: moveToAnotherParticipan: return, im local');
      return;
    }
    const { mode, sweep, rotation } = ParticipantManager.instance.getPositionInfo(participantId);

    if (mode === Mode.INSIDE && sweep) {
      this.moveToSweep(sweep, rotation || {
        x: 0,
        y: 0,
      });
    }

    if (mode === Mode.DOLLHOUSE || mode === Mode.FLOORPLAN) {
      const transition = this.matterportSdk.Mode.TransitionType.FLY;
      const { position, rotation, floor } = ParticipantManager.instance.getPositionInfo(participantId);
      this.matterportSdk.Mode.moveTo(mode, {
        position,
        rotation,
        transition,
        zoom: 25,
      }).then((nextMode) => {
        PubSub.publish(Presence3dEvents.LOCAL_MODE_CHANGED, { localmode: nextMode });
      });

      // old :: if (mode === Mode.FLOORPLAN && this.currentLocalFloorId !== floor) {

      /* if (mode === Mode.FLOORPLAN) {
        if (floor === -1) {
          this.matterportSdk.Floor.showAll();
        } else {
          this.matterportSdk.Floor.moveTo(floor).then(() => {
            this.currentLocalFloorId = floor;
          });
        }
      } */
    }
  };

  public async moveToParticipant(e: any, payload: { participantId: string }): Promise<void> {
    const {
      mode,
      sweep,
      position,
      rotation,
      floor } = ParticipantManager.instance.getPositionInfo(payload.participantId);

    if (mode === Mode.INSIDE && sweep) {
      await this.moveToSweep(sweep, rotation);
    }

    if (mode === Mode.DOLLHOUSE || mode === Mode.FLOORPLAN) {
      await this.moveToPosition(mode, position, rotation, floor);
    }
  }

  private followMe = (
    e: any,
    payload: { event: SocketEvent<{ id: string | undefined }> },
  ): void => {
    console.log('followMe', payload.event.data.id);
    this.followParticipantId = payload.event.data.id;
    PubSub.publish(Presence3dEvents.FOLLOW_PARTICIPANT_CHANGED, {
      followId: payload.event.data.id,
    });
    this.moveToAnotherParticipant(payload.event.data.id);
  };

  private follow = (e: any, payload: { participantId: string }): void => {
    // console.log('follow', payload.participantId);
    // console.log('follow', payload.event.data.id);
    // if (payload.event.data.id === ParticipantManager.instance.getLocalParticipant.id) return;
    // this.followParticipantId = payload.event.data.id;
    // this.moveToAnotherParticipant(payload.event.data.id);
    // console.log('follow', this.followParticipantId);
  };

  private localFollow = (e: any, payload: { participantId: string }): void => {
    console.log('localFollow', payload.participantId);
    ParticipantManager.instance.setLocalParticipantId(payload.participantId);
  };

  private async moveToSweep(sweepId: string, rotation: Rotation): Promise<void> {
    if (this.isSweeping) return;

    if (this.mpInputComponent) {
      this.mpInputComponent.inputs.userNavigationEnabled = false;
    }

    this.isSweeping = true;

    try {
      await this.matterportSdk.Sweep.moveTo(sweepId, {
        transitionTime: SWEEP_DURATION,
        transition: this.matterportSdk.Sweep.Transition.FLY,
        rotation,
      });
    } catch (error) {
      console.error('[SuperViz] Error when trying to sweep', error);
    } finally {
      this.isSweeping = false;
      if (this.mpInputComponent) {
        this.mpInputComponent.inputs.userNavigationEnabled = true;
      }
    }
  }

  private async moveToPosition(
    mode: Mode,
    position: any,
    rotation: Rotation,
    floor: number,
  ): Promise<void> {
    const transition = this.matterportSdk.Mode.TransitionType.FLY;

    await this.matterportSdk.Mode.moveTo(mode, {
      position,
      rotation,
      transition,
      zoom: 25,
    });

    if (mode === Mode.FLOORPLAN) {
      await this.changeFloor(floor);
    }
  }

  private async changeFloor(floor: number): Promise<void> {
    if (floor === -1) {
      await this.matterportSdk.Floor.showAll();
    } else {
      console.log('Matterport: changeFloor', floor);
      await this.matterportSdk.Floor.moveTo(floor);
    }
  }

  public getCurrentLocalMode(): Matterport.Mode.Mode {
    return this.currentLocalMode;
  }
}
