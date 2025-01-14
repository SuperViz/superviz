import { StoreType } from '@superviz/sdk';

/** Store types used for state management */
export const STORE_TYPES = {
  GLOBAL: 'global-store' as StoreType.GLOBAL,
  PRESENCE_3D: 'presence-3d-store' as StoreType.PRESENCE_3D,
} as const;
