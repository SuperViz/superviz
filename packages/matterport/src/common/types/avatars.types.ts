import type { Object3D, Quaternion, Vector3 } from 'three';

import type { MpSdk as Matterport } from './matterport.types';
import { Slot } from '../../types';

export enum AvatarsConstants {
  DEFAULT_AVATAR_URL = 'https://production.storage.superviz.com/readyplayerme/1.glb',
  DISTANCE_BETWEEN_AVATARS = 0.13,
  AVATARS_HEIGHT_ADJUST = 0.62,
  AVATARS_RADIUS = 0.3,
}

export interface Avatar extends Matterport.Scene.INode {
  obj3D?: Object3D;
  lerper?: Lerper;
  avatarName?: Name;
  addComponent: AddComponent;
}

export type AddComponent = (
  name: string,
  options?: {
    url?: string;
    localScale?: {
      x: number;
      y: number;
      z: number;
    };
    onLoaded: () => void;
  },
) => Matterport.Scene.IComponent;

export interface Lerper extends Matterport.Scene.IComponent {
  animateQuaternion?: (quaternion: Quaternion, multiply: Quaternion) => void;
  animateVector?: (position: Vector3, adjustPosVec: Vector3) => void;
}

export interface Name extends Matterport.Scene.IComponent {
  createName?: (avatar: Object3D, name: string, slot: Slot, height: number) => void;
}
