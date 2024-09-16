import type { Object3D } from 'three';

import type { MpSdk as Matterport } from './matterport.types';

export interface Laser extends Matterport.Scene.INode {
  laserPointer?: any;
  obj3D?: Object3D;
}
