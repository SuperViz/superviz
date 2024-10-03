import type { MessageCallback, ProviderState } from '@superviz/yjs/dist/provider/types';
import type { ReactElement } from 'react';
import type { DefaultComponentProps } from 'src/common/types/global.types';
import type { Doc } from 'yjs';

export type YjsProviderCallbacks = {
  onConnect: () => void;
  onDisconnect: () => void;
  onSynced: () => void;
  onSync: () => void;
  onDestroy: () => void;
  onMessage: MessageCallback;
  onOutgoingMessage: MessageCallback;
  onStateChange: (state: ProviderState | `${ProviderState}`) => void;
};

export type YjsProviderProps = DefaultComponentProps<
  {
    children?: ReactElement | string | ReactElement[] | null | string[];
    doc: Doc;
    awareness?: boolean;
  } & Partial<YjsProviderCallbacks>
>;

export type Field = HTMLInputElement | HTMLTextAreaElement;
