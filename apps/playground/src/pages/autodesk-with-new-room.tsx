import { v4 as generateId } from "uuid";
import { Presence3D } from "@superviz/autodesk-viewer-plugin";
import { createRoom, Room } from '@superviz/room'

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";

import "../styles/autodesk.css";
import { Helmet } from "react-helmet-async";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");
const FORGE_CLIENT = getConfig<string>("keys.forge.clientId");
const FORGE_SECRET = getConfig<string>("keys.forge.clientSecret");

const componentName = "autodesk-with-new-room";

export function AutodeskWithNewRoom() {
  const room = useRef<Room | null>(null);
  const loaded = useRef<boolean>(false);
  const autodesk = useRef<Presence3D>();
  const viewerDiv = useRef<HTMLDivElement>();
  const viewer = useRef<Autodesk.Viewing.GuiViewer3D | null>(null);

  const initializeSuperViz = useCallback(async () => {
    const uuid = generateId();

    room.current = await createRoom({
      developerToken: SUPERVIZ_KEY,
      roomId: `${SUPERVIZ_ROOM_PREFIX}-${componentName}`,
      participant: {
        name: "Participant",
        id: uuid,
      },
      group: {
        name: SUPERVIZ_ROOM_PREFIX,
        id: SUPERVIZ_ROOM_PREFIX,
      },
      environment: "dev",
      debug: true,
    });

    autodesk.current = new Presence3D(viewer.current as Autodesk.Viewing.GuiViewer3D, {
      isAvatarsEnabled: true,
      isLaserEnabled: true,
      isNameEnabled: true,
      avatarConfig: {
        height: 0,
        scale: 1,
        laserOrigin: { x: 0, y: 0, z: 0 },
      },
    });

    room.current.addComponent(autodesk.current);
  }, []);

  const onDocumentLoadSuccess = useCallback(async (document: Autodesk.Viewing.Document) => {
    const viewable = document.getRoot().getDefaultGeometry();

    if(!viewable) return

    try {
      await viewer.current!.loadDocumentNode(document, viewable, {
        applyScaling: 'meters'
      })

      await initializeSuperViz()
    } catch (error) { 
      console.log('Document loaded failed', error)
    }

  }, [initializeSuperViz])

  const onDocumentLoadFailure = () => {
    console.log('Document loaded failed')
  }

  const forge = useCallback(async (modelURN: string) => {
    if(loaded.current) return

    loaded.current = true

    const AUTH_URL =
      "https://developer.api.autodesk.com/authentication/v2/token";

    // Convert client_id and client_secret to Base64 for the Authorization header
    const credentials = btoa(`${FORGE_CLIENT}:${FORGE_SECRET}`);

    const data = {
      grant_type: "client_credentials",
      scope: "data:read bucket:read",
    };

    fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams(data).toString(),
    })
      .then((res) => {
        return res.json();
      })
      .then((dataToken) => {
        console.log("sucess get token", dataToken);

        const options = {
          env: "AutodeskProduction2",
          api: "streamingV2",
          accessToken: dataToken.access_token,
        };
        const modelID = btoa(modelURN);
        const documentId = `urn:${modelID}`;

        Autodesk.Viewing.Initializer(options, async () => {
          viewerDiv.current = document.getElementById(
            "forge-viewer"
          ) as HTMLDivElement;
          viewer.current = new Autodesk.Viewing.GuiViewer3D(viewerDiv.current);

          await viewer.current!.start();
          viewer.current!.setTheme("dark-theme");
          viewer.current!.setQualityLevel(false, false);
          viewer.current!.setGhosting(false);
          viewer.current!.setGroundShadow(false);
          viewer.current!.setGroundReflection(false);
          viewer.current!.setOptimizeNavigation(true);
          viewer.current!.setProgressiveRendering(true);

          Autodesk.Viewing.Document.load(
            documentId,
            onDocumentLoadSuccess,
            onDocumentLoadFailure,
          );
        });
      });
  }, [onDocumentLoadSuccess]);

  useEffect(() => {
    forge("urn:adsk.objects:os.object:e8d17563-1a4e-4471-bd72-a0a7e8d719bc/fileifc.ifc")

    return () => {
      room.current?.leave();
    };
  }, []);

  return (
    <>
      <Helmet>
        <script src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js"></script>
      </Helmet>
      <main>
        <section>
          <div id="forge-container">
            <div id="forge-viewer" className="forge-viewer" />
          </div>
        </section>
      </main>
    </>
  );
}
