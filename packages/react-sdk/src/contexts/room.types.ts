import type { Presence3D as AutodeskPresence3D } from '@superviz/autodesk-viewer-plugin';
import type { Presence3D as MatterportPresence3D } from '@superviz/matterport-plugin';
import type React from 'react';

import {
  type SuperVizYjsProvider,
  type CommentsComponent,
  type DefaultComponentNames,
  type FormElementsComponent,
  type LauncherFacade,
  type Participant,
  type PointersCanvas,
  type PointersHTML,
  type RealtimeComponent,
  type SuperVizSdkOptions,
  type ThreeJsPresence3D,
  type VideoConferenceComponent,
  type WhoIsOnlineComponent,
} from '../lib/sdk';

export type ComponentNames = `${DefaultComponentNames}`;

export type RoomContextData = {
  addComponent: (component: SuperVizComponent) => void;
  removeComponent: (component: SuperVizComponent) => void;
  activeComponents: Record<ComponentNames, SuperVizComponent | undefined>;
  room: LauncherFacade | null;
  hasJoinedRoom: boolean;
  hasProvider: boolean;
  startRoom: () => void;
  stopRoom: () => void;
};

export type RoomProviderCallbacks = {
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (participant: Participant) => void;
  onParticipantLocalJoined?: (participant: Participant) => void;
  onParticipantLocalLeft?: (participant: Participant) => void;
  onParticipantLocalUpdated?: (participant: Participant) => void;
  onParticipantListUpdated?: (participantList: Participant[]) => void;
};

export type RoomProviderProps = RoomProviderCallbacks & {
  developerKey: string;
  roomId: SuperVizSdkOptions['roomId'];
  participant: {
    id: string;
    name: string;
    avatar?: {
      model3DUrl?: string;
      imageUrl?: string;
    };
  };
  group: SuperVizSdkOptions['group'];
  customColors?: SuperVizSdkOptions['customColors'];
  environment?: SuperVizSdkOptions['environment'];
  debug?: SuperVizSdkOptions['debug'];
  children: React.ReactNode;
  stopAutoStart?: boolean;
};

export type MatterportComponent = MatterportPresence3D & { name: ComponentNames };
export type AutoDeskComponent = AutodeskPresence3D & { name: ComponentNames };
export type ThreeJsComponent = ThreeJsPresence3D & { name: ComponentNames };

export type SuperVizComponent =
  | VideoConferenceComponent
  | CommentsComponent
  | PointersCanvas
  | PointersHTML
  | RealtimeComponent
  | WhoIsOnlineComponent
  | MatterportComponent
  | AutoDeskComponent
  | FormElementsComponent
  | ThreeJsComponent
  | SuperVizYjsProvider;

export type InternalFeaturesContextData<T> = T extends SuperVizComponent
  ? Omit<RoomContextData, 'hasProvider'> & { component: T }
  : Omit<RoomContextData, 'hasProvider'>;
