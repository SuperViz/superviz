import React, { 
  createContext, 
  useContext, 
  ReactNode, 
  useCallback, 
  useMemo, 
  useRef 
} from 'react';

interface RoomCallbacks {
  onMyParticipantJoined?: (participant: any) => void;
  onMyParticipantLeft?: (participant: any) => void;
  onMyParticipantUpdated?: (participant: any) => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onParticipantUpdated?: (participant: any) => void;
  onError?: (error: any) => void;
  onRoomUpdated?: (data: any) => void;
}

interface RoomContextInternalProps {
  joinRoom: (options: any) => Promise<void>;
  leaveRoom: () => void;
  addComponent: (component: any) => void;
  removeComponent: (component: any) => void;
  setCallbacks: (callbacks: RoomCallbacks) => void;
}

const RoomContext = createContext<RoomContextInternalProps | undefined>(undefined);

const RoomProvider: React.FC<{ 
  children: ReactNode 
  developerToken: string
}> = ({ children }) => {
  const callbacks = useRef<RoomCallbacks>({});

  const joinRoom = useCallback(async (options: any) => {
    console.log('Joining room with options', options, callbacks);
  }, [callbacks]);

  const leaveRoom = useCallback(() => {
    console.log('Leaving room');
  }, []);

  const addComponent = useCallback(() => {
    console.log('Adding component');
  }, []);

  const removeComponent = useCallback(() => {
    console.log('Removing component');
  }, []);

  const updateCallbacks = useCallback((newCallbacks: RoomCallbacks) => {
    callbacks.current = newCallbacks;
  }, []);

  const onMyParticipantJoined = useCallback((participant: any) => {
    console.log('My participant joined');

    if(callbacks.current.onMyParticipantJoined) {
      callbacks.current.onMyParticipantJoined(participant);
    }
  }, [callbacks.current]);

  const onMyParticipantLeft = useCallback((participant: any) => {
    console.log('My participant left');

    if(callbacks.current.onMyParticipantLeft) {
      callbacks.current.onMyParticipantLeft(participant);
    }
  }, [callbacks.current]);

  const onMyParticipantUpdated = useCallback((participant: any) => {
    console.log('My participant updated');

    if(callbacks.current.onMyParticipantUpdated) {
      callbacks.current.onMyParticipantUpdated(participant);
    }
  }, [callbacks.current]);
  const onParticipantJoined = useCallback((participant: any) => {
    console.log('Participant joined');

    if(callbacks.current.onParticipantJoined) {
      callbacks.current.onParticipantJoined(participant);
    }
  }, [callbacks.current]);

  const onParticipantLeft = useCallback((participant: any) => {
    console.log('Participant left');

    if(callbacks.current.onParticipantLeft) {
      callbacks.current.onParticipantLeft(participant);
    }
  }, [callbacks.current]);
  
  const onParticipantUpdated = useCallback((participant: any) => {
    console.log('Participant updated');

    if(callbacks.current.onParticipantUpdated) {
      callbacks.current.onParticipantUpdated(participant);
    }
  }, [callbacks.current]);
  
  const onError = useCallback((error: any) => {
    console.log('Error');

    if(callbacks.current.onError) {
      callbacks.current.onError(error);
    }
  }, [callbacks.current]);

  const onRoomUpdated = useCallback((data: any) => {
    console.log('Room updated');

    if(callbacks.current.onRoomUpdated) {
      callbacks.current.onRoomUpdated(data);
    }
  }, [callbacks.current]);

  return (
    <RoomContext.Provider 
      value={{ 
        joinRoom, 
        leaveRoom, 
        setCallbacks: updateCallbacks,
        addComponent,
        removeComponent
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

const useRoom = (callbacks: RoomCallbacks) => {
  const context = useContext(RoomContext)

  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }

  if(Object.keys(callbacks).length) {
    context.setCallbacks(callbacks);
  }

  return useMemo(() => {
    return { 
      joinRoom: context.joinRoom,
      leaveRoom: context.leaveRoom,
      addComponent: context.addComponent,
      removeComponent: context.removeComponent
    }
  }, [context]);
};

export { RoomProvider, useRoom };