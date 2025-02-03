import type { Room, SocketEvent } from '@superviz/socket-client';
import { BehaviorSubject } from 'rxjs';

import { Logger } from '../../common/utils/logger';

import { RoomPropertiesEvents, State } from './types';

export class RoomState {
  public state: State;
  public hostObserver: BehaviorSubject<string | null>;

  private logger: Logger;

  constructor(
    private room: Room,
  ) {
    this.logger = new Logger('@superviz/video/room-state');

    this.state = {
      hostId: null,
    };

    this.hostObserver = new BehaviorSubject<string>(null);
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
  };

  public stop = () => {
    this.room.off(RoomPropertiesEvents.UPDATE, this.onUpdate);
  };

  public update = (properties: Partial<State>): void => {
    const newProperties = Object.assign({}, this.state, properties);

    this.state = newProperties;
    this.room.emit(RoomPropertiesEvents.UPDATE, newProperties);
    this.notify();

    this.logger.log('room state @ update - new state', this.state);
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

    console.log(lastMessage);

    return lastMessage.data as State;
  }

  private notify() {
    this.hostObserver.next(this.state.hostId);
  }

  private onUpdate = ({ data }: SocketEvent<State>) => {
    this.state = data;

    this.notify();
    this.logger.log('room state @ on update - new event', this.state);
  };
}
