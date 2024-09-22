import './style.css';

import { useCallback, useState } from 'react';

import { VideoConference } from './components/video';
import { SuperVizRoomProvider } from './contexts/room';

function Room() {
  const [show, setShow] = useState(true);
  const toggleShow = () => {
    setShow(!show);
  };

  const [destroy, setDestroy] = useState(1);

  const destroyCallback = useCallback(() => {
    if (destroy === 1) {
      console.error('state 1');
    } else {
      console.error('state 2');
    }
  }, [destroy]);

  const toggleDestroy = useCallback(() => {
    setDestroy(destroy === 1 ? 2 : 1);
  }, [destroy, setDestroy]);

  return (
    <>
      <button onClick={toggleShow}>Stop Room</button>
      <button
        onClick={toggleDestroy}
        style={{ zIndex: 999999, position: 'fixed', top: '50px', left: '500px' }}
      >
        Toggle Destroy
      </button>
      {show && (
        <VideoConference participantType="host" defaultAvatars onDestroy={destroyCallback} />
      )}
    </>
  );
}

export default function App() {
  const url = new URL(window.location.href);

  const key = import.meta.env.VITE_SUPERVIZ_DEVELOPER_TOKEN;
  const roomId = url.searchParams.get('roomId') || 'default-room-id';
  const random = Math.floor(Math.random() * 1000);

  return (
    <>
      <SuperVizRoomProvider
        developerKey={key}
        debug={true}
        group={{
          id: 'react-sdk-group',
          name: 'react sdk',
        }}
        participant={{
          id: random.toString(),
          name: random.toString(),
        }}
        environment="dev"
        roomId={roomId}
      >
        <Room />
      </SuperVizRoomProvider>
    </>
  );
}
