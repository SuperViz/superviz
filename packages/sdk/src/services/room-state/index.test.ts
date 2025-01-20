import { TextEncoder, TextDecoder } from 'util';

import { PresenceEvent, PresenceEvents } from '@superviz/socket-client';

import { MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import { TranscriptState } from '../../common/types/events.types';
import { Participant } from '../../common/types/participant.types';
import { RealtimeStateTypes } from '../../common/types/realtime.types';
import { StoreType } from '../../common/types/stores.types';
import { Logger } from '../../common/utils';
import { useStore } from '../../common/utils/use-store';
import { IOC } from '../io';
import { DrawingData } from '../video-conference-manager/types';

import { RoomPropertiesEvents } from './type';

import { RoomStateService } from '.';

Object.assign(global, { TextDecoder, TextEncoder });

function createInstance() {
  const ioc = new IOC(MOCK_LOCAL_PARTICIPANT);
  const room = ioc.createRoom('test-room-state-service');
  const drawingRoom = ioc.createRoom('test-drawing-room');
  const logger = new Logger('Room State Service');
  return new RoomStateService(room, drawingRoom, logger, useStore);
}

describe('roomState', () => {
  let serviceInstance: RoomStateService;
  beforeEach(() => {
    serviceInstance = createInstance();
    const { localParticipant } = serviceInstance['useStore'](StoreType.GLOBAL);
    localParticipant.publish(MOCK_LOCAL_PARTICIPANT);
  });

  afterEach(() => {
    const { localParticipant } = useStore(StoreType.GLOBAL);
    localParticipant.publish(MOCK_LOCAL_PARTICIPANT);
  });

  describe('constructor', () => {
    test('should create an instance of RoomStateService', () => {
      const { localParticipant } = serviceInstance['useStore'](StoreType.GLOBAL);

      expect(serviceInstance).toBeInstanceOf(RoomStateService);
      expect(serviceInstance).toHaveProperty('room');
      expect(serviceInstance).toHaveProperty('logger');
      expect(serviceInstance).toHaveProperty('kickParticipantObserver');
      expect(serviceInstance).toHaveProperty('enableSync', true);
      expect(serviceInstance).toHaveProperty('myParticipant', MOCK_LOCAL_PARTICIPANT);
      expect(localParticipant.value).toEqual(MOCK_LOCAL_PARTICIPANT);
      expect(serviceInstance['participants']).toEqual({});
    });
  });

  describe('join', () => {
    test('should subscribe to room events', () => {
      const onParticipantLeave = jest.spyOn(serviceInstance as any, 'onParticipantLeave');
      const onPresenceEnter = jest.spyOn(serviceInstance as any, 'onPresenceEnter');
      const updateLocalRoomState = jest.spyOn(serviceInstance as any, 'updateLocalRoomState');

      serviceInstance['join']();

      expect(serviceInstance['room'].presence.on).toBeCalledWith(
        PresenceEvents.LEAVE,
        onParticipantLeave,
      );
      expect(serviceInstance['room'].presence.on).toBeCalledWith(
        PresenceEvents.JOINED_ROOM,
        onPresenceEnter,
      );

      expect(serviceInstance['room'].on).toBeCalledWith(
        RoomPropertiesEvents.UPDATE,
        updateLocalRoomState,
      );
    });
  });

  describe('updateMyProperties', () => {
    test('should update my properties', () => {
      const update = jest.spyOn(serviceInstance['room'].presence, 'update');
      const logger = jest.spyOn(serviceInstance['logger'], 'log');

      serviceInstance.updateMyProperties({ name: 'new name' });

      expect(update).toBeCalledWith({ ...MOCK_LOCAL_PARTICIPANT, name: 'new name' });
      expect(logger).toBeCalledWith('REALTIME', 'updating my properties', {
        ...MOCK_LOCAL_PARTICIPANT,
        name: 'new name',
      });
    });

    test('should not update my properties if message is too big', () => {
      const update = jest.spyOn(serviceInstance['room'].presence, 'update');
      const logger = jest.spyOn(serviceInstance['logger'], 'log');

      serviceInstance.updateMyProperties({ name: 'new message'.repeat(5454) });

      expect(update).not.toBeCalled();
      expect(logger).toBeCalledWith('Message too long, the message limit size is 60kb.');
    });

    test('should not update my properties if left', () => {
      const update = jest.spyOn(serviceInstance['room'].presence, 'update');
      const logger = jest.spyOn(serviceInstance['logger'], 'log');

      serviceInstance['left'] = true;
      serviceInstance.updateMyProperties({ name: 'new name' });

      expect(update).not.toBeCalled();
      expect(logger).not.toBeCalled();
    });

    test('should not update my properties if sync is disabled', () => {
      const update = jest.spyOn(serviceInstance['room'].presence, 'update');
      const logger = jest.spyOn(serviceInstance['logger'], 'log');

      serviceInstance['enableSync'] = false;
      serviceInstance.updateMyProperties({ name: 'new name' });

      expect(update).not.toBeCalled();
      expect(logger).not.toBeCalled();
    });

    test('should not update my properties if sync is frozen', () => {
      const update = jest.spyOn(serviceInstance['room'].presence, 'update');
      const logger = jest.spyOn(serviceInstance['logger'], 'log');

      serviceInstance['isSyncFrozen'] = true;
      serviceInstance.updateMyProperties({ name: 'new name' });

      expect(update).not.toBeCalled();
      expect(logger).not.toBeCalled();
    });
  });

  describe('updateRoomProperties', () => {
    test('should update room properties', () => {
      const emit = jest.spyOn(serviceInstance['room'], 'emit');

      serviceInstance['updateRoomProperties']({ hostClientId: 'new host' });

      expect(emit).toBeCalledWith(RoomPropertiesEvents.UPDATE, { hostClientId: 'new host' });
    });

    test('should not update room properties if message is too big', () => {
      const emit = jest.spyOn(serviceInstance['room'], 'emit');

      serviceInstance['updateRoomProperties']({ hostClientId: 'new message'.repeat(5454) });

      expect(emit).not.toBeCalled();
    });

    test('should not update room properties if left', () => {
      const emit = jest.spyOn(serviceInstance['room'], 'emit');

      serviceInstance['left'] = true;
      serviceInstance['updateRoomProperties']({ hostClientId: 'new host' });

      expect(emit).not.toBeCalled();
    });

    test('should not update room properties if sync is frozen', () => {
      const emit = jest.spyOn(serviceInstance['room'], 'emit');

      serviceInstance['isSyncFrozen'] = true;
      serviceInstance['updateRoomProperties']({ hostClientId: 'new host' });

      expect(emit).not.toBeCalled();
    });
  });

  describe('set properties', () => {
    test('should setHost', () => {
      const updateRoomProperties = jest.spyOn(serviceInstance as any, 'updateRoomProperties');
      serviceInstance.setHost('new host');
      expect(updateRoomProperties).toBeCalledWith({ hostClientId: 'new host' });
    });

    test('should setKickParticipant', () => {
      const updateRoomProperties = jest.spyOn(serviceInstance as any, 'updateRoomProperties');
      const { participants } = serviceInstance['useStore'](StoreType.GLOBAL);
      participants.publish({ 'new host': 'new host participant' as any });

      serviceInstance.setKickParticipant('new host');
      expect(updateRoomProperties).toBeCalledWith({ kickParticipant: 'new host participant' });
    });

    test('should setGridMode', () => {
      const updateRoomProperties = jest.spyOn(serviceInstance as any, 'updateRoomProperties');
      serviceInstance.setGridMode(true);
      expect(updateRoomProperties).toBeCalledWith({ isGridModeEnabled: true });
    });

    test('should setDrawing', () => {
      const updateDrawingProperties = jest.spyOn(serviceInstance as any, 'updateDrawingProperties');
      serviceInstance.setDrawing({ data: 'drawing data' } as any);
      expect(updateDrawingProperties).toBeCalledWith({ data: 'drawing data' });
    });

    test('should setTranscript', () => {
      const updateRoomProperties = jest.spyOn(serviceInstance as any, 'updateRoomProperties');
      serviceInstance.setTranscript('transcript data' as any);
      expect(updateRoomProperties).toBeCalledWith({ transcript: 'transcript data' });
    });
  });

  describe('initializeRoomProperties', () => {
    test('should initialize room properties', () => {
      const updateRoomProperties = jest.spyOn(serviceInstance as any, 'updateRoomProperties');
      serviceInstance['initializeRoomProperties']();
      expect(updateRoomProperties).toBeCalledWith({
        isGridModeEnabled: false,
        hostClientId: null,
        followParticipantId: null,
        gather: false,
        transcript: TranscriptState.TRANSCRIPT_STOP,
        kickParticipant: null,
      });
    });
  });

  describe('onParticipantLeave', () => {
    test('should set left to true if my participant left', () => {
      serviceInstance['initializeRoomProperties']();

      const event: PresenceEvent = {
        connectionId: 'connectionId',
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: 'name',
        timestamp: 123,
        data: {},
      };

      const setFollowParticipant = jest.spyOn(serviceInstance as any, 'setFollowParticipant');
      serviceInstance['onParticipantLeave'](event);
      expect(serviceInstance['left']).toBe(true);
      expect(setFollowParticipant).not.toBeCalled();
    });

    test('should setFollowParticipant if followed participant left', () => {
      const setFollowParticipant = jest.spyOn(serviceInstance as any, 'setFollowParticipant');
      serviceInstance['initializeRoomProperties']();

      const event: PresenceEvent = {
        connectionId: 'connectionId',
        id: 'followed participant',
        name: 'name',
        timestamp: 123,
        data: {},
      };

      serviceInstance['localRoomProperties']!.followParticipantId = 'followed participant';
      serviceInstance['onParticipantLeave'](event);
      expect(setFollowParticipant).toBeCalled();
    });
  });

  describe('fetchRoomProperties', () => {
    beforeEach(() => {
      serviceInstance['room'].presence.get = jest.fn((callback) => callback([
        {
          connectionId: 'connectionId 1',
          id: 'id 1',
          name: 'name 1',
          timestamp: 1233,
          data: {},
        },
        {
          connectionId: 'connectionId 2',
          id: 'id 2',
          name: 'name 2',
          timestamp: 1234,
          data: {},
        },
      ]));
    });

    test('should fetch room properties', async () => {
      const history = jest
        .fn()
        .mockImplementation((cb) => cb({ events: [{ data: 'room properties' }] }));
      serviceInstance['room'].history = history;

      const result = await serviceInstance['fetchRoomProperties']();
      expect(result).toBe('room properties');
    });

    test('should return null if timestamp is older than 1 hour', async () => {
      const history = jest.fn().mockImplementation((cb) => cb({ events: [{ timestamp: 123 }] }));
      serviceInstance['room'].history = history;

      const result = await serviceInstance['fetchRoomProperties']();
      expect(result).toBe(null);
    });

    test('should return null if no last message', async () => {
      const history = jest.fn().mockImplementation((cb) => cb({ events: [] }));
      serviceInstance['room'].history = history;

      const result = await serviceInstance['fetchRoomProperties']();
      expect(result).toBe(null);
    });

    test('should return null if participant is alone in the room', async () => {
      serviceInstance['room'].presence.get = jest.fn((callback) => callback([]));

      const result = await serviceInstance['fetchRoomProperties']();
      expect(result).toBe(null);
    });
  });

  describe('start', () => {
    test('should initialize room properties if no last message', async () => {
      const history = jest.fn().mockImplementation((cb) => cb({ events: [] }));
      serviceInstance['room'].history = history;
      serviceInstance['room'].presence.get = jest.fn((callback) => callback([
        {
          connectionId: 'connectionId 1',
          id: 'id 1',
          name: 'name 1',
          timestamp: 1233,
          data: {},
        },
        {
          connectionId: 'connectionId 2',
          id: 'id 2',
          name: 'name 2',
          timestamp: 1234,
          data: {},
        },
      ]));

      const fetchRoomProperties = jest.spyOn(serviceInstance as any, 'fetchRoomProperties');
      const initializeRoomProperties = jest.spyOn(
        serviceInstance as any,
        'initializeRoomProperties',
      );
      const updateLocalRoomState = jest.spyOn(serviceInstance as any, 'updateLocalRoomState');
      const publishStateUpdate = jest.spyOn(serviceInstance as any, 'publishStateUpdate');

      await serviceInstance['start']();

      expect(fetchRoomProperties).toBeCalled();
      expect(initializeRoomProperties).toBeCalled();
      expect(updateLocalRoomState).not.toBeCalled();
      expect(publishStateUpdate).toBeCalledWith(RealtimeStateTypes.CONNECTED);
    });

    test('should update room properties if last message', async () => {
      const fetchRoomProperties = jest.spyOn(serviceInstance as any, 'fetchRoomProperties');
      const initializeRoomProperties = jest.spyOn(
        serviceInstance as any,
        'initializeRoomProperties',
      );
      const updateLocalRoomState = jest.spyOn(serviceInstance as any, 'updateLocalRoomState');
      const publishStateUpdate = jest.spyOn(serviceInstance as any, 'publishStateUpdate');

      fetchRoomProperties.mockResolvedValue({ isGridModeEnabled: true });

      await serviceInstance['start']();

      expect(fetchRoomProperties).toBeCalled();
      expect(initializeRoomProperties).not.toBeCalled();
      expect(updateLocalRoomState).toBeCalledWith({ data: { isGridModeEnabled: true } });
      expect(publishStateUpdate).toBeCalledWith(RealtimeStateTypes.CONNECTED);
    });
  });

  describe('publishStateUpdate', () => {
    test('should publish state update', () => {
      const publish = jest.fn();
      serviceInstance['state'] = RealtimeStateTypes.DISCONNECTED;
      serviceInstance['useStore'] = jest.fn().mockReturnValue({ meetingState: { publish } });

      serviceInstance['publishStateUpdate'](RealtimeStateTypes.CONNECTED);

      expect(publish).toBeCalledWith(RealtimeStateTypes.CONNECTED);
    });

    test('should not publish state update if state is the same', () => {
      const publish = jest.fn();
      const { meetingState } = serviceInstance['useStore'](StoreType.VIDEO);
      meetingState.publish = publish;

      serviceInstance['state'] = RealtimeStateTypes.CONNECTED;
      serviceInstance['publishStateUpdate'](RealtimeStateTypes.CONNECTED);

      expect(publish).not.toBeCalled();
    });
  });

  describe('onPresenceEnter', () => {
    test('should call updateMyProperties', () => {
      serviceInstance['updateMyProperties'] = jest.fn();
      serviceInstance['onPresenceEnter']();
      expect(serviceInstance['updateMyProperties']).toBeCalled();
    });
  });

  describe('setGather', () => {
    test('should update room properties', () => {
      serviceInstance['updateRoomProperties'] = jest.fn();
      serviceInstance['setGather'](true);
      expect(serviceInstance['updateRoomProperties']).toBeCalledWith({ gather: true });
    });
  });

  describe('setFollowParticipant', () => {
    test('should update room properties', () => {
      serviceInstance['updateRoomProperties'] = jest.fn();
      serviceInstance['setFollowParticipant']('id');
      expect(serviceInstance['updateRoomProperties']).toBeCalledWith({
        followParticipantId: 'id',
      });
    });
  });

  /**
   * private updateLocalRoomState = async ({ data }: { data: VideoRoomProperties }): Promise<void> => {
    this.logger.log('REALTIME', 'Room update received', data);
    this.localRoomProperties = Object.assign({}, this.localRoomProperties, data);

    const { drawing, followParticipantId, gather, hostId, isGridModeEnabled, transcript } =
      this.useStore(StoreType.VIDEO);

    drawing.publish(data.drawing);
    followParticipantId.publish(data.followParticipantId);
    gather.publish(data.gather);
    hostId.publish(data.hostClientId);
    isGridModeEnabled.publish(data.isGridModeEnabled);
    transcript.publish(data.transcript);

    if (data.kickParticipant && data.kickParticipant.id === this.myParticipant.id) {
      this.updateRoomProperties({ kickParticipant: null });

      this.kickParticipantObserver.publish(this.myParticipant.id);
    }
  };
   */

  describe('updateLocalRoomState', () => {
    test('should publish new properties', () => {
      const publish = jest.fn();
      serviceInstance['kickParticipantObserver'] = { publish } as any;

      serviceInstance['useStore'] = jest.fn().mockReturnValue({
        drawing: { publish },
        followParticipantId: { publish },
        gather: { publish },
        hostId: { publish },
        isGridModeEnabled: { publish },
        transcript: { publish },
      });

      serviceInstance['updateLocalRoomState']({
        data: {
          followParticipantId: 'followParticipantId',
          gather: true,
          hostClientId: 'hostClientId',
          isGridModeEnabled: true,
          transcript: TranscriptState.TRANSCRIPT_RUNNING,
          kickParticipant: { id: MOCK_LOCAL_PARTICIPANT.id } as PresenceEvent<Participant>,
        },
      });

      expect(publish).toBeCalledTimes(6);
    });

    test('should not publish new properties if kickParticipant is not me', () => {
      const publish = jest.fn();
      serviceInstance['kickParticipantObserver'] = { publish } as any;
      serviceInstance['updateLocalRoomState']({
        data: {
          kickParticipant: { id: 'not me' } as PresenceEvent<Participant>,
        },
      });

      expect(publish).toBeCalledTimes(0);
    });
  });

  describe('freezaSync', () => {
    test('should freeze sync', () => {
      serviceInstance['room'].presence.off = jest.fn();
      serviceInstance['room'].off = jest.fn();

      serviceInstance['freezeSync'](true);

      expect(serviceInstance['isSyncFrozen']).toBe(true);
      expect(serviceInstance['room'].presence.off).toBeCalledTimes(2);
      expect(serviceInstance['room'].off).toBeCalledTimes(1);
    });

    test('should unfreeze sync', () => {
      serviceInstance['join'] = jest.fn();
      serviceInstance['freezeSync'](false);

      expect(serviceInstance['isSyncFrozen']).toBe(false);
      expect(serviceInstance['join']).toBeCalled();
    });
  });

  describe('destroy', () => {
    test('should destroy room state service', () => {
      const off = jest.fn();
      serviceInstance['room'].presence.off = off;
      serviceInstance['room'].off = off;

      serviceInstance['destroy']();

      expect(off).toBeCalledTimes(3);
    });
  });
});
