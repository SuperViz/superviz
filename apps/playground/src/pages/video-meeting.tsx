import {
  LauncherFacade,
  ParticipantType,
  Room,
  VideoMeeting,
} from "../lib/sdk";
import { v4 as generateId } from "uuid";

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";
import { useSearchParams } from "react-router-dom";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "video-conference";

export function VideoMeetingPage() {
  const room = useRef<LauncherFacade>();
  const loaded = useRef<boolean>(false);
  const video = useRef<VideoMeeting>();
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

    video.current = new VideoMeeting({
      participantType: 'guest', 
      permissions: { 
        allowGuests: true,
        toggleCamera: false, 
        toggleChat: false, 
        toggleMic: false, 
        toggleParticipantList: false,
        toggleRecording: false, 
        toggleScreenShare: false,
      }
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
    video.current = new VideoMeeting();

    room.current!.addComponent(video.current);
  };

  return <button onClick={initAgain}>Init again</button>;
}
