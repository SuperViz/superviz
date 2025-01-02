import { createRoom } from '@superviz/room'
import { v4 as generateId } from "uuid";

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "new-room";

export function SuperVizRoom() {
  const room = useRef<any>();
  const loaded = useRef<boolean>(false);

  const initializeSuperViz = useCallback(async () => {
    const uuid = generateId();

    const newRoom = await createRoom({
      developerToken: SUPERVIZ_KEY,
      participant: {
        name: "Participant Name",
        id: uuid,
      },
      group: {
        name: SUPERVIZ_ROOM_PREFIX,
        id: SUPERVIZ_ROOM_PREFIX,
      },
      roomId: `${SUPERVIZ_ROOM_PREFIX}-${componentName}`,
      debug: true, 
      environment: 'dev',
    });

    room.current = newRoom;
  }, []);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;


    initializeSuperViz();
  }, []);

  return <></>
}
