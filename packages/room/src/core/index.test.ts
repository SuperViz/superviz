import { PresenceEvent } from '@superviz/socket-client';
import { Subject } from 'rxjs';

import { ParticipantType } from '../common/types/participant.types';
import { Logger } from '../common/utils/logger';
import config from '../services/config';
import { IOC } from '../services/io';
import { IOCState } from '../services/io/types';
import { StoreType } from '../stores/common/types';
import { useStore } from '../stores/common/use-store';

import { ParticipantEvent, RoomParams, RoomState } from './types';

import { Room } from './index';

jest.mock('../services/io', () => ({
  IOC: jest.fn().mockImplementation(() => ({
    stateSubject: new Subject(),
    destroy: jest.fn(),
    createRoom: jest.fn(() => ({
      disconnect: jest.fn(),
      presence: {
        get: jest.fn(),
        off: jest.fn(),
        on: jest.fn(),
        update: jest.fn(),
      },
    })),
  })),
}));

jest.mock('../services/api', () => ({
  ApiService: {
    sendActivity: jest.fn(() => Promise.resolve()),
  },
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
    room.leave();
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
    expect(room['observers'].size).toBe(0);
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

    expect(emitSpy).toHaveBeenCalledWith(ParticipantEvent.PARTICIPANT_JOINED, {
      ...expected,
      slot: {
        ...expected.slot,
        timestamp: expect.any(Number),
      },
    });
  });

  it('should handle local participant joined room event', async () => {
    const data = { id: '123' } as any;
    const emitSpy = jest.spyOn(room as any, 'emit');
    const updateSpy = jest.spyOn(room['room'].presence, 'update');
    const emitExpected = room['transfromSocketMesssageToParticipant'](data);
    const updateExpected = room['createParticipant'](params.participant);

    await room['onLocalParticipantJoinedRoom'](data);

    expect(updateSpy).toHaveBeenCalledWith({
      ...updateExpected,
      slot: {
        ...updateExpected.slot,
        timestamp: expect.any(Number),
      },
    });
    expect(emitSpy).toHaveBeenCalledWith(ParticipantEvent.MY_PARTICIPANT_JOINED, {
      ...emitExpected,
      slot: {
        ...emitExpected.slot,
        timestamp: expect.any(Number),
      },
    });
  });

  it('should handle participant leaves room event', () => {
    const data = { id: '123' } as any;
    const emitSpy = jest.spyOn(room as any, 'emit');
    const expected = room['transfromSocketMesssageToParticipant'](data);

    room['onParticipantLeavesRoom'](data);

    expect(emitSpy).toHaveBeenCalledWith(ParticipantEvent.PARTICIPANT_LEFT, {
      ...expected,
      slot: {
        ...expected.slot,
        timestamp: expect.any(Number),
      },
    });
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

  it('should handle the same account error', () => {
    const emitSpy = jest.spyOn(room as any, 'emit');
    const leaveSpy = jest.spyOn(room, 'leave');

    room['onConnectionStateChange'](IOCState.SAME_ACCOUNT_ERROR);

    expect(leaveSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(
      'room.error',
      {
        code: 'same_account_error',
        message: '[SuperViz] Room initialization failed: the user is already connected to the room. Please verify if the user is connected with the same account and try again.',
      },
    );
  });

  it('should handle the authentication error', () => {
    const emitSpy = jest.spyOn(room as any, 'emit');
    const leaveSpy = jest.spyOn(room, 'leave');

    room['onConnectionStateChange'](IOCState.AUTH_ERROR);

    expect(emitSpy).toHaveBeenCalledWith(
      'room.error',
      {
        code: 'auth_error',
        message: "[SuperViz] Room initialization failed: this website's domain is not whitelisted. If you are the developer, please add your domain in https://dashboard.superviz.com/developer",
      },
    );

    expect(leaveSpy).toHaveBeenCalled();
    expect(room['room'].disconnect).toHaveBeenCalled();
  });

  it('should update the room state', () => {
    const state = IOCState.CONNECTED;
    const emitSpy = jest.spyOn(room as any, 'emit');

    room['onConnectionStateChange'](state);

    expect(room['state']).toBe(state);
    expect(emitSpy).toHaveBeenCalledWith('room.update', { status: state });
  });

  it('should get participants when room is connected', async () => {
    room['state'] = RoomState.CONNECTED;

    const date = Date.now();

    const mockParticipants: PresenceEvent[] = [
      {
        id: '1',
        name: 'Participant 1',
        data: {
          email: null,
        },
        connectionId: 'conn-1',
        timestamp: date,
      },
    ];
    room['room'].presence.get = jest.fn((callback) => callback(mockParticipants));

    const participants = await room.getParticipants();

    expect(participants).toEqual([{
      id: '1',
      name: 'Participant 1',
      email: null,
      slot: {
        index: null,
        color: '#878291',
        textColor: '#fff',
        colorName: 'gray',
        timestamp: expect.any(Number),
      },
      avatar: {
        imageUrl: null,
        model3DUrl: null,
      },
      type: ParticipantType.GUEST,
      activeComponents: [],
    }]);

    expect(Object.keys(room['participants']).length).toBe(mockParticipants.length);
  });

  it('should return empty array when room is not connected', async () => {
    room['state'] = RoomState.DISCONNECTED;

    const participants = await room.getParticipants();

    expect(participants).toEqual([]);
  });

  it('should handle local participant joined room event and attach components after join', async () => {
    const data = { id: '123' } as any;
    const emitSpy = jest.spyOn(room as any, 'emit');
    const updateSpy = jest.spyOn(room['room'].presence, 'update');
    const addComponentSpy = jest.spyOn(room as any, 'addComponent');
    const emitExpected = room['transfromSocketMesssageToParticipant'](data);
    const updateExpected = room['createParticipant'](params.participant);

    const mockComponent = { name: 'mockComponent', attach: jest.fn() } as any;
    room['componentsToAttachAfterJoin'].add(mockComponent);

    await room['onLocalParticipantJoinedRoom'](data);

    expect(updateSpy).toHaveBeenCalledWith({
      ...updateExpected,
      slot: {
        ...updateExpected.slot,
        timestamp: expect.any(Number),
      },
    });
    expect(emitSpy).toHaveBeenCalledWith(ParticipantEvent.MY_PARTICIPANT_JOINED, {
      ...emitExpected,
      slot: {
        ...emitExpected.slot,
        timestamp: expect.any(Number),
      },
    });
    expect(addComponentSpy).toHaveBeenCalledWith(mockComponent);
  });

  it('should handle local participant joined room event and not attach components if none are pending', async () => {
    const data = { id: '123' } as any;
    const emitSpy = jest.spyOn(room as any, 'emit');
    const updateSpy = jest.spyOn(room['room'].presence, 'update');
    const addComponentSpy = jest.spyOn(room as any, 'addComponent');
    const emitExpected = room['transfromSocketMesssageToParticipant'](data);
    const updateExpected = room['createParticipant'](params.participant);

    await room['onLocalParticipantJoinedRoom'](data);

    expect(updateSpy).toHaveBeenCalledWith({
      ...updateExpected,
      slot: {
        ...updateExpected.slot,
        timestamp: expect.any(Number),
      },
    });
    expect(emitSpy).toHaveBeenCalledWith(ParticipantEvent.MY_PARTICIPANT_JOINED, {
      ...emitExpected,
      slot: {
        ...emitExpected.slot,
        timestamp: expect.any(Number),
      },
    });
    expect(addComponentSpy).not.toHaveBeenCalled();
  });

  it('should add a component when the room is connected', async () => {
    room['state'] = RoomState.CONNECTED;
    const mockComponent = { name: 'mockComponent', attach: jest.fn() } as any;
    const canAddComponentSpy = jest.spyOn(room as any, 'canAddComponent').mockReturnValue(true);
    const updateParticipantSpy = jest.spyOn(room as any, 'updateParticipant');
    const { hasJoinedRoom } = useStore(StoreType.GLOBAL);
    hasJoinedRoom.publish(true);

    await room.addComponent(mockComponent);

    expect(canAddComponentSpy).toHaveBeenCalledWith(mockComponent);
    expect(mockComponent.attach).toHaveBeenCalled();
    expect(room['activeComponents'].has(mockComponent.name)).toBe(true);
    expect(room['componentInstances'].get(mockComponent.name)).toBe(mockComponent);
    expect(updateParticipantSpy).toHaveBeenCalledWith({ activeComponents: [mockComponent.name] });
  });

  it('should not add a component when the room is not connected', async () => {
    room['state'] = RoomState.DISCONNECTED;
    const mockComponent = { name: 'mockComponent', attach: jest.fn() } as any;
    const canAddComponentSpy = jest.spyOn(room as any, 'canAddComponent').mockReturnValue(false);

    await room.addComponent(mockComponent);

    expect(canAddComponentSpy).toHaveBeenCalledWith(mockComponent);
    expect(mockComponent.attach).not.toHaveBeenCalled();
    expect(room['activeComponents'].has(mockComponent.name)).toBe(false);
    expect(room['componentInstances'].get(mockComponent.name)).toBeUndefined();
  });

  it('should remove a component when it is active', async () => {
    const mockComponent = { name: 'mockComponent', detach: jest.fn() } as any;
    room['activeComponents'].add(mockComponent.name);
    room['componentInstances'].set(mockComponent.name, mockComponent);
    const updateParticipantSpy = jest.spyOn(room as any, 'updateParticipant');

    await room.removeComponent(mockComponent);

    expect(mockComponent.detach).toHaveBeenCalled();
    expect(room['activeComponents'].has(mockComponent.name)).toBe(false);
    expect(room['componentInstances'].get(mockComponent.name)).toBeUndefined();
    expect(updateParticipantSpy).toHaveBeenCalledWith({ activeComponents: [] });
  });

  it('should not remove a component when it is not active', async () => {
    const mockComponent = { name: 'mockComponent', detach: jest.fn() } as any;

    await room.removeComponent(mockComponent);

    expect(mockComponent.detach).not.toHaveBeenCalled();
    expect(room['activeComponents'].has(mockComponent.name)).toBe(false);
    expect(room['componentInstances'].get(mockComponent.name)).toBeUndefined();
  });

  it('should return true when a component can be added', () => {
    const mockComponent = { name: 'mockComponent' } as any;
    jest.spyOn(config, 'get').mockReturnValue(true);
    jest.spyOn(room as any, 'checkComponentLimit').mockReturnValue({ canUse: true, maxParticipants: 50 });
    room['isDestroyed'] = false;
    room['activeComponents'].clear();

    const result = room['canAddComponent'](mockComponent);

    expect(result).toBe(true);
  });

  it('should return false when a component cannot be added', () => {
    const mockComponent = { name: 'mockComponent' } as any;
    jest.spyOn(config, 'get').mockReturnValue(false);
    jest.spyOn(room as any, 'checkComponentLimit').mockReturnValue({ canUse: false, maxParticipants: 50 });
    room['isDestroyed'] = true;
    room['activeComponents'].add(mockComponent.name);

    const result = room['canAddComponent'](mockComponent);

    expect(result).toBe(false);
  });
});
