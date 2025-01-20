import { AvatarConfig } from '@superviz/autodesk-viewer-plugin/dist/types';
import type { ReactElement } from 'react';

export type AutodeskComponentProps = {
  viewer: Autodesk.Viewing.GuiViewer3D;
  children?: ReactElement | string | ReactElement[] | null;
  isAvatarsEnabled?: boolean;
  isLaserEnabled?: boolean;
  isNameEnabled?: boolean;
  isMouseEnabled?: boolean;
  avatarConfig?: AvatarConfig;
};

type ViewerInitializedParams = {
  viewer: Autodesk.Viewing.GuiViewer3D;
  container: HTMLElement;
};

export type AutodeskViewerComponentProps = {
  modelUrn: string;
  clientId: string;
  clientSecret: string;

  onViewerInitialized?: (params: ViewerInitializedParams) => void;
  onDocumentLoadSuccess?: (doc: Document) => void;
  onDocumentLoadError?: (
    errorCode: Autodesk.Viewing.ErrorCodes,
    errorMsg: string,
    messages: any[],
  ) => void;

  authUrl?: string;
  initializeOptions?: Omit<Autodesk.Viewing.InitializerOptions, 'accessToken'>;
  data?: {
    client_id?: string;
    client_secret?: string;
    grant_type: string;
    scope: string;
  };
} & Omit<AutodeskComponentProps, 'viewer' | 'children'> &
  Omit<React.HTMLAttributes<HTMLDivElement>, 'id'>;
