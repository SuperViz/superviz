import { PresenceEvent, PresenceEvents, type Room, type SocketEvent } from '@superviz/socket-client';
import { BehaviorSubject } from 'rxjs';

import { Participant } from '../../common/types/participant.types';
import { Logger } from '../../common/utils/logger';
import { DrawingData, LayoutMode } from '../video-manager/types';

import { RoomPropertiesEvents, State } from './types';

export class RoomState {
  public state: State;
  public hostObserver: BehaviorSubject<string | null>;
  public followObserver: BehaviorSubject<string | null>;
  public cameraModeObserver: BehaviorSubject<LayoutMode>;
  public drawingObserver: BehaviorSubject<DrawingData>;

  private logger: Logger;
  private drawingData: DrawingData;

  constructor(
    private room: Room,
    private drawingRoom: Room,
    private localParticipant: Participant,
  ) {
    this.logger = new Logger('@superviz/video/room-state');

    this.state = {
      hostId: null,
      followParticipantId: null,
      cameraMode: LayoutMode.LIST,
    };

    this.hostObserver = new BehaviorSubject<string>(this.state.hostId);
    this.followObserver = new BehaviorSubject<string>(this.state.followParticipantId);
    this.cameraModeObserver = new BehaviorSubject<LayoutMode>(this.state.cameraMode);
    this.drawingObserver = new BehaviorSubject<DrawingData>(null);
  }

  public start = async (): Promise<void> => {
    const state = await this.fetchRoomProperties();

    if (!state) {
      this.update(this.state);
    } else {
      this.state = state;
      this.notify();
    }

    this.room.on(RoomPropertiesEvents.UPDATE, this.onUpdate);
    this.drawingRoom.presence.on(PresenceEvents.UPDATE, this.onUpdateDrawing);
  };

  public stop = () => {
    this.room.off(RoomPropertiesEvents.UPDATE, this.onUpdate);
    this.drawingRoom.presence.off(PresenceEvents.JOINED_ROOM);
  };

  public update = (properties: Partial<State>): void => {
    const newProperties = Object.assign({}, this.state, properties);

    this.state = newProperties;
    this.room.emit(RoomPropertiesEvents.UPDATE, newProperties);
    this.notify();

    this.logger.log('room state @ update - new state', this.state);
  };

  public setDrawing = (drawing: DrawingData): void => {
    this.drawingData = Object.assign({}, this.drawingData, drawing);

    this.drawingRoom.presence.update(this.drawingData);
  };

  private async fetchRoomProperties(): Promise<State | null> {
    const presences: number = await new Promise<number>((resolve) => {
      this.room.presence.get((presences) => {
        if (!presences) resolve(0);

        resolve(presences.length);
      });
    });

    if (presences <= 1) return null;

    const lastMessage: SocketEvent<unknown> = await new Promise((resolve, reject) => {
      this.room.history((data) => {
        if (!data) reject(data);
        if (!data.events.length) resolve(null);

        const lastMessage = data.events.pop();

        resolve(lastMessage);
      });
    });

    const oneHour = 1000 * 60 * 60;
    const messageIsTooOld = lastMessage?.timestamp < Date.now() - oneHour;

    if (!lastMessage?.data || messageIsTooOld) return null;

    return lastMessage.data as State;
  }

  public notify() {
    this.hostObserver.next(this.state.hostId);
    this.followObserver.next(this.state.followParticipantId);
    this.cameraModeObserver.next(this.state.cameraMode);
  }

  private onUpdate = ({ data }: SocketEvent<State>) => {
    this.state = data;

    this.notify();
    this.logger.log('room state @ on update - new event', this.state);
  };

  private onUpdateDrawing = (event: PresenceEvent<DrawingData>) => {
    if (
      this.localParticipant.id === event.id ||
      !event?.data ||
      !Object.keys(event?.data).length
    ) {
      return;
    }

    this.drawingObserver.next(event.data);
  };
}
