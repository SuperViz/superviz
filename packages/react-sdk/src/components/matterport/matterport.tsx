import { Presence3D } from '@superviz/matterport-plugin';
import type { MpSdk } from '@superviz/matterport-plugin/dist/common/types/matterport.types';
import type { MatterportComponentOptions } from '@superviz/matterport-plugin/dist/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';
import { MatterportComponent } from 'src/contexts/room.types';

import { MatterportComponentProps, MatterportIframeProps } from './matterport.types';

export function MatterportPresence({
  matterportSdkInstance,
  children,
  ...params
}: MatterportComponentProps) {
  const { room, component, addComponent, removeComponent } =
    useInternalFeatures<MatterportComponent>('presence3dMatterport');
  const [initializedTimestamp, setInitializedTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!room || !matterportSdkInstance) {
      return;
    }

    const matterportInstance = new Presence3D(
      matterportSdkInstance,
      params as MatterportComponentOptions,
    ) as MatterportComponent;

    addComponent(matterportInstance);
    setInitializedTimestamp(Date.now());
  }, [room, matterportSdkInstance]);

  useEffect(() => {
    if (!component && initializedTimestamp) {
      setInitializedTimestamp(null);
    }
  }, [component]);

  useEffect(() => {
    if ((!matterportSdkInstance || !room) && component) {
      removeComponent(component);
    }
  }, [matterportSdkInstance, room]);

  return children ?? <></>;
}

export function MatterportIframe({
  isAvatarsEnabled,
  isLaserEnabled,
  isNameEnabled,
  avatarConfig,
  bundleUrl,
  matterportKey,
  onMpSdkLoaded,
  ...iframeProps
}: MatterportIframeProps) {
  const { room, removeComponent, component } =
    useInternalFeatures<MatterportComponent>('presence3dMatterport');
  const iframe = useRef<HTMLIFrameElement>(null);
  const [matterportInstance, setMatterportInstance] = useState<MpSdk | null>(null);
  const url = useRef<string>('');

  useEffect(() => {
    if (!iframe.current) return;

    initializeMatterportSdk();
  }, [bundleUrl, iframe.current]);

  useEffect(() => {
    if (!room && matterportInstance) {
      setMatterportInstance(null);
      iframe.current?.remove();
    }
  }, [room]);

  const initializeMatterportSdk = useCallback(async () => {
    if (url.current === bundleUrl) {
      return;
    }
    url.current = bundleUrl;

    if (matterportInstance) {
      setMatterportInstance(null);
      removeComponent(component);
    }

    const showcase = document.getElementById('showcase') as HTMLIFrameElement;

    const showcaseWindow = showcase.contentWindow;
    showcase.setAttribute('src', bundleUrl);

    if (!showcaseWindow) {
      console.error('[SuperViz] Matterport Showcase iframe not found');
      return;
    }

    const mpsdk = await new Promise<MpSdk>((resolve) => {
      const callback = async () => {
        // @ts-ignore
        const mpSdk = (await showcaseWindow.MP_SDK.connect(showcaseWindow, matterportKey)) as MpSdk;

        if (onMpSdkLoaded) {
          onMpSdkLoaded({
            matterportSdkInstance: mpSdk,
            showcaseWindow: iframe.current as HTMLIFrameElement,
          });
        }

        resolve(mpSdk);
        showcase.removeEventListener('load', callback);
      };

      showcase.addEventListener('load', callback);
    });

    setMatterportInstance(mpsdk);
  }, [bundleUrl]);

  return (
    <>
      <MatterportPresence
        matterportSdkInstance={matterportInstance as MpSdk}
        isAvatarsEnabled={isAvatarsEnabled}
        isLaserEnabled={isLaserEnabled}
        isNameEnabled={isNameEnabled}
        avatarConfig={avatarConfig}
      />
      <iframe ref={iframe} id="showcase" {...iframeProps} />
    </>
  );
}
