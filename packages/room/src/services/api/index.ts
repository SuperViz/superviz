import config from '../config';
import { ComponentLimits } from '../config/types';

export class ApiService {
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

  static createUrl(path: string, query = {}): string {
    const url = new URL(path, config.get('apiUrl'));

    Object.keys(query).forEach((key) => url.searchParams.append(key, query[key]));
    return url.toString();
  }

  static validateApiKey(apiKey: string) {
    const path: string = '/user/checkapikey';
    const url: string = this.createUrl(path);
    return this.doRequest(url, 'POST', { apiKey });
  }

  static async fetchLimits(apikey: string): Promise<ComponentLimits> {
    const path: string = '/user/check_limits_v2';
    const url: string = this.createUrl(path);
    const result = await this.doRequest(url, 'GET', '', { apikey });
    return result.limits;
  }

  static async fetchWaterMark(apiKey: string) {
    const path = '/user/watermark';
    const url = this.createUrl(path);
    const { message } = await this.doRequest(url, 'POST', { apiKey });
    return message;
  }
}
