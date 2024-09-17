import { MOCK_CONFIG } from '../../../__mocks__/config.mock';
import { EVENT_BUS_MOCK } from '../../../__mocks__/event-bus.mock';
import { MOCK_GROUP, MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import { ParticipantEvent } from '../../common/types/events.types';
import { StoreType } from '../../common/types/stores.types';
import { useStore } from '../../common/utils/use-store';
import { BaseComponent } from '../../components/base';
import { DefaultAttachComponentOptions } from '../../components/base/types';
import { ComponentNames } from '../../components/types';
import { IOC } from '../../services/io';
import LimitsService from '../../services/limits';
import { useGlobalStore } from '../../services/stores';

import { LauncherFacade, LauncherOptions } from './types';

import Facade, { Launcher } from '.';
import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';

jest.mock('../../services/limits');

jest.mock('../../services/event-bus', () => ({
  EventBus: jest.fn().mockImplementation(() => EVENT_BUS_MOCK),
}));

jest.mock('../../services/api');

const MOCK_COMPONENT = {
  name: ComponentNames.VIDEO_CONFERENCE,
  attach: jest.fn(),
  detach: jest.fn(),
} as unknown as BaseComponent;

const DEFAULT_INITIALIZATION_MOCK: LauncherOptions = {
  participant: MOCK_LOCAL_PARTICIPANT as unknown as LauncherOptions['participant'],
  group: MOCK_GROUP,
};

describe('Launcher', () => {
  let LauncherInstance: Launcher;

  beforeEach(() => {
    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.spyOn(console, 'log').mockImplementation(console.log) as any;

    jest.clearAllMocks();
    jest.restoreAllMocks();

    const { localParticipant } = useGlobalStore();
    localParticipant.value = MOCK_LOCAL_PARTICIPANT;

    LauncherInstance = new Launcher(DEFAULT_INITIALIZATION_MOCK);

    const { hasJoinedRoom } = useStore(StoreType.GLOBAL);
    hasJoinedRoom.publish(true);
  });

  test('should be defined', () => {
    expect(Launcher).toBeDefined();
  });

  describe('Components', () => {
    test('should not add component if realtime is not joined room', () => {
      LimitsService.checkComponentLimit = jest.fn().mockReturnValue(LIMITS_MOCK.videoConference);
      const { hasJoinedRoom } = useStore(StoreType.GLOBAL);
      hasJoinedRoom.publish(false);

      const spy = jest.spyOn(LauncherInstance, 'addComponent');

      LauncherInstance.addComponent(MOCK_COMPONENT);

      expect(MOCK_COMPONENT.attach).not.toHaveBeenCalled();
      expect(LauncherInstance['activeComponentsInstances'].length).toBe(0);
      expect(LauncherInstance['componentsToAttachAfterJoin'].length).toBe(1);
    });

    test('should add component', () => {
      LimitsService.checkComponentLimit = jest.fn().mockReturnValue(LIMITS_MOCK.videoConference);

      LauncherInstance.addComponent(MOCK_COMPONENT);

      expect(MOCK_COMPONENT.attach).toHaveBeenCalledWith(
        expect.objectContaining({
          ioc: expect.any(IOC),
          config: MOCK_CONFIG,
          eventBus: EVENT_BUS_MOCK,
          connectionLimit: LIMITS_MOCK.videoConference.maxParticipants,
          useStore,
        } as DefaultAttachComponentOptions),
      );

      const { localParticipant } = LauncherInstance['useStore'](StoreType.GLOBAL);

      LauncherInstance['onParticipantUpdatedIOC']({
        connectionId: 'connection1',
        data: {
          ...MOCK_LOCAL_PARTICIPANT,
          activeComponents: [MOCK_COMPONENT.name],
        },
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: MOCK_LOCAL_PARTICIPANT.name as string,
        timestamp: Date.now(),
      });

      expect(localParticipant.value.activeComponents?.length).toBe(1);
      expect(localParticipant.value.activeComponents![0]).toBe(MOCK_COMPONENT.name);
    });

    test('should show a console message if limit reached and not add component', () => {
      LimitsService.checkComponentLimit = jest.fn().mockReturnValue({
        ...LIMITS_MOCK.videoConference,
        canUse: false,
      });

      LauncherInstance.addComponent(MOCK_COMPONENT);

      expect(MOCK_COMPONENT.attach).not.toHaveBeenCalled();
    });

    test('should remove component', () => {
      LimitsService.checkComponentLimit = jest.fn().mockReturnValue(LIMITS_MOCK.videoConference);

      LauncherInstance.addComponent(MOCK_COMPONENT);
      LauncherInstance.removeComponent(MOCK_COMPONENT);

      const { localParticipant } = LauncherInstance['useStore'](StoreType.GLOBAL);

      LauncherInstance['onParticipantUpdatedIOC']({
        connectionId: 'connection1',
        data: {
          ...MOCK_LOCAL_PARTICIPANT,
          activeComponents: [],
        },
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: MOCK_LOCAL_PARTICIPANT.name as string,
        timestamp: Date.now(),
      });

      expect(MOCK_COMPONENT.detach).toHaveBeenCalled();
      expect(localParticipant.value.activeComponents?.length).toBe(0);
    });

    test('should show a console message if component is not initialized yet', () => {
      LauncherInstance.removeComponent(MOCK_COMPONENT);

      expect(MOCK_COMPONENT.detach).not.toHaveBeenCalled();
    });

    test('should show a console message if component is already active', () => {
      LimitsService.checkComponentLimit = jest.fn().mockReturnValue(LIMITS_MOCK.videoConference);

      LauncherInstance.addComponent(MOCK_COMPONENT);

      // it will be updated by IOC when the participant is updated
      LauncherInstance['participant'] = {
        ...MOCK_LOCAL_PARTICIPANT,
        activeComponents: [MOCK_COMPONENT.name],
      };

      LauncherInstance.addComponent(MOCK_COMPONENT);

      expect(MOCK_COMPONENT.attach).toHaveBeenCalledTimes(1);
    });

    test('should show a console message if the launcher is destroyed', () => {
      LauncherInstance.destroy();

      LauncherInstance.addComponent(MOCK_COMPONENT);

      expect(MOCK_COMPONENT.attach).not.toHaveBeenCalled();
    });
  });

  describe('Participant Events', () => {
    test('should publish ParticipantEvent.JOINED event', () => {
      const { participants } = useStore(StoreType.GLOBAL);
      participants.publish({
        [MOCK_LOCAL_PARTICIPANT.id]: { ...MOCK_LOCAL_PARTICIPANT },
      });

      const spy = jest.spyOn(LauncherInstance, 'subscribe');
      LauncherInstance['publish'] = jest.fn();

      const callback = jest.fn();
      LauncherInstance.subscribe(ParticipantEvent.JOINED, callback);

      LauncherInstance['onParticipantUpdatedIOC']({
        connectionId: 'connection1',
        data: {
          ...MOCK_LOCAL_PARTICIPANT,
        },
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: MOCK_LOCAL_PARTICIPANT.name as string,
        timestamp: Date.now(),
      });

      expect(spy).toHaveBeenCalledWith(ParticipantEvent.JOINED, callback);
      expect(LauncherInstance['publish']).toHaveBeenCalledTimes(2);
    });

    test('should publish ParticipantEvent.LEFT event', () => {
      const { participants } = useStore(StoreType.GLOBAL);
      participants.publish({
        [MOCK_LOCAL_PARTICIPANT.id]: { ...MOCK_LOCAL_PARTICIPANT },
      });

      const callback = jest.fn();
      const spy = jest.spyOn(LauncherInstance, 'subscribe');
      LauncherInstance['publish'] = jest.fn();
      LauncherInstance.subscribe(ParticipantEvent.LEFT, callback);

      LauncherInstance['onParticipantLeaveIOC']({
        connectionId: 'connection1',
        data: MOCK_LOCAL_PARTICIPANT,
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: MOCK_LOCAL_PARTICIPANT.name as string,
        timestamp: Date.now(),
      });

      expect(spy).toHaveBeenCalledWith(ParticipantEvent.LEFT, callback);
      expect(LauncherInstance['publish']).toHaveBeenCalled();
    });

    test('should remove component when participant is not usign it anymore', () => {
      LauncherInstance['onParticipantUpdatedIOC']({
        connectionId: 'connection1',
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: MOCK_LOCAL_PARTICIPANT.name as string,
        data: {
          ...MOCK_LOCAL_PARTICIPANT,
          activeComponents: [],
        },
        timestamp: Date.now(),
      });

      LauncherInstance.addComponent(MOCK_COMPONENT);

      expect(LauncherInstance['activeComponentsInstances'].length).toBe(1);

      LauncherInstance.removeComponent(MOCK_COMPONENT);

      LauncherInstance['onParticipantUpdatedIOC']({
        connectionId: 'connection1',
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: MOCK_LOCAL_PARTICIPANT.name as string,
        data: {
          ...MOCK_LOCAL_PARTICIPANT,
          activeComponents: LauncherInstance['activeComponents'],
        },
        timestamp: Date.now(),
      });

      expect(LauncherInstance['activeComponentsInstances'].length).toBe(0);
    });

    test('should publish REALTIME_SAME_ACCOUNT_ERROR, when same account callback is called', () => {
      LauncherInstance['publish'] = jest.fn();

      LauncherInstance['onSameAccount']();

      expect(LauncherInstance['publish']).toHaveBeenCalledWith(ParticipantEvent.SAME_ACCOUNT_ERROR);
    });
  });

  describe('destroy', () => {
    test('should destroy the instance if domain is not whitelisted', () => {
      console.error = jest.fn();
      jest.spyOn(LauncherInstance, 'destroy');

      LauncherInstance['onAuthentication'](true);
      expect(LauncherInstance.destroy).not.toHaveBeenCalled();

      LauncherInstance['onAuthentication'](false);
      expect(LauncherInstance.destroy).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        `[SuperViz] Room cannot be initialized because this website's domain is not whitelisted. If you are the developer, please add your domain in https://dashboard.superviz.com/developer`,
      );
    });

    test('should destroy the instance', () => {
      LauncherInstance.destroy();

      expect(EVENT_BUS_MOCK.destroy).toHaveBeenCalled();
    });

    test('should remove all components', () => {
      LauncherInstance.addComponent(MOCK_COMPONENT);
      LauncherInstance.destroy();

      expect(MOCK_COMPONENT.detach).toHaveBeenCalled();
    });

    test('should destroy the instance when same account callback is called', () => {
      LauncherInstance['publish'] = jest.fn();
      LauncherInstance['destroy'] = jest.fn();

      LauncherInstance['onSameAccount']();

      expect(LauncherInstance['publish']).toHaveBeenCalledWith(ParticipantEvent.SAME_ACCOUNT_ERROR);
      expect(LauncherInstance['destroy']).toHaveBeenCalled();
    });
  });
});

describe('Launcher Facade', () => {
  let LauncherFacadeInstance: LauncherFacade;

  beforeEach(() => {
    jest.clearAllMocks();
    LauncherFacadeInstance = Facade(DEFAULT_INITIALIZATION_MOCK);
  });

  test('should be defined', () => {
    expect(Facade).toBeDefined();
  });

  test('should be return a facade with the correct methods', () => {
    expect(LauncherFacadeInstance).toHaveProperty('destroy');
    expect(LauncherFacadeInstance).toHaveProperty('subscribe');
    expect(LauncherFacadeInstance).toHaveProperty('unsubscribe');
    expect(LauncherFacadeInstance).toHaveProperty('addComponent');
    expect(LauncherFacadeInstance).toHaveProperty('removeComponent');
  });

  test('should return the same instance if already initialized', () => {
    const instance = Facade(DEFAULT_INITIALIZATION_MOCK);
    const instance2 = Facade(DEFAULT_INITIALIZATION_MOCK);

    expect(instance).toStrictEqual(instance2);
  });

  test('should return different instances if it`s destroyed', () => {
    const instance = Facade(DEFAULT_INITIALIZATION_MOCK);
    instance.destroy();
    const instance2 = Facade(DEFAULT_INITIALIZATION_MOCK);

    expect(instance).not.toStrictEqual(instance2);
  });
});
