import { v4 as generateId } from "uuid";
import { createRoom, Room } from '@superviz/room'
import { WhoIsOnline } from "@superviz/sdk";

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "wio-with-new-room";

export function WhoIsOnlineWithNewRoom() {
  const room = useRef<Room | null>(null);

  const initializeSuperViz = useCallback(async () => {
    console.log("Initializing SuperViz");
    const uuid = generateId();

    room.current = await createRoom({
      developerToken: SUPERVIZ_KEY,
      roomId: `${SUPERVIZ_ROOM_PREFIX}-${componentName}`,
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

    const wio = new WhoIsOnline();
    room.current.addComponent(wio);
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
