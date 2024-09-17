import { jest } from '@jest/globals';

import { ParticipantType } from '../src/common/types/participant.types';
import { RealtimeStateTypes } from '../src/common/types/realtime.types';
import { Logger, Observer } from '../src/common/utils';
import { IOC } from '../src/services/io';
import { RoomStateService } from '../src/services/roomState';

import { MOCK_LOCAL_PARTICIPANT } from './participants.mock';

export const ROOM_STATE_MOCK = {
  room: new IOC(MOCK_LOCAL_PARTICIPANT).createRoom('mock_room'),
  logger: new Logger('@superviz/sdk/roomStateMock'),
  myParticipant: { ...MOCK_LOCAL_PARTICIPANT, type: ParticipantType.HOST },
  enableSync: true,
  isSyncFrozen: false,
  left: false,
  state: RealtimeStateTypes.CONNECTED,
  MESSAGE_SIZE_LIMIT: 60000,
  useStore: jest.fn(),
  kickParticipantObserver: new Observer(),
  join: jest.fn(),
  updateMyProperties: jest.fn(),
  isMessageTooBig: jest.fn(),
  updateRoomProperties: jest.fn(),
  setHost: jest.fn(),
  setKickParticipant: jest.fn(),
  setGridMode: jest.fn(),
  setDrawing: jest.fn(),
  setTranscript: jest.fn(),
  initializeRoomProperties: jest.fn(),
  onParticipantLeave: jest.fn(),
  fetchRoomProperties: jest.fn(),
  onJoinRoom: jest.fn(),
  publishStateUpdate: jest.fn(),
  onPresenceEnter: jest.fn(),
  setFollowParticipant: jest.fn(),
  setGather: jest.fn(),
  updateLocalRoomState: jest.fn(),
  freezeSync: jest.fn(),
  destroy: jest.fn(),
} as unknown as RoomStateService;
