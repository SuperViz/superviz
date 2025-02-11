
import { RoomProvider, useRoom, useVideo } from '@superviz/react'
import { VideoConference } from '@superviz/video';
import { getConfig } from '../config';

import { v4 as generateId } from "uuid";
import { useEffect } from 'react';
const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");
const componentName = "new-room-react";
const uuid = generateId();

export const Children = () => {
  const { room, joinRoom, leaveRoom, addComponent } = useRoom({
    // onMyParticipantJoined: (participant) => console.log('Component: My participant joined', participant),
    // onMyParticipantLeft: (participant) => console.log('Component: My participant left', participant),
    // onMyParticipantUpdated: (participant) => console.log('Component: My participant updated', participant),
    // onParticipantJoined: (participant) => console.log('Component: Participant joined', participant),
    // onParticipantLeft: (participant) => console.log('Component: Participant left', participant),
    // onParticipantUpdated: (participant) => console.log('Component: Participant updated', participant),
    // onRoomUpdated: (data) => console.log('Component: Room updated', data),
    // onError: (error) => console.error('Component: Room error', error),
  });

  const {} = useVideo({
    onHostChanged: (host) => console.log('Component: Host changed', host),
    onParticipantJoined: (participant) => console.log('Component: Participant joined', participant),
    onParticipantLeft: (participant) => console.log('Component: Participant left', participant),
    onParticipantListUpdate: (participants) => console.log('Component: Participant list updated', participants),
    onMeetingStateUpdate: (state) => console.log('Component: Meeting state updated', state),
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

    const video = new VideoConference({ 
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

export function VideoConferenceReact() {
  return (
    <RoomProvider developerToken={SUPERVIZ_KEY}>
      <Children />
    </RoomProvider>
  )
}