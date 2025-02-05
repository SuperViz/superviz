

import { v4 as generateId } from "uuid";
import { createRoom, Room } from '@superviz/room'
import { VideoHuddle } from "@superviz/video";

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "video-huddle-new-room";

export function NewVideoHuddle() {
  const room = useRef<Room | null>(null);

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
        toggleFollow: false, 
        toggleGoTo: false, 
        toggleGather: false, 
      }
    });
    room.current.addComponent(video);

    room.current.subscribe('participant.updated', (p) => { 
      console.log('participant.updated', p);
    })
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
