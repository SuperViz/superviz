import { MOCK_OBSERVER_HELPER } from '../../../__mocks__/observer-helper.mock';
import { Logger } from '../../common/utils/logger';

import { MessageBridge } from '.';

jest.mock('../../common/utils/observer', () => ({
  Observer: jest.fn().mockImplementation(() => MOCK_OBSERVER_HELPER),
}));

describe('MessageBridge', () => {
  let MessageBridgeInstance: MessageBridge;

  beforeEach(() => {
    jest.clearAllMocks();

    MessageBridgeInstance = new MessageBridge({
      contentWindow: window,
      logger: new Logger('@superviz/message-bridge'),
      sourceBlockList: ['https://google.com'],
    });
  });

  test('should be defined', () => {
    expect(MessageBridgeInstance).toBeDefined();
  });

  test('should have a publish method', () => {
    expect(MessageBridgeInstance.publish).toBeDefined();
  });

  test('should have a listen method', () => {
    expect(MessageBridgeInstance.listen).toBeDefined();
  });

  test('should have a destroy method', () => {
    expect(MessageBridgeInstance.destroy).toBeDefined();
  });

  describe('publish', () => {
    test('should call postMessage', () => {
      const spy = jest.spyOn(window, 'postMessage');
      MessageBridgeInstance.publish('test', { foo: 'bar' });
      expect(spy).toHaveBeenCalled();
    });

    test('should call postMessage with the correct arguments', () => {
      const spy = jest.spyOn(window, 'postMessage');
      MessageBridgeInstance.publish('test', { foo: 'bar' });
      expect(spy).toHaveBeenCalledWith(
        {
          data: {
            foo: 'bar',
          },
          type: 'test',
        },
        '*',
      );
    });

    test('if message is not defined, should call postMessage with an empty object', () => {
      const spy = jest.spyOn(window, 'postMessage');
      MessageBridgeInstance.publish('test');
      expect(spy).toHaveBeenCalledWith(
        {
          data: {},
          type: 'test',
        },
        '*',
      );
    });
  });

  describe('listen', () => {
    test('should add a listener', () => {
      const spy = jest.spyOn(MessageBridgeInstance, 'listen');

      MessageBridgeInstance.listen('test', () => {});
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    test('should remove the listener', () => {
      const spy = jest.spyOn(window, 'removeEventListener');

      MessageBridgeInstance.destroy();
      expect(spy).toHaveBeenCalled();
    });

    test('should throw an error if called twice', () => {
      MessageBridgeInstance.destroy();
      expect(() => MessageBridgeInstance.destroy()).toThrowError();
    });

    test('should delete all properties', () => {
      MessageBridgeInstance.destroy();
      expect(MessageBridgeInstance).toMatchObject({});
    });

    test('should reset all observers', () => {
      const spy = jest.spyOn(MOCK_OBSERVER_HELPER, 'reset');

      MessageBridgeInstance.listen('test', () => {});
      MessageBridgeInstance.destroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onReceiveMessage', () => {
    test('should call the observer', () => {
      const spy = jest.spyOn(MOCK_OBSERVER_HELPER, 'publish');

      const event = new MessageEvent('message', {
        data: {
          type: 'test',
          data: {
            foo: 'bar',
          },
        },
      });

      window.dispatchEvent(event);
      expect(spy).toHaveBeenCalled();
    });

    test('should not call the observer if the type is not defined', () => {
      const spy = jest.spyOn(MOCK_OBSERVER_HELPER, 'publish');

      const event = new MessageEvent('message', {
        data: {
          type: 'foo',
          data: {
            foo: 'bar',
          },
        },
      });

      window.dispatchEvent(event);
      expect(spy).not.toHaveBeenCalled();
    });

    test('should not call the observer if the source is blocked', () => {
      const spy = jest.spyOn(MOCK_OBSERVER_HELPER, 'publish');

      const event = new MessageEvent('message', {
        data: {
          type: 'test',
          data: {
            foo: 'bar',
          },
          source: 'https://google.com',
        },
      });

      window.dispatchEvent(event);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  test('should throw an error if window is undefined', () => {
    jest.spyOn(global, 'window', 'get').mockImplementation(() => undefined as any);

    expect(() => {
      const instance = new MessageBridge({
        contentWindow: window,
        logger: new Logger('@superviz/message-bridge'),
      });
    }).toThrowError();
  });
});
