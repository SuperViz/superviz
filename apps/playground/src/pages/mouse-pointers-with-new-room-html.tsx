import { v4 as generateId } from "uuid";
import { createRoom, Room } from "@superviz/room";
import { WhoIsOnline, MousePointers } from "@superviz/sdk";
import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "mouse-pointers-new-room";

export function MousePointersWithNewRoomHTML() {
  const room = useRef<Room | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationId = useRef<number | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  const initializeSuperViz = useCallback(async () => {
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

    const mousePointers = new MousePointers("div-id");
    room.current.addComponent(mousePointers);
  }, []);

  useEffect(() => {
    initializeSuperViz();

    const container = containerRef.current;
    const circle = circleRef.current;

    if (!container || !circle) return;

    const size = 20;

    // Create checkered background using CSS
    container.style.backgroundSize = `${size}px ${size}px`;
    container.style.backgroundImage = `
      linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
      linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)
    `;
    container.style.backgroundPosition = `0 0, ${size / 2}px ${size / 2}px`;

    const animate = () => {
      const time = Date.now() * 0.002;
      const x = container.clientWidth / 2 + Math.cos(time) * 100;
      const y = container.clientHeight / 2 + Math.sin(time) * 100;

      circle.style.transform = `translate(${x}px, ${y}px)`;

      animationId.current = requestAnimationFrame(animate);
    };

    animationId.current = requestAnimationFrame(animate);

    return () => {
      animationId.current && cancelAnimationFrame(animationId.current);
    };
  }, [initializeSuperViz]);

  return (
    <div
      id="div-id"
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        border: "1px solid #000",
      }}
    >
      <div
        ref={circleRef}
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          backgroundColor: "#ff0000",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      ></div>
    </div>
  );
}