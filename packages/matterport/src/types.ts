import { Vector3, Quaternion } from 'three';

export enum Mode {
  INSIDE = 'mode.inside',
  OUTSIDE = 'mode.outside',
  DOLLHOUSE = 'mode.dollhouse',
  FLOORPLAN = 'mode.floorplan',
  TRANSITIONING = 'mode.transitioning',
}

export interface MatterportComponentOptions {
  isAvatarsEnabled?: boolean;
  isLaserEnabled?: boolean;
  isNameEnabled?: boolean;
  avatarConfig?: AvatarConfig;
}

export interface PositionInfo {
  position: Vector3;
  rotation: Rotation;
  mode: Mode;
  sweep: string;
  floor: number;
  slot?: Slot;
}

export interface AvatarConfig {
  height?: number;
  scale?: number;
  laserOrigin?: Position;
}

export interface Avatar {
  model3DUrl: string;
  imageUrl: string;
}

export type Slot = {
  index: number;
  color: string;
  textColor: string;
  colorName: string;
  timestamp: number;
};

export interface ParticipantTo3D {
  id: string;
  name: string;
  avatar?: Avatar;
  avatarConfig?: AvatarConfig;
  isAudience?: boolean;
  slot?: Slot;
  isPrivate?: boolean;
}

export interface ParticipantOn3D extends ParticipantTo3D {
  position: Position;
  rotation: Rotation;
  sweep?: string;
  floor?: number;
  mode?: Mode;
  laser?: Position;
}

export type Position = {
  x: number;
  y: number;
  z: number;
};

export type Rotation = {
  x: number;
  y: number;
};
