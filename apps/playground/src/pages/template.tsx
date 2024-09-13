import { LauncherFacade, Room } from "../lib/sdk";
import { v4 as generateId } from "uuid";

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "";

export function ComponentName() {
  const room = useRef<LauncherFacade>();
  const loaded = useRef<boolean>(false);

  const initializeSuperViz = useCallback(async () => {
    if (loaded.current) return;
    loaded.current = true;

    const uuid = generateId();

    room.current = await Room(SUPERVIZ_KEY, {
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

    // room.current.addComponent(componentHere);
  }, []);

  useEffect(() => {
    initializeSuperViz();

    return () => {
      // room.current?.removeComponent(componentHere);
      room.current?.destroy();
    };
  }, []);

  return <>content</>;
}
