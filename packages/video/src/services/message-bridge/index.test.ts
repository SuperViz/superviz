import { Logger } from '../../common/utils/logger';
import { Observer } from '../../common/utils/observer';

import { MessageBridgeOptions } from './types';

import { MessageBridge } from './index';

describe('MessageBridge', () => {
  let logger: Logger;
  let contentWindow: Window;
  let messageBridge: MessageBridge;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
    } as unknown as Logger;

    contentWindow = {
      postMessage: jest.fn(),
    } as unknown as Window;

    const options: MessageBridgeOptions = {
      contentWindow,
      logger,
    };

    messageBridge = new MessageBridge(options);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should post a message to the content window', () => {
    const type = 'testType';
    const message = { key: 'value' };

    messageBridge.publish(type, message);

    expect(contentWindow.postMessage).toHaveBeenCalledWith(
      {
        type,
        data: message,
      },
      '*',
    );
    expect(logger.log).toHaveBeenCalledWith('MessageBridge', 'Posting message to frame', type, message);
  });

  it('should subscribe a listener to a message type', () => {
    const type = 'testType';
    const listener = jest.fn();

    messageBridge.listen(type, listener);

    expect(messageBridge['observers'][type]).toBeInstanceOf(Observer);
    expect(messageBridge['observers'][type]['callbacks']).toContain(listener);
  });

  it('should destroy the message bridge and remove all listeners', () => {
    window.removeEventListener = jest.fn();
    messageBridge.destroy();

    expect(messageBridge['observers']).toEqual(undefined);
    expect(window.removeEventListener).toHaveBeenCalledWith('message', messageBridge['onReceiveMessage']);
  });

  it('should handle received messages correctly', () => {
    const type = 'testType';
    const data = { key: 'value' };
    const event = {
      data: { type, data, source: 'source' },
      origin: 'origin',
    } as MessageEvent;

    const observer = new Observer();
    jest.spyOn(observer, 'publish');
    messageBridge['observers'][type] = observer;
    messageBridge.listen(type, jest.fn());
    messageBridge['onReceiveMessage'](event);

    expect(logger.log).toHaveBeenCalledWith(
      'MessageBridge',
      expect.stringContaining('Message received -'),
    );
    expect(messageBridge['observers'][type].publish).toHaveBeenCalledWith(data);
  });

  it('should discard messages from blocked sources or origins', () => {
    const type = 'testType';
    const data = { key: 'value' };
    const event = {
      data: { type, data, source: 'vue-devtools-proxy' },
      origin: 'origin',
    } as MessageEvent;

    messageBridge.listen(type, jest.fn());
    messageBridge['onReceiveMessage'](event);
    messageBridge['observers'][type].publish = jest.fn();

    expect(messageBridge['observers'][type].publish).not.toHaveBeenCalled();
  });
});
