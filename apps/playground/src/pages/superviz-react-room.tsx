
import { RoomProvider, useRoom } from '@superviz/react'
import { VideoConference } from '@superviz/sdk';
import { getConfig } from '../config';

import { v4 as generateId } from "uuid";
import { useEffect, useState } from 'react';
const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");
const componentName = "new-room-react";
const uuid = generateId();

export const Children = () => {
  const [joined, setJoined] = useState(false);
  const { room, joinRoom, leaveRoom, addComponent } = useRoom({
    onMyParticipantJoined: (participant) => {
      setJoined(true);
      console.log('Component: My participant joined', participant)
    },
    onMyParticipantLeft: (participant) => {
      setJoined(false);
      console.log('Component: My participant left', participant)
    },
    onMyParticipantUpdated: (participant) => {
      console.log('Component: My participant updated', participant)
    },
    onParticipantJoined: (participant) => {
      console.log('Component: Participant joined', participant)
    },
    onParticipantLeft: (participant) => {
      console.log('Component: Participant left', participant)
    },
    onParticipantUpdated: (participant) => {
      console.log('Component: Participant updated', participant)
    },
    onRoomUpdated: (data) => {
      console.log('Component: Room updated', data)
    },
    onError: (error) => {
      console.error('Component: Room error', error)
    },
  });

  console.log('joined', joined);

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

    const video = new VideoConference({
      collaborationMode: { enabled: false },
      participantType: 'host'
    });

    addComponent(video);
  };

  useEffect(() => {
    handleJoin();

    return () => leaveRoom();
  }, [])

  return (
    <div>
      <button disabled={!!room} onClick={handleJoin}>Join Room</button>
      <br />
      <button disabled={!room} onClick={leaveRoom}>Leave Room</button>
    </div>
  );
};

export function SupervizReactRoom() {
  return (
    <RoomProvider developerToken={SUPERVIZ_KEY}>
      <Children />
    </RoomProvider>
  )
}