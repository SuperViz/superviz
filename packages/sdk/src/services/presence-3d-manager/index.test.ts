import { PresenceEvents } from '@superviz/socket-client';

import { MOCK_IO } from '../../../__mocks__/io.mock';
import { MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import { Participant, Slot } from '../../common/types/participant.types';
import { StoreType } from '../../common/types/stores.types';
import { useStore } from '../../common/utils/use-store';

import { Presence3dEvents } from './types';

import { Presence3DManager } from '.';

describe('Presence3DManager', () => {
  let presence3DManager: Presence3DManager;

  beforeEach(() => {
    const room = new MOCK_IO.Realtime('a', 'b', 'c').connect();

    presence3DManager = new Presence3DManager(room, useStore);

    const { localParticipant } = presence3DManager['useStore'](StoreType.GLOBAL);
    localParticipant.publish(MOCK_LOCAL_PARTICIPANT);
  });

  describe('initializeParticipantsList', () => {
    test('should update the list of participants', () => {
      presence3DManager['unthrottledUpdatePresence3D'] = jest.fn();
      presence3DManager['room'].presence.get = jest.fn().mockImplementation((cb) => {
        cb([MOCK_LOCAL_PARTICIPANT, MOCK_LOCAL_PARTICIPANT]);
      });

      presence3DManager['initializeParticipantsList']();

      expect(presence3DManager['room'].presence.get).toHaveBeenCalled();
      expect(presence3DManager['unthrottledUpdatePresence3D']).toHaveBeenCalledTimes(2);
    });
  });

  describe('onLocalParticipantJoined', () => {
    test('should update the list of participants', () => {
      presence3DManager['initializeParticipantsList'] = jest.fn();
      presence3DManager['room'].emit = jest.fn();
      presence3DManager['room']['isJoined'] = true;

      presence3DManager['room'].presence.update = jest.fn();
      presence3DManager['useStore'] = jest.fn().mockReturnValue({
        hasJoined3D: {
          publish: jest.fn(),
        },
      });
      presence3DManager['onLocalParticipantJoined'](MOCK_LOCAL_PARTICIPANT);

      expect(
        presence3DManager['useStore'](StoreType.PRESENCE_3D).hasJoined3D.publish,
      ).toHaveBeenCalledWith(true);
      expect(presence3DManager['room'].emit).toHaveBeenCalled();
      expect(presence3DManager['room'].presence.update).toHaveBeenCalledWith(
        MOCK_LOCAL_PARTICIPANT,
      );
      expect(presence3DManager['initializeParticipantsList']).toHaveBeenCalled();
    });

    test('should call onLocalParticipantJoined recursively if there is no slot', () => {
      presence3DManager['initializeParticipantsList'] = jest.fn();
      presence3DManager['room'].emit = jest.fn();
      presence3DManager['room'].presence.update = jest.fn();
      presence3DManager['useStore'] = jest.fn().mockReturnValue({
        hasJoined3D: {
          publish: jest.fn(),
        },
      });

      presence3DManager['onLocalParticipantJoined']({
        ...MOCK_LOCAL_PARTICIPANT,
        slot: null as unknown as Slot,
      });

      expect(
        presence3DManager['useStore'](StoreType.PRESENCE_3D).hasJoined3D.publish,
      ).not.toHaveBeenCalled();
      expect(presence3DManager['room'].emit).not.toHaveBeenCalled();
      expect(presence3DManager['room'].presence.update).not.toHaveBeenCalled();
      expect(presence3DManager['initializeParticipantsList']).not.toHaveBeenCalled();
    });

    test('should call onLocalParticipantJoined recursively if did not join room ', () => {
      presence3DManager['initializeParticipantsList'] = jest.fn();
      presence3DManager['room'].emit = jest.fn();
      presence3DManager['room']['isJoined'] = false;
      presence3DManager['room'].presence.update = jest.fn();
      presence3DManager['useStore'] = jest.fn().mockReturnValue({
        hasJoined3D: {
          publish: jest.fn(),
        },
      });

      presence3DManager['onLocalParticipantJoined']({
        ...MOCK_LOCAL_PARTICIPANT,
        slot: {
          index: 1,
        } as Slot,
      });

      expect(
        presence3DManager['useStore'](StoreType.PRESENCE_3D).hasJoined3D.publish,
      ).not.toHaveBeenCalled();
      expect(presence3DManager['room'].emit).not.toHaveBeenCalled();
      expect(presence3DManager['room'].presence.update).not.toHaveBeenCalled();
      expect(presence3DManager['initializeParticipantsList']).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToRoomEvents', () => {
    test('should subscribe to room events', () => {
      presence3DManager['room'].on = jest.fn();
      presence3DManager['room'].presence.on = jest.fn();

      presence3DManager['subscribeToRoomEvents']();

      expect(presence3DManager['room'].on).toHaveBeenCalledWith(
        Presence3dEvents.PARTICIPANT_JOINED,
        presence3DManager['onJoinedRoom'],
      );
      expect(presence3DManager['room'].presence.on).toHaveBeenCalledWith(
        PresenceEvents.LEAVE,
        presence3DManager['onLeaveRoom'],
      );
      expect(presence3DManager['room'].presence.on).toHaveBeenCalledWith(
        PresenceEvents.UPDATE,
        presence3DManager['onParticipantUpdate'],
      );
      expect(presence3DManager['room'].presence.on).toHaveBeenCalledWith(
        PresenceEvents.JOINED_ROOM,
        presence3DManager['onJoinedPresence'],
      );
    });
  });

  describe('unsubscribeFromRoomEvents', () => {
    test('should unsubscribe from room events', () => {
      presence3DManager['room'].off = jest.fn();
      presence3DManager['room'].presence.off = jest.fn();

      presence3DManager['unsubscribeFromRoomEvents']();

      expect(presence3DManager['room'].off).toHaveBeenCalledWith(
        Presence3dEvents.PARTICIPANT_JOINED,
        presence3DManager['onJoinedRoom'],
      );
      expect(presence3DManager['room'].presence.off).toHaveBeenCalledWith(PresenceEvents.LEAVE);
      expect(presence3DManager['room'].presence.off).toHaveBeenCalledWith(PresenceEvents.UPDATE);
      expect(presence3DManager['room'].presence.off).toHaveBeenCalledWith(
        PresenceEvents.JOINED_ROOM,
      );
    });
  });

  describe('onJoinedRoom', () => {
    test('should update the list of participants', () => {
      const { participants } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([{ ...MOCK_LOCAL_PARTICIPANT }]);

      presence3DManager['onJoinedRoom']({
        data: { ...MOCK_LOCAL_PARTICIPANT },
      } as any);

      expect(participants.value).toEqual([MOCK_LOCAL_PARTICIPANT]);
    });
  });

  describe('onLeaveRoom', () => {
    test('should destroy 3d-related dependencies', () => {
      const { participants } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);

      presence3DManager['unsubscribeFromRoomEvents'] = jest.fn();
      presence3DManager['useStore'] = jest.fn().mockReturnValue({
        destroy: jest.fn(),
      });

      presence3DManager['onLeaveRoom']({
        id: MOCK_LOCAL_PARTICIPANT.id,
      } as any);

      expect(presence3DManager['unsubscribeFromRoomEvents']).toHaveBeenCalled();
      expect(presence3DManager['useStore'](StoreType.PRESENCE_3D).destroy).toHaveBeenCalled();
    });

    test('should update the list of participants', () => {
      const { participants } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);

      presence3DManager['unsubscribeFromRoomEvents'] = jest.fn();
      presence3DManager['useStore'] = jest.fn().mockReturnValue({
        destroy: jest.fn(),
        participants: {
          publish: jest.fn(),
          value: [MOCK_LOCAL_PARTICIPANT],
        },
      });

      presence3DManager['onLeaveRoom']({
        id: '123',
      } as any);

      expect(presence3DManager['unsubscribeFromRoomEvents']).not.toHaveBeenCalled();
      expect(presence3DManager['useStore'](StoreType.PRESENCE_3D).destroy).not.toHaveBeenCalled();
    });
  });

  describe('unthrottledUpdatePresence3D', () => {
    test('should update the list of participants', () => {
      const { participants, hasJoined3D } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);
      hasJoined3D.publish(true);

      const modifiedLocalParticipant = {
        ...MOCK_LOCAL_PARTICIPANT,
        name: 'new name',
      };

      presence3DManager['unthrottledUpdatePresence3D'](modifiedLocalParticipant);

      expect(participants.value).toEqual([modifiedLocalParticipant]);
    });

    test('should update the list of participants if hasJoined3D is false', () => {
      const { participants, hasJoined3D } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);
      hasJoined3D.publish(false);

      const modifiedLocalParticipant = {
        ...MOCK_LOCAL_PARTICIPANT,
        name: 'new name',
      };

      presence3DManager['unthrottledUpdatePresence3D'](modifiedLocalParticipant);

      expect(participants.value).toEqual([modifiedLocalParticipant]);
    });

    test('should not update the list of participants if participant has no id', () => {
      const { participants, hasJoined3D } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);
      hasJoined3D.publish(true);

      const modifiedLocalParticipant = {
        ...MOCK_LOCAL_PARTICIPANT,
        name: 'new name',
        id: undefined,
      } as unknown as Participant;

      presence3DManager['unthrottledUpdatePresence3D'](modifiedLocalParticipant);

      expect(participants.value).not.toEqual([modifiedLocalParticipant]);
    });

    test('should not update presence if has not joined room', () => {
      const { participants, hasJoined3D } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);
      hasJoined3D.publish(false);

      presence3DManager['unthrottledUpdatePresence3D']({
        ...MOCK_LOCAL_PARTICIPANT,
        id: '123',
      });

      expect(presence3DManager['room'].presence.update).not.toHaveBeenCalledTimes(2);
    });

    test('should not update presence if participant is not local', () => {
      const { participants, hasJoined3D } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);
      hasJoined3D.publish(true);

      presence3DManager['unthrottledUpdatePresence3D']({
        ...MOCK_LOCAL_PARTICIPANT,
        id: '123',
      });

      expect(presence3DManager['room'].presence.update).not.toHaveBeenCalledTimes(2);
    });

    test('should update presence if participant is local', () => {
      const { participants, hasJoined3D } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);
      hasJoined3D.publish(true);

      const modifiedLocalParticipant = {
        ...MOCK_LOCAL_PARTICIPANT,
        name: 'new name',
      };

      presence3DManager['unthrottledUpdatePresence3D'](modifiedLocalParticipant);

      expect(presence3DManager['room'].presence.update).toHaveBeenCalledWith(
        modifiedLocalParticipant,
      );
    });
  });

  describe('onJoinedPresence', () => {
    test('should call onLocalParticipantJoined if participant is local', () => {
      presence3DManager['onLocalParticipantJoined'] = jest.fn();

      presence3DManager['onJoinedPresence']({
        id: MOCK_LOCAL_PARTICIPANT.id,
      } as any);

      expect(presence3DManager['onLocalParticipantJoined']).toHaveBeenCalledWith(
        MOCK_LOCAL_PARTICIPANT,
      );
    });

    test('should not call onLocalParticipantJoined if participant is not local', () => {
      presence3DManager['onLocalParticipantJoined'] = jest.fn();

      presence3DManager['onJoinedPresence']({
        id: '123',
      } as any);

      expect(presence3DManager['onLocalParticipantJoined']).not.toHaveBeenCalled();
    });
  });

  describe('updatePresence3D', () => {
    test('should call unthrottledUpdatePresence3D', () => {
      presence3DManager['unthrottledUpdatePresence3D'] = jest.fn();

      presence3DManager['updatePresence3D'](MOCK_LOCAL_PARTICIPANT as any);

      expect(presence3DManager['unthrottledUpdatePresence3D']).toHaveBeenCalledWith(
        MOCK_LOCAL_PARTICIPANT,
      );
    });
  });

  describe('onParticipantUpdate', () => {
    beforeEach(() => {
      presence3DManager['localParticipant'] = { id: 'random-id' };
    });

    test('should update the list of participants', () => {
      const { participants } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);

      presence3DManager['onParticipantUpdate']({
        id: MOCK_LOCAL_PARTICIPANT.id,
        data: { ...MOCK_LOCAL_PARTICIPANT, name: 'new name' },
      } as any);

      expect(participants.value).toEqual([{ ...MOCK_LOCAL_PARTICIPANT, name: 'new name' }]);
    });

    test('should not update the list of participants if participant is local', () => {
      const { participants } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);

      presence3DManager['onParticipantUpdate']({
        id: '123',
        data: { ...MOCK_LOCAL_PARTICIPANT, name: 'new name' },
      } as any);

      expect(participants.value).toEqual([MOCK_LOCAL_PARTICIPANT]);
    });

    test('should publish the updated participant if observer exists', () => {
      const { participants } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);

      presence3DManager['participants3DObservers'] = {
        [MOCK_LOCAL_PARTICIPANT.id]: {
          publish: jest.fn(),
        },
      } as any;

      presence3DManager['onParticipantUpdate']({
        id: MOCK_LOCAL_PARTICIPANT.id,
        data: { ...MOCK_LOCAL_PARTICIPANT, name: 'new name' },
      } as any);

      expect(
        presence3DManager['participants3DObservers'][MOCK_LOCAL_PARTICIPANT.id].publish,
      ).toHaveBeenCalledWith({ ...MOCK_LOCAL_PARTICIPANT, name: 'new name' });
    });

    test('should not publish the updated participant if observer does not exist', () => {
      const { participants } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);

      presence3DManager['participants3DObservers'] = {} as any;

      presence3DManager['onParticipantUpdate']({
        id: MOCK_LOCAL_PARTICIPANT.id,
        data: { ...MOCK_LOCAL_PARTICIPANT, name: 'new name' },
      } as any);

      expect(
        presence3DManager['participants3DObservers'][MOCK_LOCAL_PARTICIPANT.id],
      ).toBeUndefined();
    });

    test('should not update the list of participants if participant does not exist', () => {
      const { participants } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);

      presence3DManager['onParticipantUpdate']({
        id: '123',
        data: { ...MOCK_LOCAL_PARTICIPANT, name: 'new name' },
      } as any);

      expect(participants.value).toEqual([MOCK_LOCAL_PARTICIPANT]);
    });
  });

  describe('subscribeToUpdates', () => {
    test('should subscribe to a participant updates', () => {
      presence3DManager['participants3DObservers'] = {} as any;

      presence3DManager['subscribeToUpdates']('123', jest.fn());

      expect(presence3DManager['participants3DObservers']['123']).toBeDefined();
    });
  });

  describe('unsubscribeFromUpdates', () => {
    test('should unsubscribe from a participant updates', () => {
      presence3DManager['participants3DObservers'] = {
        '123': {
          unsubscribe: jest.fn(),
        },
      } as any;

      presence3DManager['unsubscribeFromUpdates']('123', jest.fn());

      expect(presence3DManager['participants3DObservers']['123'].unsubscribe).toHaveBeenCalled();
    });

    test('should not unsubscribe from a participant updates if observer does not exist', () => {
      presence3DManager['participants3DObservers'] = {} as any;

      presence3DManager['unsubscribeFromUpdates']('123', jest.fn());

      expect(presence3DManager['participants3DObservers']['123']).toBeUndefined();
    });
  });

  describe('setParticipantData', () => {
    test('should update the participant data', () => {
      presence3DManager['updatePresence3D'] = jest.fn() as any;

      presence3DManager['setParticipantData'](MOCK_LOCAL_PARTICIPANT as any);

      expect(presence3DManager['updatePresence3D']).toHaveBeenCalledWith(MOCK_LOCAL_PARTICIPANT);
    });
  });

  describe('getParticipants', () => {
    test('should return the list of participants', () => {
      const { participants } = presence3DManager['useStore'](StoreType.PRESENCE_3D);
      participants.publish([MOCK_LOCAL_PARTICIPANT as Participant]);

      expect(presence3DManager['getParticipants']).toEqual([MOCK_LOCAL_PARTICIPANT]);
    });
  });
});
