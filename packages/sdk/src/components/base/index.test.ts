import { MOCK_CONFIG } from '../../../__mocks__/config.mock';
import { EVENT_BUS_MOCK } from '../../../__mocks__/event-bus.mock';
import { MOCK_OBSERVER_HELPER } from '../../../__mocks__/observer-helper.mock';
import { MOCK_GROUP, MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import { StoreType } from '../../common/types/stores.types';
import { Logger } from '../../common/utils';
import { useStore } from '../../common/utils/use-store';
import { Configuration } from '../../services/config/types';
import { EventBus } from '../../services/event-bus';
import { IOC } from '../../services/io';
import { Presence3DManager } from '../../services/presence-3d-manager';
import { useGlobalStore } from '../../services/stores';
import { ComponentNames } from '../types';

import { BaseComponent } from '.';
import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';

class DummyComponent extends BaseComponent {
  protected logger: Logger;
  public name: ComponentNames;

  constructor() {
    super();

    this.name = ComponentNames.VIDEO_CONFERENCE;
    this.logger = new Logger('@superviz/sdk/dummy-component');
  }

  protected destroy(): void {
    this.logger.log('destroyed');
  }

  protected start(): void {
    this.logger.log('started');
  }
}

jest.mock('../../common/utils/observer', () => ({
  Observer: jest.fn().mockImplementation(() => MOCK_OBSERVER_HELPER),
}));

jest.useFakeTimers();
global.fetch = jest.fn();

describe('BaseComponent', () => {
  let DummyComponentInstance: DummyComponent;

  beforeEach(() => {
    console.error = jest.fn();

    jest.clearAllMocks();
    const { localParticipant, group, hasJoinedRoom } = useGlobalStore();
    localParticipant.value = MOCK_LOCAL_PARTICIPANT;
    group.value = MOCK_GROUP;
    hasJoinedRoom.value = true;

    DummyComponentInstance = new DummyComponent();
  });

  test('should be defined', () => {
    expect(BaseComponent).toBeDefined();
  });

  describe('attach', () => {
    test('should not call start if realtime is not joined room', () => {
      const { hasJoinedRoom } = useStore(StoreType.GLOBAL);
      hasJoinedRoom.publish(false);

      DummyComponentInstance.attach({
        ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
        config: MOCK_CONFIG,
        eventBus: EVENT_BUS_MOCK,
        Presence3DManagerService: Presence3DManager,
        connectionLimit: LIMITS_MOCK.videoConference.maxParticipants,
        useStore,
      });

      DummyComponentInstance['start'] = jest.fn(DummyComponentInstance['start']);
      DummyComponentInstance['attach'] = jest.fn(DummyComponentInstance['attach']);
      DummyComponentInstance['logger'].log = jest.fn();

      expect(DummyComponentInstance['start']).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);

      expect(DummyComponentInstance['attach']).toHaveBeenCalledTimes(1);
    });

    test('should not start if domain is not whitelisted', () => {
      DummyComponentInstance.attach({
        Presence3DManagerService: Presence3DManager,
        ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
        config: MOCK_CONFIG,
        eventBus: EVENT_BUS_MOCK,
        connectionLimit: LIMITS_MOCK.videoConference.maxParticipants,
        useStore,
      });

      DummyComponentInstance['start'] = jest.fn();

      jest.advanceTimersByTime(1000);

      expect(DummyComponentInstance['start']).not.toHaveBeenCalled();
    });

    test('should attach the component with success', () => {
      DummyComponentInstance['start'] = jest.fn();
      expect(DummyComponentInstance.attach).toBeDefined();

      DummyComponentInstance.attach({
        Presence3DManagerService: Presence3DManager,
        ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
        config: MOCK_CONFIG,
        eventBus: EVENT_BUS_MOCK,
        connectionLimit: LIMITS_MOCK.videoConference.maxParticipants,
        useStore,
      });

      expect(DummyComponentInstance['isAttached']).toBeTruthy();
      expect(DummyComponentInstance['start']).toHaveBeenCalled();
    });

    test('should throw error if realtime is not provided', () => {
      expect(DummyComponentInstance.attach).toBeDefined();

      expect(() => {
        DummyComponentInstance.attach({
          ioc: null as unknown as IOC,
          Presence3DManagerService: Presence3DManager,
          config: null as unknown as Configuration,
          eventBus: null as unknown as EventBus,
          useStore: null as unknown as typeof useStore,
          connectionLimit: LIMITS_MOCK.videoConference.maxParticipants,
        });
      }).toThrow();
    });
  });

  describe('detach', () => {
    test('should detach the component with success', () => {
      DummyComponentInstance['destroy'] = jest.fn();
      expect(DummyComponentInstance.detach).toBeDefined();

      DummyComponentInstance.attach({
        Presence3DManagerService: Presence3DManager,
        ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
        config: MOCK_CONFIG,
        eventBus: EVENT_BUS_MOCK,
        connectionLimit: LIMITS_MOCK.videoConference.maxParticipants,
        useStore,
      });

      DummyComponentInstance.detach();

      expect(DummyComponentInstance['localParticipant']).toBeUndefined();
      expect(DummyComponentInstance['realtime']).toBeUndefined();
      expect(DummyComponentInstance['isAttached']).toBeFalsy();
      expect(DummyComponentInstance['destroy']).toBeCalled();
    });

    test('should unsubscribe from all events', () => {
      const callback = jest.fn();

      DummyComponentInstance['destroy'] = jest.fn();

      DummyComponentInstance.attach({
        Presence3DManagerService: Presence3DManager,
        ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
        config: MOCK_CONFIG,
        eventBus: EVENT_BUS_MOCK,
        connectionLimit: LIMITS_MOCK.videoConference.maxParticipants,
        useStore,
      });

      DummyComponentInstance.subscribe('test', callback);

      expect(DummyComponentInstance['observers']['test']).toBeDefined();

      const spyDestroy = jest.spyOn(DummyComponentInstance['observers']['test'], 'destroy');
      const spyReset = jest.spyOn(DummyComponentInstance['observers']['test'], 'reset');

      DummyComponentInstance.detach();

      expect(spyDestroy).toBeCalled();
      expect(spyReset).toBeCalled();
      expect(DummyComponentInstance['observers']).toBeUndefined();
    });

    test('should not detach the component if it is not attached', () => {
      DummyComponentInstance['logger'].log = jest.fn();
      expect(DummyComponentInstance.detach).toBeDefined();

      DummyComponentInstance.detach();

      expect(DummyComponentInstance['logger'].log).toBeCalled();
    });
  });
});
