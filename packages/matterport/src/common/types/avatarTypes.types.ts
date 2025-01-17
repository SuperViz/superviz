import type { Object3D } from 'three';

import { Slot } from '../../types';

import type { MpSdk as Matterport } from './matterport.types';

export interface AvatarTypes extends Matterport.Scene.INode {
  obj3D?: any;
  lerper?: any;
  avatarName?: any;
  avatar?: any;
  update?: () => void;
}

export interface Name extends Matterport.Scene.IComponent {
  createName?: (avatar: Object3D, name: string, color: string, height: number) => void;
  updateHeight?: (height: number) => void;
  textObject?: Object3D;
}
