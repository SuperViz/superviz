import { createRoom, type Room, ParticipantEvent } from '@superviz/room'
import { v4 as generateId } from "uuid";

import { useCallback, useEffect, useRef, useState } from "react";
import { getConfig } from "../config";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "new-room";

export function SuperVizRoom() {
  const room = useRef<Room | null>(null);
  const loaded = useRef<boolean>(false);
  const [subscribed, setSubscribed] = useState<boolean>(false);

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
  }, [initializeSuperViz]);

  const subscribeToEvents = () => {
    if (!room.current) return;

    Object.values(ParticipantEvent).forEach(event => { 
      room.current?.subscribe(event, (data) => { 
        console.log('New event from room, eventName:', event, 'data:', data);
      })
    });

    setSubscribed(true);
  }

  const unsubscribeFromEvents = () => {
    if (!room.current) return;

    Object.values(ParticipantEvent).forEach(event => { 
      room.current?.unsubscribe(event);
    });

    setSubscribed(false);
  }

  const leaveRoom = () => {
    room.current?.leave();
  }

  return (
    <div className='w-full h-full flex items-center justify-center gap-2'>
      <button onClick={leaveRoom}> Leave </button>
      <button onClick={subscribeToEvents} disabled={subscribed}> Subscribe to Events </button>
      <button onClick={unsubscribeFromEvents} disabled={!subscribed}> Unsubscribe from Events </button>
    </div>
  )
}
