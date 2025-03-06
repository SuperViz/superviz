import type { MpSdk as Matterport } from '../common/types/matterport.types';
import type { Avatar3DTypes, ParticipantOn3D } from '../types';

export class AvatarService {
  private avatars: Record<string, Avatar3DTypes> = {};
  private THREE: any;

  constructor() {}

  public setTHREE(THREE: any) {
    this.THREE = THREE;
  }

  public getTHREE(): any {
    return this.THREE;
  }

  public getAvatars(): Record<string, Avatar3DTypes> {
    return this.avatars;
  }

  public setAvatar(id: string, avatar: Avatar3DTypes) {
    this.avatars[id] = avatar;
  }

  public removeAvatar(id: string) {
    delete this.avatars[id];
  }
}
