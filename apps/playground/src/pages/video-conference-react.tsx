
import { RoomProvider, useRoom, useVideo } from '@superviz/react'
import { VideoConference } from '@superviz/video';
import { getConfig } from '../config';

import { v4 as generateId } from "uuid";
import { useEffect, useRef } from 'react';
const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");
const componentName = "new-room-react";
const uuid = generateId();

export const Children = () => {
  const { room, joinRoom, leaveRoom, addComponent, removeComponent } = useRoom({});
  const video = useRef<VideoConference | null>(null);

  const { } = useVideo({
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

    video.current = new VideoConference({
      participantType: 'host'
    });

    addComponent(video.current);
  };

  const handleLeave = () => {
    removeComponent(video.current);
    leaveRoom();
  };

  useEffect(() => {
    handleJoin();

    return () => handleLeave();
  }, [])

  return (
    <div>
      <button disabled={!!room} onClick={handleJoin}>Join Room</button>
      <br />
      <button disabled={!room} onClick={handleLeave}>Leave Room</button>
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