import type { Quaternion, Vector3 } from 'three';

export interface ThreeJsComponentOptions {
  isAvatarsEnabled?: boolean;
  isLaserEnabled?: boolean;
  isNameEnabled?: boolean;
  isMouseEnabled?: boolean;
  renderLocalAvatar?: boolean;
  avatarConfig?: AvatarConfig;
}

export interface PositionInfo {
  position: Vector3;
  pointer: Vector3;
  quaternion: Quaternion;
}

export interface AvatarConfig {
  height: number;
  scale: number;
  laserOrigin: Position;
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
  position: Vector3;
  rotation: Rotation;
  pointer?: Vector3;
  quaternion?: Quaternion;
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

export enum Presence3dEvents {
  PARTICIPANT_JOINED = 'participant-joined',
  GATHER = 'gather',
  FOLLOW_ME = 'follow-me',
}
