import { v4 as generateId } from "uuid";
import {
  LauncherFacade,
  ParticipantType,
  Room,
  VideoConference,
} from "../lib/sdk";
import { MatterportPresence3D } from "../lib/matterport";

import { getConfig } from "../config";
import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const MATTERPORT_KEY = getConfig<string>("keys.matterport");
const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

type WindowWithMP_SDK = Window & {
  MP_SDK: {
    connect: (window: Window, key: string) => Promise<unknown>;
  };
};

export function MatterportWithVideo() {
  const containerId = "matterport-container";
  const modelId = "Zh14WDtkjdC";
  const room = useRef<LauncherFacade | null>(null);
  const mpSdk = useRef<any | null>();
  const [searchParams] = useSearchParams();

  const initializeSuperViz = useCallback(async () => {
    const uuid = generateId();
    const type =
      (searchParams.get("userType") as ParticipantType) || ParticipantType.HOST;

    room.current = await Room(SUPERVIZ_KEY, {
      roomId: `${SUPERVIZ_ROOM_PREFIX}-presence-3d`,
      participant: {
        name: "Participant " + type,
        id: uuid,
      },
      group: {
        name: SUPERVIZ_ROOM_PREFIX,
        id: SUPERVIZ_ROOM_PREFIX,
      },
      environment: "dev",
      debug: true,
    });

    const videoConference = new VideoConference({
      participantType: type,
      enableFollow: true,
      enableGather: true,
      enableGoTo: true,
      collaborationMode: {
        enabled: true,
      },
      defaultAvatars: true,
    });

    room.current.addComponent(videoConference);

    videoConference.subscribe('meeting.state-update', (state: number) => {
      if (state !== 3) return;

      const matterport = new MatterportPresence3D(mpSdk.current!);
      room.current!.addComponent(matterport);
    });
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
      room?.current?.destroy();
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
