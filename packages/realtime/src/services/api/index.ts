import { SecretValidationResponse } from '../../component/types';
import { doRequest } from '../../utils';
import config from '../config';

import { ComponentLimits } from './types';

export class ApiService {
  static createUrl(baseUrl: string, path: string, query = {}): string {
    const url = new URL(path, baseUrl);

    Object.keys(query).forEach((key) => url.searchParams.append(key, query[key]));
    return url.toString();
  }

  static validateApiKey(baseUrl: string, apiKey: string) {
    const path: string = '/user/checkapikey';
    const url: string = this.createUrl(baseUrl, path);
    return doRequest(url, 'POST', { apiKey });
  }

  static async fetchLimits(baseUrl: string, apikey: string): Promise<ComponentLimits> {
    const path: string = '/user/check_limits_v2';
    const url: string = this.createUrl(baseUrl, path);
    const result = await doRequest(url, 'GET', '', { apikey });
    return result.limits;
  }

  static async fetchApiKey(): Promise<string> {
    const apiUrl = config.get<string>('apiUrl');
    const secret = config.get<string>('secret');
    const clientId = config.get<string>('clientId');
    const path = '/socket/key';
    const url = this.createUrl(apiUrl, path);

    const headers = {
      client_id: clientId,
      secret,
    };

    try {
      const result = await doRequest<SecretValidationResponse>(url, 'GET', '', headers);

      return result.apiKey;
    } catch (error) {
      console.log('[SuperViz] - Error', error);
    }
  }

  static async sendActivity(userId: string) {
    const path = '/activity';
    const baseUrl = config.get<string>('apiUrl');
    const apikey = config.get<string>('apiKey');
    const url = this.createUrl(baseUrl, path);
    const body = {
      product: 'realtime',
      userId,
    };

    return doRequest(url, 'POST', body, { apikey });
  }
}
