export interface Simple2DPoint {
  x: number;
  y: number;
}

export interface TemporaryPinData extends Partial<Simple2DPoint> {
  elementId?: string;
}

export type HorizontalSide = 'left' | 'right';

export interface HTMLPinOptions {
  dataAttributeName?: string;
  dataAttributeValueFilters?: RegExp[];
}
