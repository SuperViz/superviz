import { Object3D } from 'three';

export interface TextObject extends Object3D {
  textHeight?: number;
  textWidth?: number;
}

export interface TextStyle {
  color: string;
  backgroundColor: string;
}

export interface CanvasSettings {
  TEXT_HEIGHT: number;
  PADDING: {
    HORIZONTAL: number;
    VERTICAL: number;
  };
  TEXT_WIDTH_MULTIPLIER: number;
}

export interface FontSettings {
  SIZE: number;
  FAMILY: string;
  URL: string;
}

export interface StyleSettings {
  BACKGROUND_COLOR: string;
  TEXT_COLOR: string;
  BACKGROUND_HEIGHT_SCALE: number;
  BACKGROUND_SCALE: {
    x: number;
    y: number;
    z: number;
  };
}
