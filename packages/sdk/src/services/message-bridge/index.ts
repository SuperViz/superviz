import { MeetingEvent } from '../../common/types/events.types';
import { StoreType } from '../../common/types/stores.types';
import { Observer } from '../../common/utils';
import { Logger } from '../../common/utils/logger';
import { useStore } from '../../common/utils/use-store';

import { Message, MessageBridgeOptions } from './types';

export class MessageBridge {
  private logger: Logger;
  private allowedOrigins: string;
  private contentWindow: Window;
  private domains: Array<string>;
  private observers: Record<string, Observer> = {};
  private sourceBlockList: Array<string> = ['vue-devtools-proxy', 'vue-devtools-backend'];
  private originBlockList: Array<string> = ['https://sketchfab.com'];

  constructor(options: MessageBridgeOptions) {
    const {
      contentWindow,
      domains = [],
      allowedOrigins = '*',
      sourceBlockList = [],
      logger,
    } = options;
    this.logger = logger;
    this.domains = domains;
    this.allowedOrigins = allowedOrigins;
    this.sourceBlockList.push(...sourceBlockList);

    if (typeof window === 'undefined') {
      throw new Error('MessageBridge: window is undefined');
    }

    this.contentWindow = contentWindow;
    window.addEventListener('message', this.onReceiveMessage);
  }

  publish = (type: Message, message: Object = {}) => {
    this.logger.log('MessageBridge', 'Posting message to frame', type, message);

    this.contentWindow.postMessage(
      {
        type,
        data: message,
      },
      this.allowedOrigins,
    );
  };

  listen = (type: Message, listener: Function) => {
    if (!this.observers[type]) {
      this.observers[type] = new Observer({ logger: this.logger });
    }

    this.observers[type].subscribe(listener);
  };

  destroy() {
    Object.entries(this.observers).forEach(([type, observer]) => {
      observer.reset();
      delete this.observers[type];
    });

    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.onReceiveMessage);
    }

    delete this.logger;
    delete this.allowedOrigins;
    delete this.contentWindow;
    delete this.domains;
    delete this.observers;
    delete this.sourceBlockList;
  }

  private onReceiveMessage = (event: MessageEvent) => {
    const { type, data, source } = event.data;

    if (this.sourceBlockList.includes(source) || this.originBlockList.includes(event.origin)) {
      return;
    }

    const hasType = !!type;
    const isFromAllowedOrgin = !this.domains.length || this.domains.includes(event.origin);
    const hasListenerRegistered = this.observers.hasOwnProperty(type);

    this.logger.log(
      'MessageBridge',
      `Message received -
        TYPE: ${event.type}
        ORIGIN: ${event.origin}
        DATA: ${JSON.stringify(event.data)} `,
    );

    if (!hasType || !isFromAllowedOrgin || !hasListenerRegistered) {
      this.logger.log('MessageBridge', 'Message discarded');
      return;
    }

    this.observers[type].publish(data);
  };
}
