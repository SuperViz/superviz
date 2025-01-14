import { createRoom, type Room, ParticipantEvent, RoomEvent, Participant } from '@superviz/room'
import { v4 as generateId } from "uuid";

import { useCallback, useRef, useState } from "react";
import { getConfig } from "../config";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

const componentName = "new-room";

export function SuperVizRoom() {
  const room = useRef<Room | null>(null);
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomState, setRoomState] = useState<string>("Not connected");
  const [observerState, setObserverState] = useState<string>("Not subscribed");
  const [events, setEvents] = useState<any[]>([]);

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
    setRoomState("Connected");
    subscribeToEvents();
  }, []);

  const subscribeToEvents = () => {
    if (!room.current) return;

    Object.values(ParticipantEvent).forEach(event => { 
      room.current?.subscribe(event, (data) => { 
        console.log('New event from room, eventName:', event, 'data:', data);
        setEvents(prevEvents => [...prevEvents, { eventName: event, data }]);
      })
    });

    Object.values(RoomEvent).forEach(event => { 
      room.current?.subscribe(event, (data) => { 
        console.log('New event from room, eventName:', event, 'data:', data);
        setEvents(prevEvents => [...prevEvents, { eventName: event, data }]);
      })
    });

    setSubscribed(true);
    setObserverState("Subscribed to events");
  }

  const unsubscribeFromEvents = () => {
    if (!room.current) return;

    Object.values(ParticipantEvent).forEach(event => { 
      room.current?.unsubscribe(event);
    });

    Object.values(RoomEvent).forEach(event => { 
      room.current?.unsubscribe(event)
    });

    setSubscribed(false);
    setObserverState("Unsubscribed from events");
  }

  const leaveRoom = () => {
    room.current?.leave();
    setRoomState("Left the room");
    setObserverState("Not subscribed");
  }

  const getParticipants = () => {
    room.current?.getParticipants().then((participants) => {
      setParticipants(participants);
      console.log('Participants:', participants);
    });
  }  

  return (
    <div className='w-full h-full flex justify-between gap-2 p-10 overflow-hidden'>
      <div className='flex gap-2 flex-col'>
        <div>
          <h2>Room State: {roomState}</h2>
          <h2>Observer State: {observerState}</h2>
        </div>
        <button 
          className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700' 
          onClick={initializeSuperViz}
        >
          Initialize Room
        </button>
        <button 
          onClick={leaveRoom} 
          className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700'
        > 
          Leave Room
        </button>
        <button 
          onClick={subscribeToEvents} 
          disabled={subscribed} 
          className={`px-4 py-2 rounded ${subscribed ? 'bg-gray-500' : 'bg-green-500'} text-white hover:bg-green-700`}
        > 
          Subscribe to Events 
        </button>
        <button 
          onClick={unsubscribeFromEvents} 
          disabled={!subscribed} 
          className={`px-4 py-2 rounded ${!subscribed ? 'bg-gray-500' : 'bg-yellow-500'} text-white hover:bg-yellow-700`}
        > 
          Unsubscribe from Events 
        </button>
        <button 
          onClick={getParticipants} 
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700'
        > 
          Get Participants 
        </button>
      </div>
      <div className='p-4 border rounded shadow-md h-full overflow-auto flex-1'>
        <h3>Participants:</h3>
        <pre>{JSON.stringify(participants, null, 2)}</pre>
        <h3>Events:</h3>
        <pre>{JSON.stringify(events, null, 2)}</pre>
      </div>
    </div>
  )
}
