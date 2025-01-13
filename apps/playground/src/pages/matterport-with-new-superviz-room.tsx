import { v4 as generateId } from "uuid";


import { getConfig } from "../config";
import { useCallback, useEffect, useRef } from "react";
import { createRoom, Room } from "@superviz/room";
import { Presence3D } from "@superviz/matterport-plugin";

const MATTERPORT_KEY = getConfig<string>("keys.matterport");
const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

type WindowWithMP_SDK = Window & {
  MP_SDK: {
    connect: (window: Window, key: string) => Promise<unknown>;
  };
};

export function MatterportWithNewRoom() {
  const containerId = "matterport-container";
  const modelId = "Zh14WDtkjdC";
  const room = useRef<Room | null>(null);
  const mpSdk = useRef<any | null>(null);

  const initializeSuperViz = useCallback(async (matterportInstance: never) => {
    const uuid = generateId();

    room.current = await createRoom({
      developerToken: SUPERVIZ_KEY,
      participant: {
        name: "Participant Name",
        id: uuid,
      },
      group: {
        name: SUPERVIZ_ROOM_PREFIX,
        id: SUPERVIZ_ROOM_PREFIX,
      },
      roomId: `${SUPERVIZ_ROOM_PREFIX}-matterport-with-new-room`,
      debug: true, 
      environment: 'dev',
    });

    room.current.subscribe('my-participant.joined', () => { 
      console.log('my-participant.joined');

      const matterportPresence = new Presence3D(matterportInstance, {
        isAvatarsEnabled: true,
        isLaserEnabled: true,
        isNameEnabled: true,
      });
  
      room.current?.addComponent(matterportPresence);
    })
  }, []);

  const initializeMatterport = useCallback(async () => {
    const showcase = document.getElementById(containerId) as HTMLIFrameElement;

    if (!showcase) return;

    showcase.onload = async () => {
      const showcaseWindow = showcase.contentWindow as WindowWithMP_SDK;

      mpSdk.current = await showcaseWindow.MP_SDK.connect(
        showcaseWindow,
        MATTERPORT_KEY
      );

      initializeSuperViz(mpSdk.current as never);
    };
  }, [initializeSuperViz]);

  useEffect(() => {
    initializeMatterport();

    return () => {
      room.current?.leave();
      mpSdk.current?.disconnect();
    };
  }, []);

  return (
    <iframe
      className="matterport-iframe"
      id={containerId}
      src={`/mp-bundle/showcase.html?&brand=0&mls=2&mt=0&search=0&kb=0&play=1&qs=1&applicationKey=${MATTERPORT_KEY}&m=${modelId}`}
    />
  );
}
