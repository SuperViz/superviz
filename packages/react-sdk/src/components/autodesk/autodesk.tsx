import { Presence3D } from '@superviz/autodesk-viewer-plugin';
import { useEffect, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';
import type { AutoDeskComponent } from 'src/contexts/room.types';

import { AutodeskComponentProps, AutodeskViewerComponentProps } from './autodesk.types';

export function AutodeskPresence({ viewer, children, ...params }: AutodeskComponentProps) {
  const { room, component, addComponent } =
    useInternalFeatures<AutoDeskComponent>('presence3dAutodesk');
  const [initializedTimestamp, setInitializedTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!room || initializedTimestamp || !viewer) return;

    const autodesk = new Presence3D(viewer, params) as AutoDeskComponent;

    addComponent(autodesk);
    setInitializedTimestamp(Date.now());
  }, [room, viewer]);

  useEffect(() => {
    if (!component && initializedTimestamp) {
      setInitializedTimestamp(null);
    }
  }, [component]);

  return children ?? <></>;
}

export function AutodeskViewer({
  modelUrn,
  clientId,
  clientSecret,
  authUrl: url,
  initializeOptions,
  data,
  onDocumentLoadError,
  onDocumentLoadSuccess,
  onViewerInitialized,
  isAvatarsEnabled,
  isLaserEnabled,
  isNameEnabled,
  isMouseEnabled,
  avatarConfig,
  ...divParams
}: AutodeskViewerComponentProps) {
  const [instance, setInstance] = useState<Autodesk.Viewing.GuiViewer3D | null>(null);
  const { hasJoinedRoom } = useInternalFeatures<AutoDeskComponent>('presence3dAutodesk');
  const authUrl = url || 'https://developer.api.autodesk.com/authentication/v2/token';
  const token = btoa(`${clientId}:${clientSecret}`);
  const body = {
    // eslint-disable-next-line camelcase
    grant_type: 'client_credentials',
    scope: 'data:read bucket:read',
    ...data,
  };

  useEffect(() => {
    if (hasJoinedRoom) {
      loadDocument();
      return;
    }

    if (instance) {
      instance.finish();
      setInstance(null);
    }
  }, [hasJoinedRoom]);

  async function loadDocument() {
    let viewer: Autodesk.Viewing.GuiViewer3D | null = null;

    if (!window.Autodesk) {
      console.error('[Superviz] Autodesk not found');
      return;
    }

    await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${token}`,
      },
      body: new URLSearchParams(body).toString(),
    })
      .then((response) => response.json())
      .then((dataToken) => {
        const modelId = btoa(modelUrn);
        const documentId = `urn:${modelId}`;

        const options = {
          env: 'AutodeskProduction2',
          api: 'streamingV2',
          accessToken: dataToken.access_token,
          ...initializeOptions,
        };

        window.Autodesk.Viewing.Initializer(options, async () => {
          const container = document.getElementById('autodesk-content');

          if (!container) {
            console.error('[Superviz] Autodesk container not found');
            return;
          }

          viewer = new window.Autodesk.Viewing.GuiViewer3D(container);
          await viewer.start();

          onViewerInitialized &&
            onViewerInitialized({
              viewer,
              container,
            });

          window.Autodesk.Viewing.Document.load(documentId, onLoadSuccess, onLoadFailure);
        });
      });

    function onLoadSuccess(doc: any) {
      if (onDocumentLoadSuccess) onDocumentLoadSuccess(doc);

      const viewable = doc.getRoot().getDefaultGeometry();
      if (!viewable || !viewer) return;

      const options = {
        applyScaling: 'meters',
      };

      viewer
        .loadDocumentNode(doc, viewable, options)
        .then(() => {
          if (!viewer) return;
          setInstance(viewer);
        })
        .catch((error) => {
          console.error('[SuperViz] Failed to load document node', error);
        });
    }

    function onLoadFailure(
      errorCode: Autodesk.Viewing.ErrorCodes,
      errorMsg: string,
      messages: any[],
    ) {
      if (onDocumentLoadError) onDocumentLoadError(errorCode, errorMsg, messages);

      console.error('[SuperViz] Failed to load document', errorCode, errorMsg, messages);
    }
  }

  return (
    <AutodeskPresence
      viewer={instance as Autodesk.Viewing.GuiViewer3D}
      isAvatarsEnabled={isAvatarsEnabled}
      isLaserEnabled={isLaserEnabled}
      isNameEnabled={isNameEnabled}
      isMouseEnabled={isMouseEnabled}
      avatarConfig={avatarConfig}
    >
      <div id="autodesk-content" {...divParams}></div>
    </AutodeskPresence>
  );
}
