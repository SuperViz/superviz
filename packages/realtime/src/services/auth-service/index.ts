import config from '../config';
import { ApiService } from '../api';

export async function isValidApiKey(): Promise<boolean> {
  try {
    const apiKey = config.get<string>('apiKey');
    const baseUrl = config.get<string>('apiUrl');

    const response = await ApiService.validateApiKey(baseUrl, apiKey);
    return response === true;
  } catch (error) {
    if (error.status === 404) return false;

    throw new Error('Unable to validate API key');
  }
}
