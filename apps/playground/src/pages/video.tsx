import {
  LauncherFacade,
  ParticipantType,
  Room,
  VideoConference,
} from "../lib/sdk";
import { v4 as generateId } from "uuid";

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";
import { useSearchParams } from "react-router-dom";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "video-conference";

export function Video() {
  const room = useRef<LauncherFacade>();
  const loaded = useRef<boolean>(false);
  const video = useRef<VideoConference>();
  const [searchParams] = useSearchParams();

  const initializeSuperViz = useCallback(async () => {
    const uuid = generateId();
    const type =
      (searchParams.get("userType") as ParticipantType) || ParticipantType.HOST;

    room.current = await Room(SUPERVIZ_KEY, {
      roomId: `${SUPERVIZ_ROOM_PREFIX}-${componentName}`,
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

    video.current = new VideoConference({
      userType: type,
    });

    room.current.addComponent(video.current);
  }, []);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    initializeSuperViz();

    return () => {
      room.current?.removeComponent(video.current);
      room.current?.destroy();
    };
  }, []);

  const initAgain = () => {
    const type =
      (searchParams.get("userType") as ParticipantType) || ParticipantType.HOST;
    video.current = new VideoConference({
      userType: type,
    });

    room.current!.addComponent(video.current);
  };

  return <button onClick={initAgain}>Init again</button>;
}
