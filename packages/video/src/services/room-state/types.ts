import { LayoutMode } from '../video-manager/types';

export enum RoomPropertiesEvents {
  UPDATE = 'update',
}

export type State = {
  hostId: string | null
  followParticipantId: string | null
  cameraMode: LayoutMode
}
