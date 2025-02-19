import { Participant } from '../../common/types/participant.types';

export interface ParticipantMouse extends Participant {
  x: number;
  y: number;
  visible: boolean;
  camera: Camera;
}

export interface Camera {
  x: number;
  y: number;
  screen: {
    width: number;
    height: number;
  };
  scale: number;
}

export interface Transform {
  translate?: {
    x?: number;
    y?: number;
  };
  scale?: number;
}

export interface Position {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

export interface PresenceMouseProps {
  callbacks: {
    onGoToPresence?: (position: Position) => void;
  };
}

export type Element = HTMLElement & SVGElement;

export enum VoidElements {
  AREA = 'area',
  BASE = 'base',
  BR = 'br',
  COL = 'col',
  EMBED = 'embed',
  HR = 'hr',
  IMG = 'img',
  INPUT = 'input',
  LINK = 'link',
  META = 'meta',
  PARAM = 'param',
  SOURCE = 'source',
  TRACK = 'track',
  WBR = 'wbr',
}

export enum SVGElements {
  RECT = 'rect',
  ELLIPSE = 'ellipse',
  SVG = 'svg',
}
