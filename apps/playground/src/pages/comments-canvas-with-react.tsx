import { Comments, CanvasPin } from '@superviz/collaboration';
import { RoomProvider, useRoom } from '@superviz/react';
import { useCallback, useEffect } from "react";
import { v4 as generateId } from 'uuid';
import { getConfig } from '../config';

// SuperViz developer token ::
const DEVELOPER_TOKEN = getConfig<string>("keys.superviz");
const ROOM_PREFIX = getConfig<string>("roomPrefix");

export const Children = () => {

  const { joinRoom, addComponent } = useRoom();

  // Use the joinRoom function from the hook in the callback
  const initializeSuperViz = useCallback(async () => {
    try {
      await joinRoom({
        participant: {
          id: generateId(),
          name: "Name " + Math.floor(Math.random() * 10),
        },
        group: {
          name: ROOM_PREFIX,
          id: ROOM_PREFIX,
        },
        roomId: `${ROOM_PREFIX}-comments-canvas`,
      });

      console.log("joining room", document.getElementById("canvas"));
      const pinAdapter = new CanvasPin("canvas");
      const comments = new Comments(pinAdapter);
      addComponent(comments);

    } catch (error) {
      console.error("Error initializing SuperViz Room:", error);
    }
  }, [joinRoom, addComponent]);

  useEffect(() => {
    initializeSuperViz();
  }, []);


  return (
    <div className="w-full h-full bg-gray-200">
      <canvas id="canvas" className="w-full h-full"></canvas>
    </div>
  );
};

export function CommentsCanvasWithReact() {
  return (
    <RoomProvider developerToken={DEVELOPER_TOKEN}>
      <Children />
    </RoomProvider>
  );
}