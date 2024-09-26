import { beforeAll } from '@jest/globals';
import type { PresenceEvent } from '@superviz/socket-client';
import * as Y from 'yjs';

import { MOCK_ROOM, mockPresenceListOnce } from '../../../__mocks__/io.mock';
import { createRoom } from '../../common/utils/createRoom';
import { Logger } from '../logger';

import { UpdateOrigin, UpdatePresence } from './types';

import { Awareness } from '.';

function createAwareness(): Awareness {
  const doc = new Y.Doc();
  const participantId = 'local-participant-id';
  const logger = new Logger('awareness test');
  return new Awareness(doc, participantId, logger);
}

describe('Awareness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('connect', () => {
    test('should subscribe to events', () => {
      const awareness = createAwareness();
      const { room } = createRoom('awareness-test');
      const documentSpy = jest.spyOn(document, 'addEventListener');

      awareness.connect(room);

      expect(awareness['room']!.presence.on).toHaveBeenCalledTimes(2);
      expect(documentSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    test('should unsubscribe from events', () => {
      const awareness = createAwareness();
      const { room } = createRoom('awareness-test');
      const documentSpy = jest.spyOn(document, 'removeEventListener');

      awareness.connect(room);
      awareness.destroy();

      expect(MOCK_ROOM.presence.off).toHaveBeenCalledTimes(2);
      expect(documentSpy).toHaveBeenCalledTimes(1);
    });

    test('should clear states', () => {
      const awareness = createAwareness();
      const { room } = createRoom('awareness-test');

      awareness.connect(room);
      awareness.destroy();

      expect(awareness['states'].size).toBe(0);
    });

    test('should clear participantIdToClientId', () => {
      const awareness = createAwareness();
      const { room } = createRoom('awareness-test');

      awareness.connect(room);
      awareness.destroy();

      expect(awareness['participantIdToClientId'].size).toBe(0);
    });

    test('should call onLeave', () => {
      const awareness = createAwareness();
      const { room } = createRoom('awareness-test');
      const onLeaveSpy = jest.spyOn(awareness as any, 'onLeave');

      awareness.connect(room);
      awareness.destroy();

      expect(onLeaveSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLocalState', () => {
    test('should return local state', () => {
      const awareness = createAwareness();

      awareness.setLocalState({ visibility: 'visible' });

      const state = awareness.getLocalState();
      expect(state).toEqual({ visibility: 'visible' });
    });

    test('should return null if state is not set', () => {
      const awareness = createAwareness();
      awareness['states'].delete(awareness['clientId']);

      const state = awareness.getLocalState();
      expect(state).toBeNull();
    });

    test('should return null if presence key is not set', () => {
      const awareness = createAwareness();
      awareness['states'].set(awareness['clientId'], {});

      const state = awareness.getLocalState();
      expect(state).toBeNull();
    });
  });

  describe('getStates', () => {
    test('should return states', () => {
      const awareness = createAwareness();

      awareness.setLocalState({ visibility: 'visible' });

      const states = awareness.getStates();
      expect(states.size).toBe(1);
      expect(states.get(awareness['clientId'])).toEqual({ visibility: 'visible' });
    });
  });

  describe('setLocalState', () => {
    test('should set local state', () => {
      const awareness = createAwareness();
      awareness.setLocalState({ visibility: 'visible' });

      const state = awareness.getLocalState();
      expect(state).toEqual({ visibility: 'visible' });
    });

    test('should delete state if null', () => {
      const awareness = createAwareness();
      awareness.setLocalState({ visibility: 'visible' });

      let state = awareness.getLocalState();
      expect(state).toEqual({ visibility: 'visible' });

      awareness.setLocalState(null);

      state = awareness.getLocalState();
      expect(state).toBeNull();
    });

    test('should not delete if null if state is not even set', () => {
      const awareness = createAwareness();
      awareness.states.delete = jest.fn();

      awareness.setLocalState(null);

      expect(awareness.states.delete).not.toHaveBeenCalled();
    });

    test('should preserve info in the states map besides the yjs presence key', () => {
      const awareness = createAwareness();

      awareness.states.set(awareness['clientId'], {
        visibility: 'visible',
        [awareness['YJS_STATE']]: {
          audio: 'muted',
        },
      });

      awareness.setLocalState({ video: 'on' });

      const state = awareness.states.get(awareness['clientId']);
      expect(state).toEqual({
        visibility: 'visible',
        [awareness['YJS_STATE']]: {
          video: 'on',
        },
        origin: 'set local state',
      });
    });

    test('if state was not set, should set default old state', () => {
      const awareness = createAwareness();

      awareness.states.set(awareness['clientId'], null);
      awareness.setLocalState({});

      const state = awareness.states.get(awareness['clientId']);
      expect(state).toEqual({
        [awareness['YJS_STATE']]: {},
        origin: 'set local state',
        clientId: awareness['clientId'],
      });
    });
  });

  describe('setLocalStateField', () => {
    test('should set a single field in the local state, taking the previous state into account', () => {
      const awareness = createAwareness();

      awareness.states.set(awareness['clientId'], {
        [awareness['YJS_STATE']]: {
          audio: 'muted',
        },
      });

      awareness.setLocalStateField('video', 'on');

      const state = awareness.states.get(awareness['clientId']);
      expect(state).toEqual({
        [awareness['YJS_STATE']]: {
          audio: 'muted',
          video: 'on',
        },
        origin: 'set local state',
      });
    });

    test('should set single field even if complete state did not exist', () => {
      const awareness = createAwareness();

      awareness.states.set(awareness['clientId'], null);
      awareness.setLocalStateField('video', 'on');

      const state = awareness.states.get(awareness['clientId']);
      expect(state).toEqual({
        [awareness['YJS_STATE']]: {
          video: 'on',
        },
        origin: 'set local state',
        clientId: awareness['clientId'],
      });
    });
  });

  describe('onLeave', () => {
    test('should clear maps', () => {
      const awareness = createAwareness();
      awareness['participantIdToClientId'].set('local-participant-id', 1);
      awareness['states'].set(1, {});

      awareness['onLeave']({ id: 'local-participant-id' } as unknown as PresenceEvent);

      expect(awareness['states'].size).toBe(0);
      expect(awareness['participantIdToClientId'].size).toBe(0);
    });

    test('should remove other awareness when local participant leaves', () => {
      const awareness = createAwareness();
      awareness['participantIdToClientId'].set('local-participant-id', awareness['clientId']);

      awareness['states'].set(1, {});
      awareness['states'].set(2, {});
      awareness['states'].set(3, {});
      awareness['states'].set(awareness['clientId'], {});

      const awarenessToRemove = [1, 2, 3, awareness['clientId']];

      awareness['removeAwarenessStates'] = jest.fn();

      awareness['onLeave']({ id: 'local-participant-id' } as unknown as PresenceEvent);

      expect(awareness['removeAwarenessStates']).toHaveBeenCalledWith(
        awarenessToRemove,
        UpdateOrigin.PRESENCE,
      );
    });
  });

  describe('onUpdate', () => {
    test('should set state of remote client', () => {
      const awareness = createAwareness();
      awareness['setRemoteState'] = jest.fn();
      awareness['participantIdToClientId'].set('1', 1);

      awareness['onUpdate']({
        id: '1',
        data: { clientId: 1, [awareness['YJS_STATE']]: {} },
      } as unknown as PresenceEvent<UpdatePresence>);

      expect(awareness['states'].get(1)).toEqual({
        clientId: 1,
        [awareness['YJS_STATE']]: {},
      });
    });

    test('should not set state if it comes from local participant', () => {
      const awareness = createAwareness();
      awareness['states'].set = jest.fn();

      awareness['onUpdate']({
        id: 'local-participant-id',
        data: { clientId: 1, [awareness['YJS_STATE']]: {} },
      } as unknown as PresenceEvent<UpdatePresence>);

      expect(awareness['states'].set).toHaveBeenCalledTimes(0);
    });

    test('should remove state if it is null', () => {
      const awareness = createAwareness();
      awareness['removeAwarenessStates'] = jest.fn();

      awareness['onUpdate']({
        id: '1',
        data: { clientId: 1, [awareness['YJS_STATE']]: null },
      } as unknown as PresenceEvent<UpdatePresence>);

      expect(awareness['removeAwarenessStates']).toHaveBeenCalledWith([1], UpdateOrigin.PRESENCE);
    });

    test('should map participant and client id if not already mapped', () => {
      const awareness = createAwareness();
      expect(awareness['participantIdToClientId'].get('1')).toBeUndefined();

      awareness['setRemoteState'] = jest.fn();

      awareness['onUpdate']({
        id: '1',
        data: { clientId: 1, [awareness['YJS_STATE']]: {} },
      } as unknown as PresenceEvent<UpdatePresence>);

      expect(awareness['participantIdToClientId'].get('1')).toBe(1);
    });
  });

  describe('onVisibilityChange', () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });

    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    afterAll(() => {
      jest.clearAllTimers();
    });

    test('should set local state as null after a timeout', () => {
      const awareness = createAwareness();
      awareness['setLocalState']({ audio: 'on' });
      awareness['setLocalState'] = jest.fn();

      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

      awareness['onVisibilityChange']();

      jest.advanceTimersByTime(35000);

      expect(awareness['setLocalState']).toHaveBeenCalledWith(null);
      expect(awareness['previousState']).toEqual({ audio: 'on' });
    });

    test('should clear timeout if visibility state is visible', () => {
      const awareness = createAwareness();
      awareness['setLocalState']({ audio: 'on' });
      awareness['setLocalState'] = jest.fn();

      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

      awareness['onVisibilityChange']();

      jest.advanceTimersByTime(15000);

      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');

      awareness['onVisibilityChange']();

      jest.advanceTimersByTime(35000);

      expect(awareness['setLocalState']).not.toHaveBeenCalled();
      expect(awareness['previousState']).toBeNull();
    });

    test('should restore previous state if visibility state is visible', () => {
      const awareness = createAwareness();
      awareness['setLocalState']({ audio: 'on' });
      awareness['setLocalState'] = jest.fn();

      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

      awareness['onVisibilityChange']();

      jest.advanceTimersByTime(35000);

      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');

      awareness['onVisibilityChange']();

      jest.advanceTimersByTime(35000);

      expect(awareness['setLocalState']).toHaveBeenCalledWith({ audio: 'on' });
      expect(awareness['previousState']).toBeNull();
    });
  });

  describe('initializePresences', () => {
    test('should update own presence in the room with the client id', () => {
      const awareness = createAwareness();

      const { room } = createRoom('awareness-test');
      awareness.connect(room);

      mockPresenceListOnce([{ id: 'local-participant-id', data: { clientId: 1 } }]);

      awareness['initializePresences']();

      expect(MOCK_ROOM.presence.update).toHaveBeenCalledWith({
        clientId: awareness['clientId'],
        [awareness['YJS_STATE']]: {},
        origin: 'on connect',
      });
    });

    test('should set the state and map the id of participants', () => {
      const awareness = createAwareness();

      const { room } = createRoom('awareness-test');
      awareness.connect(room);

      awareness['states'].set = jest.fn();

      mockPresenceListOnce([
        { id: '1', data: { clientId: 1, visibility: 'visible' } },
        { id: '2', data: { clientId: 2, visibility: 'hidden' } },
      ]);

      awareness['initializePresences']();

      expect(awareness['participantIdToClientId'].get('1')).toBe(1);
      expect(awareness['participantIdToClientId'].get('2')).toBe(2);

      expect(awareness['states'].set).toHaveBeenCalledTimes(2);
      expect(awareness['states'].set).toHaveBeenCalledWith(1, {
        clientId: 1,
        visibility: 'visible',
      });
      expect(awareness['states'].set).toHaveBeenCalledWith(2, {
        clientId: 2,
        visibility: 'hidden',
      });
    });

    test('should not set state and map if the presence has no clientId', () => {
      const awareness = createAwareness();

      const { room } = createRoom('awareness-test');
      awareness.connect(room);

      awareness['states'].set = jest.fn();

      mockPresenceListOnce([
        { id: '1', data: { visibility: 'visible' } },
        { id: '2', data: { visibility: 'hidden' } },
      ]);

      awareness['initializePresences']();

      expect(awareness['participantIdToClientId'].get('1')).toBeUndefined();
      expect(awareness['participantIdToClientId'].get('2')).toBeUndefined();

      expect(awareness['states'].get(1)).toBeUndefined();
      expect(awareness['states'].get(2)).toBeUndefined();
      expect(awareness['states'].set).not.toHaveBeenCalled();
    });
  });

  describe('removeAwarenessStates', () => {
    test('should remove states from the map', () => {
      const awareness = createAwareness();

      awareness['states'].set(1, { visibility: 'visible' });
      awareness['states'].set(2, { visibility: 'hidden' });

      awareness['removeAwarenessStates']([1, 2], UpdateOrigin.PRESENCE);

      expect(awareness['states'].get(1)).toBeUndefined();
      expect(awareness['states'].get(2)).toBeUndefined();
    });

    test('should do nothing if state does not exist', () => {
      const awareness = createAwareness();
      awareness['states'].delete = jest.fn();

      awareness['removeAwarenessStates']([1, 2], UpdateOrigin.PRESENCE);

      expect(awareness['states'].delete).not.toHaveBeenCalled();
    });
  });
});
