import { LauncherFacade, Room, MousePointers } from "../lib/sdk";
import { v4 as generateId } from "uuid";

import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "pointers-canvas";

export function PointersCanvas() {
  const room = useRef<LauncherFacade>();
  const loaded = useRef<boolean>(false);
  const pointers = useRef<MousePointers>();

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

    pointers.current = new MousePointers("canvas-id");

    room.current.addComponent(pointers.current);
  }, []);

  useEffect(() => {
    initializeSuperViz();

    return () => {
      room.current?.removeComponent(pointers.current);
      room.current?.destroy();
    };
  }, [initializeSuperViz]);

  return (
    <canvas
      id="canvas-id"
      style={{ width: "100%", height: "100%", backgroundColor: "orange" }}
    />
  );
}
