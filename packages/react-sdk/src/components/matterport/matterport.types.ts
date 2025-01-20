import type { MpSdk } from '@superviz/matterport-plugin/dist/common/types/matterport.types';
import type { AvatarConfig } from '@superviz/matterport-plugin/dist/types';
import type { ReactElement } from 'react';

export type MatterportComponentProps = {
  children?: ReactElement | string | ReactElement[] | null;
  matterportSdkInstance: MpSdk;
  isAvatarsEnabled?: boolean;
  isLaserEnabled?: boolean;
  isNameEnabled?: boolean;
  avatarConfig?: AvatarConfig;
};

type MatterportLoadedCallback = {
  matterportSdkInstance: MpSdk;
  showcaseWindow: HTMLIFrameElement;
};

export type MatterportIframeProps = {
  bundleUrl: string;
  matterportKey: string;
  onMpSdkLoaded?: (params: MatterportLoadedCallback) => void;
} & Omit<MatterportComponentProps, 'matterportSdkInstance' | 'children'> &
  Omit<
    React.DetailedHTMLProps<React.IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>,
    'src'
  >;
