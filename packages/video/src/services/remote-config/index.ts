import { RemoteConfigParams, RemoteConfig, EnvironmentTypes } from './types';

export class RemoteConfigService {
  static REMOTE_CONFIG_BASE_URL: string = 'https://remote-config.superviz.com';

  static async doRequest(url: string, method: string, body: any, customHeaders = {}) {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      throw response;
    }

    try {
      const data = await response.json();

      return data;
    } catch (error) {
      return response.ok;
    }
  }

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
    if (environment === EnvironmentTypes.LOCAL) {
      // @ts-ignore
      const all = await import('../../../.remote-config.js');
      return all.default.remoteConfig;
    }

    const { version } = await import('../../../package.json');

    console.log(`[SuperViz] - v.${version}`);

    const remoteConfigParams: RemoteConfigParams = {
      version,
      environment,
    };

    const url = this.createUrl(remoteConfigParams);
    return this.doRequest(url, 'GET', null) as Promise<RemoteConfig>;
  }

  /**
   * @function createUrl
   * @description
        Creates a URL for fetching remote configuration
        data based on the provided version and environment.
   * @param {RemoteConfigParams} params - The parameters for creating the URL.
   * @returns {string} The URL for fetching remote configuration data.
   */
  static createUrl({ version, environment }: RemoteConfigParams): string {
    return `${this.REMOTE_CONFIG_BASE_URL}/video/${version}?env=${environment}`;
  }
}
