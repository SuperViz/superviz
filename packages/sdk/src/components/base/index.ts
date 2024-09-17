import * as Socket from '@superviz/socket-client';

import { ComponentLifeCycleEvent } from '../../common/types/events.types';
import { Group } from '../../common/types/participant.types';
import { StoreType } from '../../common/types/stores.types';
import { Logger, Observable } from '../../common/utils';
import { useStore } from '../../common/utils/use-store';
import config from '../../services/config';
import { EventBus } from '../../services/event-bus';
import { IOC } from '../../services/io';
import { ComponentNames } from '../types';

import { DefaultAttachComponentOptions } from './types';

export abstract class BaseComponent extends Observable {
  public abstract name: ComponentNames;
  protected abstract logger: Logger;
  protected connectionLimit: number | 'unlimited';
  protected group: Group;
  protected ioc: IOC;
  protected eventBus: EventBus;
  protected isAttached = false;
  protected unsubscribeFrom: Array<(id: unknown) => void> = [];
  protected useStore = useStore.bind(this) as typeof useStore;
  protected room: Socket.Room;

  /**
   * @function attach
   * @description attach component
   * @returns {void}
   */

  public attach = (params: DefaultAttachComponentOptions): void => {
    if (Object.values(params).includes(null) || Object.values(params).includes(undefined)) {
      const message = `${this.name} @ attach - params are required`;

      this.logger.log(message);
      throw new Error(message);
    }

    const { config: globalConfig, eventBus, ioc } = params;
    const { isDomainWhitelisted, hasJoinedRoom } = this.useStore(StoreType.GLOBAL);

    if (!isDomainWhitelisted.value) {
      const message = `Component ${this.name} can't be used because this website's domain is not whitelisted. Please add your domain in https://dashboard.superviz.com/developer`;
      this.logger.log(message);
      return;
    }

    config.setConfig(globalConfig);

    this.eventBus = eventBus;
    this.isAttached = true;
    this.ioc = ioc;
    this.connectionLimit = params.connectionLimit ?? 50;
    this.room = ioc.createRoom(this.name, this.connectionLimit);

    if (!hasJoinedRoom.value) {
      this.logger.log(`${this.name} @ attach - not joined yet`);

      setTimeout(() => {
        this.logger.log(`${this.name} @ attach - retrying`);
        this.attach(params);
      }, 1000);

      return;
    }

    this.logger.log(`${this.name} @ attached`);

    this.start();
    this.publish(ComponentLifeCycleEvent.MOUNT);
  };

  /*
   * @function detach
   * @description detach component
   * @returns {void}
   * */
  public detach = (): void => {
    if (!this.isAttached) {
      this.logger.log(`${this.name} @ detach - component is not attached`);
      return;
    }

    this.logger.log('detached');

    this.publish(ComponentLifeCycleEvent.UNMOUNT);
    this.destroy();
    this.room.disconnect();
    this.room = undefined;

    this.unsubscribeFrom.forEach((unsubscribe) => unsubscribe(this));

    Object.values(this.observers).forEach((observer) => {
      observer.reset();
      observer.destroy();
    });

    this.observers = undefined;
    this.isAttached = false;
  };

  protected abstract destroy(): void;
  protected abstract start(): void;
}
