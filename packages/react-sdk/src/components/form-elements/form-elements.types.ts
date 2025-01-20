import { ReactElement } from 'react';
import { DefaultComponentProps } from 'src/common/types/global.types';

export type FormElementsProps = DefaultComponentProps<{
  children?: ReactElement | string | ReactElement[] | null;
  fields?: string[] | string;
  disableOutline?: boolean;
  disableRealtimeSync?: boolean;
  onContentChange?: (data: {
    value: string;
    fieldId: string;
    attribute: string;
    userId: string;
    userName: string;
    timestamp: number;
  }) => void;
  onInteraction?: (data: {
    fieldId: string;
    userId: string;
    userName: string;
    color: string;
  }) => void;
}>;

export enum FieldEvents {
  BLUR = 'field.blur',
  FOCUS = 'field.focus',
  CONTENT_CHANGE = 'field.content-change',
  INTERACTION = 'field.interaction',
}

export type Field = HTMLInputElement | HTMLTextAreaElement;
