
import { RoomProvider, useRoom } from '@superviz/react'
import { getConfig } from '../config';

import { v4 as generateId } from "uuid";
const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");
const componentName = "new-room-react";
const uuid = generateId();

export const Children = () => {
  const { joinRoom, leaveRoom } = useRoom({
    onMyParticipantJoined: (participant) => console.log('Component: My participant joined', participant),
    onMyParticipantLeft: (participant) => console.log('Component: My participant left', participant),
    onMyParticipantUpdated: (participant) => console.log('Component: My participant updated', participant),
    onParticipantJoined: (participant) => console.log('Component: Participant joined', participant),
    onParticipantLeft: (participant) => console.log('Component: Participant left', participant),
    onParticipantUpdated: (participant) => console.log('Component: Participant updated', participant),
    onRoomUpdated: (data) => console.log('Component: Room updated', data),
    onError: (error) => console.error('Component: Room error', error),
  });

  const handleJoin = async () => {
    await joinRoom({
      participant: {
        id: uuid,
        name: "Participant Name",
        email: 'carlos@superviz.com',
        avatar: { 
          model3DUrl: 'https://production.storage.superviz.com/readyplayerme/1.glb',
          imageUrl: 'https://production.cdn.superviz.com/static/default-avatars/1.png',
        }
      },
      group: {
        name: SUPERVIZ_ROOM_PREFIX,
        id: SUPERVIZ_ROOM_PREFIX,
      },
      roomId: `${SUPERVIZ_ROOM_PREFIX}-${componentName}`,
      debug: true, 
      environment: 'dev',
    });
  };

  return (
    <div>
      <button onClick={handleJoin}>Join Room</button>
      <button onClick={leaveRoom}>Leave Room</button>
    </div>
  );

  return <></>
};

export function SupervizReactRoom() {
  return (
    <RoomProvider developerToken={SUPERVIZ_KEY}>
      <Children />
    </RoomProvider>
  )
}