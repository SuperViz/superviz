import { Logger } from '../common/utils/logger';
import { IOC } from '../services/io';

import { RoomParams } from './types';

export class Room {
  private participant: RoomParams['participant'];
  private io: IOC;
  private logger: Logger;

  constructor(params: RoomParams) {
    this.io = new IOC(params.participant);
    this.participant = params.participant;
    this.logger = new Logger('@superviz/room/room');

    this.logger.log('Room created', this.participant);
  }
}
