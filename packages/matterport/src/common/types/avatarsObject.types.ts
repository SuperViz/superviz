import type { Object3D } from 'three';

import { Slot } from '../../types';

import { Lerper } from './avatars.types';
import type { MpSdk as Matterport } from './matterport.types';

export enum AvatarsConstants {
  DEFAULT_AVATAR_URL = 'https://production.storage.superviz.com/readyplayerme/1.glb',
  DEFAULT_AVATAR_IMAGE_URL = 'https://production.cdn.superviz.com/static/default-avatars/1.png',
  DISTANCE_BETWEEN_AVATARS = 0.13,
  AVATARS_HEIGHT_ADJUST = 0.62,
  AVATARS_RADIUS = 0.3,
}

export interface AvatarObject extends Matterport.Scene.INode {
  obj3D?: any;
  lerper?: any;
  avatarName?: any;
  avatar?: any;
  update?: () => void;
}

export interface Name extends Matterport.Scene.IComponent {
  createName?: (avatar: Object3D, name: string, slot: Slot, height: number) => void;
}
