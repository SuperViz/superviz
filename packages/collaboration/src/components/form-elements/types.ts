import { SocketEvent } from '@superviz/socket-client';

export type FormElementsProps = {
  fields?: string[] | string;
} & Flags;

export type Flags = {
  disableOutline?: boolean;
  disableRealtimeSync?: boolean;
};

export type Field = HTMLInputElement | HTMLTextAreaElement;

export enum FieldEvents {
  BLUR = 'field.blur',
  FOCUS = 'field.focus',
  CONTENT_CHANGE = 'field.content-change',
  INTERACTION = 'field.interaction',
}

export interface FocusPayload {
  color: string;
  fieldId: string;
}

export type InputPayload = {
  value: string | boolean;
  showOutline: boolean;
  syncContent: boolean;
  attribute: 'value' | 'checked';
} & FocusPayload;

export type Focus = {
  firstInteraction: number;
  lastInteraction: number;
  id: string;
  color: string;
};

export type RealtimeCallback<T> = (data: SocketEvent<T>) => void;

export type BlurPayload = {
  fieldId: string;
};
