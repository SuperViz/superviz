import { Subject } from 'rxjs';

import { Logger } from '../common/utils/logger';
import { IOC } from '../services/io';

import { ParticipantEvent, RoomParams } from './types';

import { Room } from './index';

jest.mock('../services/io', () => ({
  IOC: jest.fn().mockImplementation(() => ({
    stateSubject: new Subject(),
    destroy: jest.fn(),
    createRoom: jest.fn(() => ({
      disconnect: jest.fn(),
      presence: {
        off: jest.fn(),
        on: jest.fn(),
        update: jest.fn(),
      },
    })),
  })),
}));
jest.mock('../common/utils/logger');

describe('Room', () => {
  let room: Room;
  let params: RoomParams;

  beforeEach(() => {
    params = {
      participant: { id: '123', name: 'Test Participant' },
    };
    room = new Room(params);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a room and initialize it', () => {
    expect(IOC).toHaveBeenCalledWith(params.participant);
    expect(Logger).toHaveBeenCalledWith('@superviz/room/room');
  });

  it('should leave the room and destroy the socket connection', () => {
    room.leave();

    expect(room['room'].disconnect).toHaveBeenCalled();
    expect(room['io'].destroy).toHaveBeenCalled();
  });

  it('should remove all subscriptions and observers from the room when it\'s destroyed', () => {
    room.subscribe('my-participant.joined', () => {});

    room.leave();

    expect(room['subscriptions'].size).toBe(0);
  });

  it('should subscribe to an event', () => {
    const callback = jest.fn();
    const event = 'participant.joined';

    room.subscribe(event, callback);

    expect(room['observers'].get(event)).toBeInstanceOf(Subject);
    expect(room['subscriptions'].get(callback)).toBeDefined();
  });

  it('should unsubscribe from an event', () => {
    const callback = jest.fn();
    const event = 'participant.joined';

    room.subscribe(event, callback);
    room.unsubscribe(event, callback);

    expect(room['subscriptions'].get(callback)).toBeUndefined();
  });

  it('should unsubscribe from all callbacks of an event', () => {
    const event = 'participant.joined';

    room.subscribe(event, jest.fn());
    room.unsubscribe(event);

    expect(room['observers'].get(event)).toBeUndefined();
  });

  it('should handle participant joined room event', () => {
    const data = { id: '123' } as any;
    const emitSpy = jest.spyOn(room as any, 'emit');
    const expected = room['transfromSocketMesssageToParticipant'](data);

    room['onParticipantJoinedRoom'](data);

    expect(emitSpy).toHaveBeenCalledWith(ParticipantEvent.PARTICIPANT_JOINED, expected);
  });

  it('should handle local participant joined room event', () => {
    const data = { id: '123' } as any;
    const emitSpy = jest.spyOn(room as any, 'emit');
    const updateSpy = jest.spyOn(room['room'].presence, 'update');
    const emitExpected = room['transfromSocketMesssageToParticipant'](data);
    const updateExpcted = room['createParticipant'](params.participant);

    room['onLocalParticipantJoinedRoom'](data);

    expect(updateSpy).toHaveBeenCalledWith(updateExpcted);
    expect(emitSpy).toHaveBeenCalledWith(ParticipantEvent.MY_PARTICIPANT_JOINED, emitExpected);
  });

  it('should handle participant leaves room event', () => {
    const data = { id: '123' } as any;
    const emitSpy = jest.spyOn(room as any, 'emit');
    const expected = room['transfromSocketMesssageToParticipant'](data);

    room['onParticipantLeavesRoom'](data);

    expect(emitSpy).toHaveBeenCalledWith(ParticipantEvent.PARTICIPANT_LEFT, expected);
  });

  it('should handle participant updates event', () => {
    const data = { data: { id: '123' } } as any;
    const emitSpy = jest.spyOn(room as any, 'emit');

    room['onParticipantUpdates'](data);

    expect(emitSpy).toHaveBeenCalledWith(ParticipantEvent.PARTICIPANT_UPDATED, data.data);
  });

  it('should handle local participant updates event', () => {
    const data = { data: { id: '123' } } as any;
    const emitSpy = jest.spyOn(room as any, 'emit');

    room['onLocalParticipantUpdates'](data);

    expect(emitSpy).toHaveBeenCalledWith(ParticipantEvent.MY_PARTICIPANT_UPDATED, data.data);
  });

  it('should handle connection state change', () => {
    const state = { connected: true } as any;
    const logSpy = jest.spyOn(room['logger'], 'log');

    room['onConnectionStateChange'](state);

    expect(logSpy).toHaveBeenCalledWith('connection state changed', state);
  });
});
