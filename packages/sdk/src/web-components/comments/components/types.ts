export type AnnotationOptions = {
  resolvable?: boolean;
  resolved?: boolean;
};

export enum CommentDropdownOptions {
  EDIT = 'EDIT',
  DELETE = 'DELETE',
}

export enum CommentMode {
  EDITABLE = 'editable',
  READONLY = 'readonly',
}

export enum PinMode {
  ADD = 'add',
  SHOW = 'show',
}

export enum AnnotationFilter {
  ALL = 'All comments',
  RESOLVED = 'Resolved comments',
}

export type HorizontalSide = 'left' | 'right';

export interface Sides {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
