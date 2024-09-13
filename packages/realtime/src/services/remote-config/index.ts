import { RemoteConfigParams } from './types';
import { EnvironmentTypes } from '../../types/options.types';
import { doRequest } from '../../utils';

import { RemoteConfig } from './types';

export class RemoteConfigService {
  static REMOTE_CONFIG_BASE_URL: string = 'https://remote-config.superviz.com';

  /**
   * @function getRemoteConfig
   * @description Retrieves the remote configuration for the specified environment.
   * @param environment
        The environment to retrieve the remote configuration for. Defaults to EnvironmentTypes.PROD.
   * @returns A Promise that resolves with the remote configuration object.
   */
  static async getRemoteConfig(
    environment: EnvironmentTypes = EnvironmentTypes.PROD,
  ): Promise<RemoteConfig> {
    const { version } = await import('../../../.version.js');

    if (environment === EnvironmentTypes.LOCAL) {
      const { remoteConfig } = await import('../../../.remote-config.js');
      return remoteConfig;
    }

    const remoteConfigParams: RemoteConfigParams = {
      version,
      environment,
    };

    const url = this.createUrl(remoteConfigParams);
    return doRequest(url, 'GET', null) as Promise<RemoteConfig>;
  }

  /**
   * @function createUrl
   * @description
        Creates a URL for fetching remote configuration
        data based on the provided version and environment.
   * @param {RemoteConfigParams} params - The parameters for creating the URL.
   * @returns {string} The URL for fetching remote configuration data.
   */
  static createUrl({ environment }: RemoteConfigParams): string {
    return `${this.REMOTE_CONFIG_BASE_URL}/realtime/${environment}?env=${environment}`;
  }
}
