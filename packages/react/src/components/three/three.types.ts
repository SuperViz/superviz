import type { AvatarConfig } from '@superviz/threejs-plugin/dist/types';
import type { ReactElement } from 'react';
import type { Camera, Object3D, Scene } from 'three';

export type ThreeJsComponentProps = {
  children?: ReactElement | ReactElement[] | string | null;
  scene: Scene;
  camera: Camera;
  player: Object3D;
  isAvatarsEnabled?: boolean;
  isLaserEnabled?: boolean;
  isNameEnabled?: boolean;
  isMouseEnabled?: boolean;
  renderLocalAvatar?: boolean;
  avatarConfig?: AvatarConfig;
};
