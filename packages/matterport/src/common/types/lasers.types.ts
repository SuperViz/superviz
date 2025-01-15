import type { Object3D } from 'three';

import { Slot } from '../../types';

import type { MpSdk as Matterport } from './matterport.types';

export interface Laser extends Matterport.Scene.INode {
  laserPointer?: any;
  obj3D?: Object3D;
  avatarName?: Name;
}

export interface Name extends Matterport.Scene.IComponent {
  createName?: (avatar: Object3D, name: string, slot: Slot, height: number) => void;
  updateHeight?: (height: number) => void;
  textObject?: Object3D;
}
