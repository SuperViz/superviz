import { debug } from 'debug';

import { ApiService } from '../services/api';
import { isValidApiKey } from '../services/auth-service';
import { Channel } from '../services/channel/channel';
import config from '../services/config';
import { IOC } from '../services/io';
import { RemoteConfigService } from '../services/remote-config';
import { ComponentLifeCycleEvent } from '../types/events.types';
import { EnvironmentTypes } from '../types/options.types';
import { Participant } from '../types/participant.types';
import { Logger, Observable, isNode, isBoolean, isObject, isString, generateHash } from '../utils';
import { validateId } from '../utils/validate-id';

import { Auth, ComponentNames, Params, RealtimeComponentEvent, RealtimeComponentState } from './types';

export class Realtime extends Observable {
  public name: ComponentNames.REALTIME;

  private ioc: IOC;
  private connectionLimit: number | 'unlimited';

  protected logger: Logger;
  private declare localParticipant: Participant;
  private state: RealtimeComponentState = RealtimeComponentState.STOPPED;
  private channels: Map<string, Channel> = new Map();

  constructor(auth: Auth, params: Params) {
    super();
    this.logger = new Logger('@superviz/realtime');
    this.validateAuth(auth);
    this.validateParams(params);
    this.setConfigs(auth, params);

    if (!params.debug) debug.disable();

    this.start();
  }

  // #region Component Lifecycle
  /**
   * @function start
   * @description start the realtime component and get everything ready to start connecting to channels.
   * @returns {Promise<void>}
   */
  private async start(): Promise<void> {
    this.logger.log('[SuperViz - Real-Time Data Engine] - Starting');

    await this.setApiUrl();

    if (isNode()) {
      await this.validateSecretAndClientId();
    }

    await Promise.all([this.validateLimits(), this.validateApiKey()]);

    this.ioc = new IOC(this.localParticipant);

    this.changeState(RealtimeComponentState.STARTED);
    this.publish(ComponentLifeCycleEvent.MOUNT);

    ApiService.sendActivity(this.localParticipant.id);
  }

  /**
   * @function destroy
   * @description destroy the realtime component and disconnect from all channels
   */
  public destroy(): void {
    this.logger.log('[SuperViz - Real-Time Data Engine] - Destroying');

    this.changeState(RealtimeComponentState.STOPPED);
    this.publish(ComponentLifeCycleEvent.UNMOUNT);

    this.disconnectFromAllChannels();
    this.ioc?.destroy();
  }

  /**
   * @function changeState
   * @description change realtime component state and publish state to client
   * @param state
   * @returns {void}
   */
  private changeState(state: RealtimeComponentState): void {
    this.logger.log('realtime component @ changeState - state changed', state);
    this.state = state;

    this.publish(RealtimeComponentEvent.REALTIME_STATE_CHANGED, this.state);
  }

  // #region Channel Lifecycle
  /**
   * @function connect
   * @description - connect to a channel and return the channel instance. If the channel already exists, it will return a saved instance of the channel, otherwise, it will create a connection from zero.
   * @param name - channel name
   * @returns {Promise<Channel>}
   */
  public connect(name: string): Promise<Channel> {
    if (!validateId(name)) {
      const message = '[SuperViz | Real-Time Data Engine] Participant id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"\'';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }

    let channel: Channel = this.channels.get(name);
    if (channel) return channel as unknown as Promise<Channel>;

    if (this.state !== RealtimeComponentState.STARTED) {
      return new Promise((resolve) => {
        this.subscribe(RealtimeComponentEvent.REALTIME_STATE_CHANGED, (state) => {
          if (state !== RealtimeComponentState.STARTED) return;
          resolve(this.connect(name));
        });
      });
    }

    channel = new Channel(name, this.ioc, this.localParticipant, this.connectionLimit);
    this.channels.set(name, channel);

    return channel as unknown as Promise<Channel>;
  }

  /**
   * @function disconnectToAllChannels
   * @description - disconnect from all channels
   * @returns {void}
   */
  private disconnectFromAllChannels(): void {
    this.channels.forEach((channel) => channel.disconnect());
  }

  // #region Set configs
  /**
   * @function setConfigs
   * @description - set configs for the realtime component, taking in consideration the authentication method (apiKey or secret) and the params passed by the user (if there is or not a participant)
   * @param auth - authentication method
   * @param params - params passed by the user
   * @returns {void}
   */
  private setConfigs(auth: Auth, params: Params): void {
    if (isString(auth)) {
      config.set<string>('apiKey', auth);
    } else {
      config.set<string>('secret', auth.secret);
      config.set<string>('clientId', auth.clientId);
    }

    config.set<EnvironmentTypes | `${EnvironmentTypes}`>(
      'environment',
      params.environment || EnvironmentTypes.PROD,
    );

    if (!params.participant) {
      this.localParticipant = { id: `sv-${generateHash()}` };

      return;
    }

    this.localParticipant = params.participant;
  }

  /**
   * @function setApiUrl
   * @description - set the api url based on the environment
   * @returns {Promise<void>}
   */
  private setApiUrl = async (): Promise<void> => {
    const environment = config.get<EnvironmentTypes>('environment');
    const { apiUrl } = await RemoteConfigService.getRemoteConfig(environment);
    config.set<string>('apiUrl', apiUrl);
  };

  // #region Validations
  /**
   * @function validateLimits
   * @description - validate if the user reached the limit usage of the Real-Time Data Engine
   * @returns {Promise<void>}
   */
  private validateLimits = async (): Promise<void> => {
    const apiUrl = config.get<string>('apiUrl');
    const apiKey = config.get<string>('apiKey');

    const { realtime } = await ApiService.fetchLimits(apiUrl, apiKey);

    if (realtime.canUse) return;

    const message = '[SuperViz] You reached the limit usage of Real-Time Data Engine';

    this.logger.log(message);
    console.error(message);
    throw new Error(message);
  };

  /**
   * @function validateSecretAndClientId
   * @description - fetch apiKey using the secret and clientId to confirm that they are valid
   * @returns {Promise<void>}
   */
  private validateSecretAndClientId = async (): Promise<void> => {
    const apiKey = await ApiService.fetchApiKey();

    if (!apiKey) {
      const message = '[SuperViz | Real-Time Data Engine] - Invalid Secret or ClientId';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }

    config.set<string>('apiKey', apiKey);
  };

  /**
   * @function validateApiKey
   * @description - validate if the apiKey is valid
   * @returns {Promise<void>}
   */
  private validateApiKey = async () => {
    const apiKey = config.get<string>('apiKey');

    if (!apiKey) {
      const message = '[SuperViz | Real-Time Data Engine] - API Key is required';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }

    const isValid = await isValidApiKey();

    if (!isValid) {
      const message = '[SuperViz | Real-Time Data Engine] - Invalid API Key';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }
  };

  /**
   * @function validateParams
   * @description - validate the params passed by the user. Guarantee that they are valid in type, in whether or not they are present, etc
   */
  private validateParams(params: Params = {}) {
    if (!isObject(params)) {
      const message = '[SuperViz | Real-Time Data Engine] - Options must be an object';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }

    if (
      params.environment &&
      !Object.values(EnvironmentTypes).includes(params.environment as EnvironmentTypes)
    ) {
      const message = '[SuperViz | Real-Time Data Engine] - Invalid environment';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }

    if (params.debug && !isBoolean(params['debug'])) {
      const message = '[SuperViz | Real-Time Data Engine] - Debug param must be a boolean';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }

    if (!params['participant']) return;

    if (!isObject(params['participant'])) {
      const message = '[SuperViz | Real-Time Data Engine] - Optional participant must be an object';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }

    if (!params.participant['id']) {
      const message = '[SuperViz | Real-Time Data Engine] - Participant missing id';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }

    if (!isString(params.participant['id'])) {
      const message = '[SuperViz | Real-Time Data Engine] - Participant id must be a string';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }

    if (!validateId(params.participant['id'])) {
      const message = '[SuperViz | Real-Time Data Engine] Participant id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"\'';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }

    if (params.participant.name && !isString(params.participant['name'])) {
      const message = '[SuperViz | Real-Time Data Engine] - Optional participant name must be a string';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }
  }

  /**
   * @function validateAuth
   * @description - validate the authentication method by runtime (browser or server) and auth type (apiKey or secret)
   * @param auth - authentication method
   * @returns {void}
   */
  private validateAuth(auth: Auth) {
    if (isString(auth)) {
      if (isNode()) {
        const message = '[SuperViz | Real-Time Data Engine] - Secret and clientId are required when not using browser';

        this.logger.log(message);
        console.error(message);
        throw new Error(message);
      }
    } else if (isObject(auth)) {
      if (!isNode()) {
        const message = '[SuperViz | Real-Time Data Engine] - You can only authenticate using secret and clientId on the server';

        this.logger.log(message);
        console.error(message);
        throw new Error(message);
      }

      if (!auth.secret || !auth.clientId) {
        const message = '[SuperViz | Real-Time Data Engine] - Secret and clientId are required';

        this.logger.log(message);
        console.error(message);
        throw new Error(message);
      }
    } else {
      const message = '[SuperViz | Real-Time Data Engine] - You must authenticate you session through either a string (api key) or an object (secret and clientId)';

      this.logger.log(message);
      console.error(message);
      throw new Error(message);
    }
  }
}
