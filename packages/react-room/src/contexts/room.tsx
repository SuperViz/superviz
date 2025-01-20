import { Participant, Room, RoomState, createRoom } from '@superviz/room'

import React, { 
  createContext, 
  useContext, 
  ReactNode, 
  useCallback, 
  useMemo, 
  useRef, 
  useState
} from 'react';

type InitializeRoomParams = {
  roomId: string;
  participant: {
    id: string;
    name?: string;
    email?: string;
    avatar?: {
      model3DUrl?: string;
      imageUrl?: string;
    };
  };
  group: {
    id: string;
    name: string;
  };
  debug?: boolean;
  environment?: 'dev' | 'prod';
}

type RoomError = { 
  code: string, 
  message: string 
}

type RoomUpdate = {
  status: RoomState | `${RoomState}`
}

interface RoomCallbacks {
  onMyParticipantJoined?: (participant: Participant) => void;
  onMyParticipantLeft?: (participant: Participant) => void;
  onMyParticipantUpdated?: (participant: Participant) => void;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (participant: Participant) => void;
  onParticipantUpdated?: (participant: Participant) => void;
  onError?: (error: RoomError) => void;
  onRoomUpdated?: (data: RoomUpdate) => void;
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
}> = ({ children, developerToken }) => {
  const callbacks = useRef<RoomCallbacks>({});
  const room = useRef<Room | null>(null);
  const initialized = useRef<boolean>(false);

  const joinRoom = useCallback(async (options: InitializeRoomParams) => {
    if(initialized.current) {
      console.warn('[SuperViz] Room already initialized, leaving room before joining again');
      return;
    }

    initialized.current = true;

    room.current = await createRoom(
      Object.assign({}, options, { developerToken })
    );

    room.current.subscribe('my-participant.joined', onMyParticipantJoined);
    room.current.subscribe('my-participant.left', onMyParticipantLeft);
    room.current.subscribe('my-participant.updated', onMyParticipantUpdated);
    room.current.subscribe('participant.joined', onParticipantJoined);
    room.current.subscribe('participant.left', onParticipantLeft);
    room.current.subscribe('participant.updated', onParticipantUpdated);
    room.current.subscribe('room.error', onError);
    room.current.subscribe('room.update', onRoomUpdated);
  }, [callbacks, initialized]);

  const leaveRoom = useCallback(() => {
    if(!initialized.current) {
      console.warn('[SuperViz] Room not initialized, nothing to leave');
      return;
    }

    room.current?.leave();
    room.current?.unsubscribe('my-participant.joined', onMyParticipantJoined);
    room.current?.unsubscribe('my-participant.left', onMyParticipantLeft);
    room.current?.unsubscribe('my-participant.updated', onMyParticipantUpdated);
    room.current?.unsubscribe('participant.joined', onParticipantJoined);
    room.current?.unsubscribe('participant.left', onParticipantLeft);
    room.current?.unsubscribe('participant.updated', onParticipantUpdated);
    room.current?.unsubscribe('room.error', onError);
    room.current?.unsubscribe('room.update', onRoomUpdated);

    initialized.current = false;
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

  const onMyParticipantJoined = useCallback((participant: Participant) => {
    console.log('My participant joined', participant);

    if(callbacks.current.onMyParticipantJoined) {
      callbacks.current.onMyParticipantJoined(participant);
    }
  }, [callbacks.current]);

  const onMyParticipantLeft = useCallback((participant: Participant) => {
    console.log('My participant left', participant);

    if(callbacks.current.onMyParticipantLeft) {
      callbacks.current.onMyParticipantLeft(participant);
    }
  }, [callbacks.current]);

  const onMyParticipantUpdated = useCallback((participant: Participant) => {
    console.log('My participant updated', participant);

    if(callbacks.current.onMyParticipantUpdated) {
      callbacks.current.onMyParticipantUpdated(participant);
    }
  }, [callbacks.current]);
  const onParticipantJoined = useCallback((participant: Participant) => {
    console.log('Participant joined', participant);

    if(callbacks.current.onParticipantJoined) {
      callbacks.current.onParticipantJoined(participant);
    }
  }, [callbacks.current]);

  const onParticipantLeft = useCallback((participant: Participant) => {
    console.log('Participant left', participant);

    if(callbacks.current.onParticipantLeft) {
      callbacks.current.onParticipantLeft(participant);
    }
  }, [callbacks.current]);
  
  const onParticipantUpdated = useCallback((participant: Participant) => {
    console.log('Participant updated', participant);

    if(callbacks.current.onParticipantUpdated) {
      callbacks.current.onParticipantUpdated(participant);
    }
  }, [callbacks.current]);
  
  const onError = useCallback((error: RoomError) => {
    console.log('Error', error);

    if(callbacks.current.onError) {
      callbacks.current.onError(error);
    }
  }, [callbacks.current]);

  const onRoomUpdated = useCallback((data: RoomUpdate) => {
    console.log('Room updated', data);

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