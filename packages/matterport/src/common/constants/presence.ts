/**
 * Constants used by the Presence3D service
 */

/** Default avatar URL */
export const DEFAULT_AVATAR_URL = 'https://production.storage.superviz.com/readyplayerme/1.glb';

/** Default avatar image URL */
export const DEFAULT_AVATAR_IMAGE_URL =
  'https://production.cdn.superviz.com/static/default-avatars/1.png';

/** Distance between avatars */
export const DISTANCE_BETWEEN_AVATARS = 0.02;

export const AVATARS_HEIGHT_ADJUST = 0.5;

/** Duration of sweep transitions in milliseconds */
export const SWEEP_DURATION = 1000;

/** Default avatar configuration */
export const DEFAULT_AVATAR = 'default';

/** Height for laser pointer when not using avatars */
export const NO_AVATAR_LASER_HEIGHT = 1.3;

/** Height offset for laser pointer when using avatars */
export const AVATAR_LASER_HEIGHT_OFFSET = 0.15;

/** Name height offset */
export const NAME_HEIGHT_OFFSET = -0.3;

/** This is used for dynamic nameLabel height. - The is the Minimum height */
export const MIN_NAME_HEIGHT = 0.5; // 0.5 meters above when close

/** This is used for dynamic nameLabel height. - The is the maximum height */
export const MAX_NAME_HEIGHT = 0.4; // 3 meters above when far away

export const MAX_DISTANCE = 8;

/** This is used for dynamic nameLabel height. - The is the Minimum distance squared */
export const MIN_DIST_SQUARED = 1;

/** This is used for dynamic nameLabel height. - The is the Maximum distance squared */
export const MAX_DIST_SQUARED = 100;
