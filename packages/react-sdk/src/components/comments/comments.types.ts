import type { AutodeskPin } from '@superviz/autodesk-viewer-plugin';
import type { MatterportPin } from '@superviz/matterport-plugin';
import type { ThreeJsPin } from '@superviz/threejs-plugin';
import { ReactElement } from 'react';
import { DefaultComponentProps } from 'src/common/types/global.types';

import type { ButtonLocation, CanvasPin, CommentsSide, HTMLPin } from '../../lib/sdk';

export type CommentsProps = DefaultComponentProps<{
  pin: CanvasPin | HTMLPin | MatterportPin | ThreeJsPin | AutodeskPin | null;
  children?: ReactElement | string | ReactElement[] | null;

  onPinActive?: () => void;
  onPinInactive?: () => void;

  position?: `${CommentsSide}`;
  buttonLocation?: `${ButtonLocation}` | string;
  hideDefaultButton?: boolean;
  styles?: string;
  offset?: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  };
}>;
