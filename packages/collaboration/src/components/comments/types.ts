import {
  ParticipantByCommentsApi,
  ParticipantByGroupApi,
} from '../../common/types/participant.types';
import { Observer } from '../../common/utils';

export type Annotation = {
  uuid: string;
  position: string;
  resolved: boolean;
  comments: Comment[];
};

export type Comment = {
  uuid: string;
  avatar: string;
  text: string;
  createdAt: string;

  resolvable?: boolean;
  resolved?: boolean;
  participant: ParticipantByCommentsApi;

  mentions: CommentMention[];
};

export type CommentMention = {
  userId: string;
  name: string;
};

export interface PinAdapter {
  setPinsVisibility(isVisible: boolean): void;
  setActive(isOpen: boolean): void;
  destroy(): void;
  updateAnnotations(annotations: Annotation[]): void;
  removeAnnotationPin(uuid: string): void;
  onPinFixedObserver: Observer;
  setCommentsMetadata(side: 'left' | 'right'): void;
  participantsList: ParticipantByGroupApi[];
}

export interface PinCoordinates {
  x: number;
  y: number;
  z?: number;
  elementId?: string;
  type: 'canvas' | 'matterport' | 'threejs' | 'autodesk' | 'html';
}

// @NOTE - this is used for 3d annotations
export interface PinCoordinatesIn3D {
  position: PinCoordinates;
  camera: any;
}

export type AnnotationPositionInfo = PinCoordinates | PinCoordinatesIn3D;

export enum CommentsSide {
  LEFT = 'left',
  RIGHT = 'right',
}

export enum ButtonLocation {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
}

export interface Offset {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface CommentsOptions {
  position?: CommentsSide | `${CommentsSide}`;
  buttonLocation?: ButtonLocation | `${ButtonLocation}` | string;
  hideDefaultButton?: boolean;
  styles?: string;
  offset?: Offset;
}
