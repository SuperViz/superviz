import { v4 as generateId } from "uuid";


import { getConfig } from "../config";
import { useCallback, useEffect, useRef } from "react";
import { createRoom, Room } from "@superviz/room";
import { Presence3D } from "@superviz/matterport-plugin";
import { WhoIsOnline } from "@superviz/sdk";

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
  const matterportPresence = useRef<Presence3D | null>(null);
  const whoIsOnline = useRef<WhoIsOnline | null>(null);

  const initializeSuperViz = useCallback(async () => {
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

    addMatterport();
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

      initializeSuperViz();
    };
  }, [initializeSuperViz]);

  useEffect(() => {
    initializeMatterport();

    return () => {
      room.current?.leave();
      mpSdk.current?.disconnect();
    };
  }, []);

  const addMatterport = () => {
    if (!room.current || !mpSdk.current || matterportPresence.current) return;

    matterportPresence.current = new Presence3D(mpSdk.current, {
      isAvatarsEnabled: true,
      isLaserEnabled: true,
      isNameEnabled: true,
    });

    whoIsOnline.current = new WhoIsOnline();

    room.current.addComponent(whoIsOnline.current);
    room.current?.addComponent(matterportPresence.current);
  }

  const removeMatterport = () => {
    if (!room.current || !mpSdk.current) return;

    if(whoIsOnline.current) {
      room.current.removeComponent(whoIsOnline.current!);
    }

    if(matterportPresence.current) {
      room.current?.removeComponent(matterportPresence.current!);
    }

    matterportPresence.current = null;
    whoIsOnline.current = null;
  }

  return (
    <div className="w-full h-full flex">
      <div>
        <button 
          // disabled={!room.current || !mpSdk.current || !!matterportPresence.current}
          onClick={addMatterport}
        >
          Add Matterport
        </button>
        <button 
          // disabled={!room.current || !mpSdk.current || !matterportPresence.current}
          onClick={removeMatterport}
        >
          Remove Matterport
        </button>
      </div>
      <iframe
        className="matterport-iframe"
        id={containerId}
        src={`/mp-bundle/showcase.html?&brand=0&mls=2&mt=0&search=0&kb=0&play=1&qs=1&applicationKey=${MATTERPORT_KEY}&m=${modelId}`}
      />
    </div>
  );
}
