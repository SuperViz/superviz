import type { Vector3, Quaternion } from 'three';

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
  quaternion?: Quaternion;
  target?: Vector3;
  mouse?: Vector3;
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

export interface AutodeskViewerComponentOptions {
  isAvatarsEnabled?: boolean;
  isLaserEnabled?: boolean;
  isNameEnabled?: boolean;
  isMouseEnabled?: boolean;
  avatarConfig?: AvatarConfig;
}

export interface PositionInfo {
  position: THREE.Vector3;
  target: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

export enum Presence3dEvents {
  PARTICIPANT_JOINED = 'participant-joined',
  GATHER = 'gather',
  FOLLOW_ME = 'follow-me',
}
