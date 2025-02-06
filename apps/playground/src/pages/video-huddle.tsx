

import { v4 as generateId } from "uuid";
import { createRoom, Room } from '@superviz/room'
import { VideoHuddle } from "@superviz/video";
import { Presence3D as  MatterportPresence3D} from "@superviz/matterport-plugin";

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";

const MATTERPORT_KEY = getConfig<string>("keys.matterport");
const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "video-huddle-new-room";

type WindowWithMP_SDK = Window & {
  MP_SDK: {
    connect: (window: Window, key: string) => Promise<unknown>;
  };
};

export function NewVideoHuddle() {
  const containerId = "matterport-container";
  const modelId = "Zh14WDtkjdC";
  const room = useRef<Room | null>(null);
  const mpSdk = useRef<any | null>();

  const initializeSuperViz = useCallback(async () => {
    const uuid = generateId();

    room.current = await createRoom({
      developerToken: SUPERVIZ_KEY,
      roomId: `${SUPERVIZ_ROOM_PREFIX}-${componentName}`,
      participant: {
        name: "Participant",
        id: uuid,
        email: "carlos@superviz.com"
      },
      group: {
        name: SUPERVIZ_ROOM_PREFIX,
        id: SUPERVIZ_ROOM_PREFIX,
      },
      environment: 'dev',
      debug: true,
    });

    const video = new VideoHuddle({
      participantType: 'host',
      permissions: { 
        toggleFollow: true, 
        toggleGoTo: true, 
        toggleGather: true, 
      }
    });
    
    room.current.addComponent(video);

    const matterport = new MatterportPresence3D(mpSdk.current!);
    room.current!.addComponent(matterport);

    // room.current.subscribe('participant.updated', (p) => { 
    //   console.log('participant.updated', p);
    // })
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
      room?.current?.leave();
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
