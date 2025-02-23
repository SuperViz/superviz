import { Vector3, Quaternion } from 'three';

import type { MpSdk as Matterport } from './common/types/matterport.types';

export enum Mode {
  INSIDE = 'mode.inside',
  OUTSIDE = 'mode.outside',
  DOLLHOUSE = 'mode.dollhouse',
  FLOORPLAN = 'mode.floorplan',
  TRANSITIONING = 'mode.transitioning',
}

export enum Presence3dEvents {
  PARTICIPANT_JOINED = 'participant-joined',
  GATHER = 'gather',
  FOLLOW_ME = 'follow-me',
  // FOLLOW_ME = 'who-is-online.start-follow-me',
  GO_TO_PARTICIPANT = 'go-to-participant',
  //  FOLLOW_PARTICIPANT = 'follow-participant',
  LOCAL_FOLLOW_PARTICIPANT = 'local-follow-participant',
  SET_PRIVATE = 'set-private',
  SET_PUBLIC = 'set-public',
  LOCAL_MODE_CHANGED = 'local-mode-changed',
  FOLLOW_PARTICIPANT_CHANGED = 'follow-participant-changed',
  LOCAL_FOLLOW_PARTICIPANT_CHANGED = 'local-follow-participant-changed',
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
  isPrivate?: boolean;
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

export interface Avatar3DTypes extends Matterport.Scene.INode {
  avatar3D?: any;
}

export interface Laser3DTypes extends Matterport.Scene.INode {
  laser3D?: any;
}

export interface NameLabel3DTypes extends Matterport.Scene.INode {
  nameLabel3D?: any;
}
