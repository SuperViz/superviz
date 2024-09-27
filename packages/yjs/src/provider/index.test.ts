import type { PresenceEvent, SocketEvent } from '@superviz/socket-client';
import debug from 'debug';
import * as Y from 'yjs';

import { MOCK_ROOM } from '../../__mocks__/io.mock';
import { config } from '../services';

import { DocUpdate, MessageToHost } from './types';

import { SuperVizYjsProvider } from '.';

function createProvider(connect: boolean = true, debug: boolean = false, room: string = '') {
  const doc = new Y.Doc();
  const provider = new SuperVizYjsProvider(doc, {
    apiKey: '123',
    environment: 'dev',
    participant: {
      id: 'local-participant-id',
      name: 'Provider Test',
    },
    connect,
    debug,
    room,
  });

  provider['connect']();

  return provider;
}

describe('provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.restoreAllMocks();
  });

  describe('start', () => {
    test('should set config', () => {
      createProvider();

      expect(config.get('apiKey')).toEqual('123');
      expect(config.get('environment')).toEqual('dev');
      expect(config.get('participant')).toEqual({
        id: 'local-participant-id',
        name: 'Provider Test',
      });
      expect(config.get('roomName')).toEqual('sv-provider');
    });

    test('should set room name', () => {
      createProvider(true, true, 'room-name');

      expect(config.get('roomName')).toEqual('room-name');
    });

    test('should disable debug if debug is false', () => {
      const spy = jest.spyOn(debug, 'disable');
      createProvider(false, false);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('attach', () => {
    afterAll(() => {
      jest.useRealTimers();
    });

    test('should connect the provider', () => {
      const provider = createProvider();
      provider['connect'] = jest.fn();

      provider.attach({
        useStore: () => ({
          isDomainWhitelisted: { value: true },
          hasJoinedRoom: { value: true },
        }),
      } as any);

      expect(provider['connect']).toHaveBeenCalled();
    });

    test('should not connect if domain is not whitelisted', () => {
      const provider = createProvider();
      provider['connect'] = jest.fn();

      provider.attach({
        useStore: () => ({
          isDomainWhitelisted: { value: false },
          hasJoinedRoom: { value: true },
        }),
      } as any);

      expect(provider['connect']).not.toHaveBeenCalled();
    });

    test('should not connect if user has not joined room', () => {
      const provider = createProvider();
      provider['connect'] = jest.fn();

      provider.attach({
        useStore: () => ({
          isDomainWhitelisted: { value: true },
          hasJoinedRoom: { value: false },
        }),
      } as any);

      expect(provider['connect']).not.toHaveBeenCalled();
    });

    test('should try to rettach if user has not joined room', () => {
      jest.useFakeTimers();
      const provider = createProvider();
      provider['connect'] = jest.fn();

      const value = {
        value: false,
      };
      provider.attach({
        useStore: () => ({
          isDomainWhitelisted: { value: true },
          hasJoinedRoom: value,
        }),
      } as any);

      expect(provider['connect']).not.toHaveBeenCalled();
      value.value = true;
      jest.advanceTimersByTime(2000);

      expect(provider['connect']).toHaveBeenCalled();
    });

    test('should throw error if param has undefined', () => {
      const provider = createProvider();

      expect(() => provider.attach({ store: undefined } as any)).toThrow();
    });

    test('should throw error if param has null', () => {
      const provider = createProvider();

      expect(() => provider.attach({ store: null } as any)).toThrow();
    });
  });

  describe('destroy', () => {
    test('should destroy services', () => {
      const provider = createProvider();
      provider['room']!.presence['emit']('presence.joined-room', {
        data: {},
      });

      const awarenessSpy = jest.spyOn(provider['awareness'], 'destroy');
      const realtimeSpy = jest.spyOn(provider['realtime']!, 'destroy');
      const hostServiceSpy = jest.spyOn(provider['hostService']!, 'destroy');

      provider['destroyProvider']();

      expect(awarenessSpy).toHaveBeenCalled();
      expect(realtimeSpy).toHaveBeenCalled();
      expect(hostServiceSpy).toHaveBeenCalled();

      expect(provider['hostService']).toBeNull();
      expect(provider['realtime']).toBeNull();
    });

    test('should disconnect from room', () => {
      const provider = createProvider();
      provider['room']!.presence['emit']('presence.joined-room', {
        data: {},
      });

      const disconnectSpy = jest.spyOn(provider['room']!, 'disconnect');

      provider['destroyProvider']();

      expect(disconnectSpy).toHaveBeenCalled();
      expect(provider['room']).toBeNull();
    });

    test('should unsubscribe from events', () => {
      const provider = createProvider();
      provider['room']!.presence['emit']('presence.joined-room', {
        data: {},
      });

      const offSpy = jest.spyOn(provider['doc'], 'off');
      provider['destroyProvider']();

      expect(offSpy).toHaveBeenCalled();
      expect(MOCK_ROOM.off).toHaveBeenCalledTimes(4);
      expect(MOCK_ROOM.presence.off).toHaveBeenCalledTimes(5);
    });

    test('should do nothing if already destroyed', () => {
      const provider = createProvider();
      provider['room']!.presence['emit']('presence.joined-room', {
        data: {},
      });

      const awarenessSpy = jest.spyOn(provider['awareness'], 'destroy');
      const realtimeSpy = jest.spyOn(provider['realtime']!, 'destroy');
      const hostServiceSpy = jest.spyOn(provider['hostService']!, 'destroy');
      const offSpy = jest.spyOn(provider['doc'], 'off');
      const disconnectSpy = jest.spyOn(provider['room']!, 'disconnect');

      jest.clearAllMocks();

      provider['destroyProvider']();
      provider['destroyProvider']();

      expect(awarenessSpy).toHaveBeenCalledTimes(1);
      expect(realtimeSpy).toHaveBeenCalledTimes(1);
      expect(hostServiceSpy).toHaveBeenCalledTimes(1);
      expect(offSpy).toHaveBeenCalledTimes(1);
      expect(disconnectSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('connect', () => {
    test('should listen to doc updates and start realtime', () => {
      const provider = createProvider();
      provider['state'] = 'disconnected';

      const onSpy = jest.spyOn(provider['doc'], 'on');
      const startSpy = jest.spyOn(provider as any, 'startRealtime');

      provider['connect']();

      expect(onSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });

    test('should do nothing if already connected', () => {
      const provider = createProvider();
      provider['state'] = 'connected';

      const onSpy = jest.spyOn(provider['doc'], 'on');
      const startSpy = jest.spyOn(provider as any, 'startRealtime');

      provider['connect']();

      expect(onSpy).not.toHaveBeenCalled();
      expect(startSpy).not.toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    test('should return is synced', () => {
      const provider = createProvider();
      provider['_synced'] = true;

      expect(provider.synced).toBeTruthy();

      provider['_synced'] = false;

      expect(provider.synced).toBeFalsy();
    });
  });

  describe('createRoom', () => {
    test('should create and set realtime instance and room', () => {
      const provider = createProvider();
      provider['createRoom']();

      expect(provider['realtime']).toBeDefined();
      expect(provider['room']).toBeDefined();
    });
  });

  describe('addRoomListeners', () => {
    test('should add room listeners', () => {
      const provider = createProvider();

      jest.clearAllMocks();

      provider['addRoomListeners']();

      expect(MOCK_ROOM.on).toHaveBeenCalledTimes(1);
      expect(MOCK_ROOM.presence.on).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeRoomListeners', () => {
    test('should remove room listeners', () => {
      const provider = createProvider();

      jest.clearAllMocks();

      provider['removeRoomListeners']();

      expect(MOCK_ROOM.off).toHaveBeenCalledTimes(3);
      expect(MOCK_ROOM.presence.off).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetch', () => {
    test('should emit doc state', () => {
      const provider = createProvider();
      const state = Y.encodeStateAsUpdateV2(provider['doc']);

      provider['fetch']();

      expect(MOCK_ROOM.emit).toHaveBeenCalledWith('message-to-host', {
        update: state,
      });
    });
  });

  describe('updateDocument', () => {
    test('should apply updates to document', () => {
      const provider = createProvider();
      const update = Y.encodeStateAsUpdateV2(provider['doc']);

      provider['updateDocument'](update);

      const diff = Y.diffUpdate(update, Y.encodeStateAsUpdate(provider['doc']));

      diff.forEach((d) => {
        expect(d).toEqual(0);
      });
    });
  });

  describe('changeState', () => {
    test('should change state', () => {
      const provider = createProvider();
      provider['state'] = 'disconnected';

      provider['changeState']('connected');

      expect(provider['state']).toEqual('connected');
    });
  });

  describe('onMessageToHost', () => {
    test('should apply and broadcast update', () => {
      const provider = createProvider();
      provider['hostService']!['_hostId'] = 'local-participant-id';

      const doc = new Y.Doc();
      doc.getArray('test').insert(0, ['test']);

      provider['updateDocument'] = jest.fn();

      const comingUpdate = Y.encodeStateAsUpdateV2(doc);

      provider['onMessageToHost']({
        data: { update: comingUpdate },
      } as SocketEvent<MessageToHost>);

      const update = Y.encodeStateAsUpdateV2(provider['doc'], new Uint8Array(comingUpdate));

      expect(provider['updateDocument']).toHaveBeenCalledWith(comingUpdate);
      expect(MOCK_ROOM.emit).toHaveBeenCalledWith('broadcast', {
        update,
      });
    });

    test('should do nothing if user is not the host', () => {
      const provider = createProvider();
      const doc = new Y.Doc();
      doc.getArray('test').insert(0, ['test']);

      provider['updateDocument'] = jest.fn();

      const comingUpdate = Y.encodeStateAsUpdateV2(doc);

      provider['onMessageToHost']({
        data: { update: comingUpdate },
      } as SocketEvent<MessageToHost>);

      expect(provider['updateDocument']).not.toHaveBeenCalled();
      expect(MOCK_ROOM.emit).not.toHaveBeenCalled();
    });
  });

  describe('onDocUpdate', () => {
    test('should apply update', () => {
      const provider = createProvider();
      const doc = new Y.Doc();
      doc.getArray('test').insert(0, ['test']);

      const update = Y.encodeStateAsUpdateV2(doc);

      provider['onDocUpdate'](update);

      expect(MOCK_ROOM.emit).toHaveBeenCalledWith('update', { update });
    });
  });

  describe('onLocalJoinRoom', () => {
    test('should fetch document', () => {
      const provider = createProvider();
      provider['fetch'] = jest.fn();

      provider['onLocalJoinRoom']({ id: 'local-participant-id' } as PresenceEvent);

      expect(provider['fetch']).toHaveBeenCalled();
    });

    test('should subscribe to events', () => {
      const provider = createProvider();

      jest.clearAllMocks();

      provider['onLocalJoinRoom']({ id: 'local-participant-id' } as PresenceEvent);

      expect(MOCK_ROOM.presence.on).toHaveBeenCalledTimes(2);
    });

    test('should connect awareness', () => {
      const provider = createProvider();
      provider['awareness']['connect'] = jest.fn();

      provider['onLocalJoinRoom']({ id: 'local-participant-id' } as PresenceEvent);

      expect(provider['awareness']['connect']).toHaveBeenCalled();
    });

    test('should do nothing if already connected', () => {
      const provider = createProvider();
      provider['state'] = 'connected';
      jest.clearAllMocks();
      const connectSpy = jest.spyOn(provider['awareness'], 'connect');

      provider['onLocalJoinRoom']({ id: 'local-participant-id' } as PresenceEvent);

      expect(MOCK_ROOM.presence.on).not.toHaveBeenCalled();
      expect(connectSpy).not.toHaveBeenCalled();
    });

    test('should do nothing if someone other than local joins', () => {
      const provider = createProvider();
      provider['fetch'] = jest.fn();
      const connectSpy = jest.spyOn(provider['awareness'], 'connect');

      provider['onLocalJoinRoom']({ id: 'remote-participant-id' } as PresenceEvent);

      expect(provider['fetch']).not.toHaveBeenCalled();
      expect(connectSpy).not.toHaveBeenCalled();
    });
  });

  describe('onConnectionChange', () => {
    test('should emit disconnect event', () => {
      const provider = createProvider();
      provider['emit'] = jest.fn();

      provider['onConnectionChange']({ state: 'DISCONNECTED' });

      expect(provider['emit']).toHaveBeenCalledWith('disconnect', []);
    });
  });

  describe('onRemoteDocUpdate', () => {
    test('should apply update', () => {
      const provider = createProvider();
      const doc = new Y.Doc();
      doc.getArray('test').insert(0, ['test']);
      const update = Y.encodeStateAsUpdateV2(doc);

      provider['updateDocument'] = jest.fn();
      provider['onRemoteDocUpdate']({
        data: { update },
        presence: { id: 'remote-participant-id' },
      } as SocketEvent<DocUpdate>);

      expect(provider['updateDocument']).toHaveBeenCalledWith(update);
    });

    test('should do nothing if participant is local', () => {
      const provider = createProvider();
      const doc = new Y.Doc();
      doc.getArray('test').insert(0, ['test']);

      const update = Y.encodeStateAsUpdateV2(doc);
      provider['updateDocument'] = jest.fn();
      provider['onRemoteDocUpdate']({
        data: { update },
        presence: { id: 'local-participant-id' },
      } as SocketEvent<DocUpdate>);

      expect(provider['updateDocument']).not.toHaveBeenCalled();
    });
  });

  describe('onBroadcast', () => {
    test('should apply update and set synced', () => {
      const provider = createProvider();
      provider['_synced'] = false;

      const doc = new Y.Doc();
      doc.getArray('test').insert(0, ['test']);
      const update = Y.encodeStateAsUpdateV2(doc);

      provider['updateDocument'] = jest.fn();
      provider['onBroadcast']({
        data: { update },
      } as SocketEvent<DocUpdate>);

      expect(provider['updateDocument']).toHaveBeenCalledWith(update);
      expect(provider.synced).toBe(true);
    });

    test('should do nothing if user is host', () => {
      const provider = createProvider();
      provider['_synced'] = false;
      provider['hostService']!['_hostId'] = 'local-participant-id';

      const doc = new Y.Doc();
      doc.getArray('test').insert(0, ['test']);
      const update = Y.encodeStateAsUpdateV2(doc);

      provider['updateDocument'] = jest.fn();
      provider['onBroadcast']({
        data: { update },
      } as SocketEvent<DocUpdate>);

      expect(provider['updateDocument']).not.toHaveBeenCalled();
      expect(provider.synced).toBe(false);
    });
  });

  describe('onHostChange', () => {
    test('should fetch host document', () => {
      const provider = createProvider();
      provider['fetch'] = jest.fn();

      provider['onHostChange']('host-id');

      expect(provider['fetch']).toHaveBeenCalled();
    });

    test('should set synced true if host is local', () => {
      const provider = createProvider();
      provider['_synced'] = false;

      provider['onHostChange']('local-participant-id');

      expect(provider.synced).toBe(true);
    });
  });

  describe('onReceiveRealtimeMessage', () => {
    test('should emit message', () => {
      const provider = createProvider();
      provider['emit'] = jest.fn();

      provider['onReceiveRealtimeMessage']('update', { update: new Uint8Array() });

      expect(provider['emit']).toHaveBeenCalledWith('message', [
        { data: { update: new Uint8Array() }, name: 'update' },
      ]);
    });
  });

  describe('beforeSendRealtimeMessage', () => {
    test('should emit message', () => {
      const provider = createProvider();
      provider['emit'] = jest.fn();

      provider['beforeSendRealtimeMessage']('update', { update: new Uint8Array() });

      expect(provider['emit']).toHaveBeenCalledWith('outgoingMessage', [
        { data: { update: new Uint8Array() }, name: 'update' },
      ]);
    });
  });

  describe('detach', () => {
    test('should destroy provider', () => {
      const provider = createProvider();
      provider['destroyProvider'] = jest.fn();
      provider['isAttached'] = true;
      provider.detach();

      expect(provider['destroyProvider']).toHaveBeenCalled();
    });

    test('should do nothing if provider is not attached', () => {
      const provider = createProvider();
      provider['destroyProvider'] = jest.fn();
      provider['isAttached'] = false;
      provider.detach();

      expect(provider['destroyProvider']).not.toHaveBeenCalled();
    });
  });
});
