import { v4 as generateId } from "uuid";
import { LauncherFacade, Room } from "../lib/sdk";
import { MatterportPresence3D } from "../lib/matterport";

import { getConfig } from "../config";
import { useCallback, useEffect, useRef } from "react";

const MATTERPORT_KEY = getConfig<string>("keys.matterport");
const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

type WindowWithMP_SDK = Window & {
  MP_SDK: {
    connect: (window: Window, key: string) => Promise<unknown>;
  };
};

export function Matterport() {
  const containerId = "matterport-container";
  const modelId = "sfhmi3y1MDk";
  const room = useRef<LauncherFacade | null>(null);
  const mpSdk = useRef<any | null>(null);

  const initializeSuperViz = useCallback(async (matterportInstance: never) => {
    const uuid = generateId();

    room.current = await Room(SUPERVIZ_KEY, {
      roomId: `${SUPERVIZ_ROOM_PREFIX}-presence-3d`,
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

    const matterportPresence = new MatterportPresence3D(matterportInstance, {
      isAvatarsEnabled: false,
      isLaserEnabled: true,
      isNameEnabled: true,
    });

    room.current.addComponent(matterportPresence);
  }, []);

  const initializeMatterport = useCallback(async () => {
    const showcase = document.getElementById(containerId) as HTMLIFrameElement;

    if (!showcase) return;

    showcase.onload = async () => {
      const showcaseWindow = showcase.contentWindow as WindowWithMP_SDK;

      mpSdk.current = await showcaseWindow.MP_SDK.connect(
        showcaseWindow,
        MATTERPORT_KEY,
      );

      initializeSuperViz(mpSdk.current as never);
    };
  }, [initializeSuperViz]);

  useEffect(() => {
    initializeMatterport();

    return () => {
      room.current?.destroy();
      mpSdk.current?.disconnect();
    };
  }, []);

  console.log("matterport component @ render");

  return (
    <iframe
      className="matterport-iframe"
      id={containerId}
      src={`/mp-bundle/showcase.html?&play=1&search=0&vr=0&qs=1&hr=0&kb=0&applicationKey=${MATTERPORT_KEY}&m=${modelId}`}
    />
  );
}
