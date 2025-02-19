import { doRequest } from '../../common/utils';
import { Annotation } from '../../components/comments/types';
import config from '../config';

import {
  AnnotationParams,
  CommentParams,
  CreateParticipantParams,
  FetchAnnotationsParams,
  MentionParams,
} from './types';

export default class ApiService {
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

  static fetchConfig(baseUrl: string, apiKey: string) {
    const path: string = '/immersive-config';
    const url: string = this.createUrl(baseUrl, path);
    return doRequest(url, 'POST', { apiKey });
  }

  static async fetchLimits(baseUrl: string, apikey: string): Promise<any> {
    const path: string = '/user/check_limits_v2';
    const url: string = this.createUrl(baseUrl, path);
    const result = await doRequest(url, 'GET', '', { apikey });
    return result.limits;
  }

  static async fetchWaterMark(baseUrl: string, apiKey: string) {
    const path = '/user/watermark';
    const url = this.createUrl(baseUrl, path);
    const { message } = await doRequest(url, 'POST', { apiKey });
    return message;
  }

  static async createAnnotations(baseUrl: string, apiKey: string, annotations: AnnotationParams) {
    const path = '/annotations';
    const url = this.createUrl(baseUrl, path);
    return doRequest(url, 'POST', { ...annotations }, { apikey: apiKey });
  }

  static async updateComment(baseUrl: string, apiKey: string, commentId: string, text: string) {
    const path = `/comments/${commentId}`;
    const url = this.createUrl(baseUrl, path);
    return doRequest(
      url,
      'PUT',
      {
        text,
      },
      { apikey: apiKey },
    );
  }

  static async createComment(baseUrl: string, apiKey: string, comment: CommentParams) {
    const path = '/comments';
    const url = this.createUrl(baseUrl, path);
    return doRequest(url, 'POST', { ...comment }, { apikey: apiKey });
  }

  static async fetchAnnotation(baseUrl: string, apiKey: string, query: FetchAnnotationsParams) {
    const path = '/annotations';
    const url = this.createUrl(baseUrl, path, {
      roomId: query.roomId
    });
    return doRequest(url, 'GET', undefined, { apikey: apiKey });
  }

  static async resolveAnnotation(
    baseUrl: string,
    apiKey: string,
    annotationId: string,
  ): Promise<Annotation> {
    const path = `/annotations/resolve/${annotationId}`;
    const url = this.createUrl(baseUrl, path);

    return doRequest(url, 'POST', {}, { apikey: apiKey });
  }

  static async deleteComment(baseUrl: string, apiKey: string, commentId: string) {
    const path = `/comments/${commentId}`;
    const url = this.createUrl(baseUrl, path);

    return doRequest(url, 'DELETE', {}, { apikey: apiKey });
  }

  static async deleteAnnotation(baseUrl: string, apiKey: string, annotationId: string) {
    const path = `/annotations/${annotationId}`;
    const url = this.createUrl(baseUrl, path);

    return doRequest(url, 'DELETE', {}, { apikey: apiKey });
  }

  static async createParticipant(
    participant: CreateParticipantParams,
  ): Promise<void> {
    const baseUrl = config.get<string>('apiUrl');
    const path = '/participants';
    const url = this.createUrl(baseUrl, path);
    return doRequest(url, 'POST', { ...participant }, { apikey: config.get<string>('apiKey') });
  }

  static async fetchParticipant(id: string) {
    const baseUrl = config.get<string>('apiUrl');
    const path = `/participants/${id}`;
    const url = this.createUrl(baseUrl, path);
    return doRequest(url, 'GET', undefined, { apikey: config.get<string>('apiKey') });
  }

  static async sendActivity(userId: string, groupId: string, groupName: string, product: string) {
    const path = '/activity';
    const baseUrl = config.get<string>('apiUrl');
    const meetingId = config.get<string>('roomId');
    const apikey = config.get<string>('apiKey');
    const url = this.createUrl(baseUrl, path);
    const body = {
      groupId,
      groupName,
      meetingId,
      product,
      userId,
    };
    return doRequest(url, 'POST', body, { apikey });
  }

  static async fetchParticipantsByGroup(groupId: string) {
    const path = `/groups/participants/${groupId}`;
    const baseUrl = config.get<string>('apiUrl');
    const url = this.createUrl(baseUrl, path, { take: 10000 });
    return doRequest(url, 'GET', undefined, { apikey: config.get('apiKey') });
  }

  static async createMentions(mentionParams: MentionParams) {
    const path = '/mentions';
    const baseUrl = config.get<string>('apiUrl');
    const url = this.createUrl(baseUrl, path);
    return doRequest(url, 'POST', mentionParams, { apikey: config.get('apiKey') });
  }
}
