

import { v4 as generateId } from "uuid";
import { createRoom, Room } from '@superviz/room'
import { VideoConference } from "@superviz/video";

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";
import { useSearchParams } from "react-router-dom";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "video-with-new-room";

export function NewVideoConference() {
  const room = useRef<Room | null>(null);
  const [searchParams] = useSearchParams();
  const type =
    (searchParams.get("userType") as 'host') || 'host'


  const initializeSuperViz = useCallback(async () => {
    const uuid = generateId();

    room.current = await createRoom({
      developerToken: SUPERVIZ_KEY,
      roomId: `${SUPERVIZ_ROOM_PREFIX}-${componentName}`,
      participant: {
        name: " ",
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

    const video = new VideoConference({
      brand: {
        logoUrl: 'https://docs.superviz.com/logo-white.svg',
      },
      permissions: {
        toggleRecording: false,
        toggleCamera: true,
        toggleMic: true,
        toggleScreenShare: true,
        toggleChat: true,
        toggleParticipantList: true,
        allowGuests: false,
      },
      participantType: type
    });

    video.subscribe('host.changed', (host) => {
      console.log('host.changed', host);
    })

    video.subscribe('my.participant.joined', (participant) => {
      console.log('participant.joined', participant);
    })

    video.subscribe('my.participant.left', (participant) => {
      console.log('participant.left', participant);
    })

    video.subscribe('participant.list.update', (participants) => {
      console.log('participant.list.update', participants);
    })

    video.subscribe('my.participant.kicked', (participant) => {
      console.log('my.participant.kicked', participant);
    })

    video.subscribe('meeting.state.update', (state) => {
      console.log('meeting.state.update', state);
    })

    room.current.addComponent(video);
  }, []);


  useEffect(() => {
    initializeSuperViz();

    return () => {
      room.current?.leave();
    };
  }, []);

  return (
    <div>
    </div>
  );
}
