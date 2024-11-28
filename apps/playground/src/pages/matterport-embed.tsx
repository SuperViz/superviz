import { v4 as generateId } from "uuid";
import { LauncherFacade, Room, VideoConference } from "../lib/sdk";
import { MatterportPresence3D } from "../lib/matterport";

import { getConfig } from "../config";
import { useCallback, useEffect, useRef } from "react";

const MATTERPORT_KEY = getConfig<string>("keys.matterport");
const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

export function MatterportEmbed() {
  const containerId = "matterport-container";
  const modelId = "Zh14WDtkjdC";
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
      isAvatarsEnabled: true,
      isLaserEnabled: true,
      isNameEnabled: true,
    });

    room.current.addComponent(matterportPresence);

    const videoConference = new VideoConference({
      participantType: 'host',
      enableFollow: true,
      enableGather: true,
      enableGoTo: true,
      collaborationMode: {
        enabled: true,
      },
      defaultAvatars: true,
    });

    room.current.addComponent(videoConference);
  }, []);

  const initializeMatterport = useCallback(async () => {
    const showcase = document.getElementById(containerId) as HTMLIFrameElement;

    if (!showcase) return;

    showcase.onload = async () => {

      // @ts-expect-error MP_SDK
      mpSdk.current = await window.MP_SDK.connect(
        showcase,
        MATTERPORT_KEY
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

  return (
    <iframe
      className="matterport-iframe"
      id={containerId}
      src={`https://my.matterport.com/show?&brand=0&mls=2&mt=0&search=0&kb=0&play=1&qs=1&applicationKey=${MATTERPORT_KEY}&m=${modelId}`}
    />
  );
}
