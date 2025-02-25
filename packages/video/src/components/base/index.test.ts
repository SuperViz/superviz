import type { Room } from '@superviz/socket-client';
import { Subject } from 'rxjs';

import { Logger } from '../../common/utils/logger';
import { VideoManagerOptions } from '../../services/video-manager/types';

import { BaseComponent } from './index';
import { VideoEvent } from './types';

class TestComponent extends BaseComponent {
  protected videoManagerConfig: VideoManagerOptions;

  protected logger = new Logger('dummy');
  protected destroy() {}
  protected start() {}
}

describe('BaseComponent', () => {
  let component: TestComponent;
  let mockLogger: Logger;
  let mockUseStore: jest.MockedFunction<any>;
  let mockRoom: jest.Mocked<any>;
  let mockIOC: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  beforeEach(() => {
    mockLogger = new Logger('dummy');
    jest.spyOn(mockLogger, 'log');

    mockUseStore = jest.fn().mockReturnValue({ hasJoinedRoom: { value: true } });
    mockRoom = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      history: jest.fn(),
      presence: {
        on: jest.fn(),
        off: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as jest.Mocked<Room>;
    mockIOC = { createRoom: jest.fn().mockReturnValue(mockRoom) } as unknown as jest.Mocked<any>;
    mockEventBus = {} as jest.Mocked<any>;

    component = new TestComponent();
    component['logger'] = mockLogger;
  });

  it('should detach the component', () => {
    component['isAttached'] = true;
    component['room'] = mockRoom;

    component.detach();

    expect(component['isAttached']).toBe(false);
    expect(mockRoom.disconnect).toHaveBeenCalled();
  });

  it('should emit an event', () => {
    const event = VideoEvent.MY_PARTICIPANT_JOINED;
    const data = { key: 'value' };
    const subject = new Subject();

    component['observers'].set(event, subject);
    jest.spyOn(subject, 'next');

    component['emit'](event, data as never);

    expect(subject.next).toHaveBeenCalledWith(data);
  });

  it('should subscribe to an event', () => {
    const event = VideoEvent.MY_PARTICIPANT_JOINED;
    const callback = jest.fn();

    component.subscribe(event, callback);

    expect(component['observers'].has(event)).toBe(true);
    expect(component['subscriptions'].has(callback)).toBe(true);
  });

  it('should unsubscribe from an event', () => {
    const event = VideoEvent.MY_PARTICIPANT_JOINED;
    const callback = jest.fn();
    const subject = new Subject();

    component['observers'].set(event, subject);
    component['subscriptions'].set(callback, subject.subscribe(callback));

    component.unsubscribe(event, callback);

    expect(component['subscriptions'].has(callback)).toBe(false);
  });
});
