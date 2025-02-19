import { v4 as generateId } from "uuid";
import { createRoom, Room } from "@superviz/room";
import { WhoIsOnline, MousePointers } from "@superviz/collaboration";
import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "mouse-pointers-new-room";

export function MousePointersWithNewRoom() {
  const room = useRef<Room | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationId = useRef<number | null>(null);

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

    const mousePointers = new MousePointers('canvas-id');
    room.current.addComponent(mousePointers)
  }, []);

  useEffect(() => {
    initializeSuperViz();

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    const drawCheckeredBackground = () => {
      const size = 20;
      const { width, height } = canvas;
      context.clearRect(0, 0, width, height);

      for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
          context.fillStyle = (x / size + y / size) % 2 === 0 ? "#eee" : "#ccc";
          context.fillRect(x, y, size, size);
        }
      }
    };

    const animate = () => {
      drawCheckeredBackground();

      const time = Date.now() * 0.002;
      const x = (canvas.width / 2) + Math.cos(time) * 100;
      const y = (canvas.height / 2) + Math.sin(time) * 100;

      context.beginPath();
      context.arc(x, y, 10, 0, Math.PI * 2, false);
      context.fillStyle = "#ff0000";
      context.fill();
      context.closePath();

      animationId.current = requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    animationId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      animationId.current && cancelAnimationFrame(animationId.current);
    };
  }, [initializeSuperViz]);

  return (
    <canvas
      id="canvas-id"
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        border: "1px solid #000",
      }}
    ></canvas>
  );
}