import type { ReactElement } from 'react';
import { DefaultComponentProps } from 'src/common/types/global.types';

export type MousePointersProps = DefaultComponentProps<{
  children?: ReactElement | string | ReactElement[] | null;
  elementId: string;
  callbacks?: {
    onGoToPresence?: (position: { x: number; y: number; scaleX: number; scaleY: number }) => void;
  };
}>;
