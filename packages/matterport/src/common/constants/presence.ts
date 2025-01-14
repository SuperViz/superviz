/**
 * Constants used by the Presence3D service
 */

/** Duration of sweep transitions in milliseconds */
export const SWEEP_DURATION = 500;

/** Default avatar configuration */
export const DEFAULT_AVATAR = {
  model3DUrl: 'https://production.storage.superviz.com/readyplayerme/1.glb',
  imageUrl: 'https://production.cdn.superviz.com/static/default-avatars/1.png',
} as const;

/** Height for laser pointer when not using avatars */
export const NO_AVATAR_LASER_HEIGHT = 1.5;

/** Height offset for laser pointer when using avatars */
export const AVATAR_LASER_HEIGHT_OFFSET = 0.15;
