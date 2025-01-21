import { Participant, Room, RoomState, createRoom } from '@superviz/room'
import type { Component } from '@superviz/room/dist/common/types/component.types';

import React, { 
  createContext, 
  useContext, 
  ReactNode, 
  useCallback, 
  useMemo, 
  useRef,
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

type Callback = (participant: Participant | RoomError | RoomUpdate) => void;

interface RoomContextInternalProps {
  joinRoom: (options: InitializeRoomParams) => Promise<void>;
  leaveRoom: () => void;
  addComponent: (component: unknown) => void;
  removeComponent: (component: unknown) => void;
  setCallbacks: (callbacks: RoomCallbacks) => void;
  room: Room | null;
}

const RoomContext = createContext<RoomContextInternalProps | undefined>(undefined);

const RoomProvider: React.FC<{ 
  children: ReactNode 
  developerToken: string
}> = ({ children, developerToken }) => {
  const components = useRef<Map<string, unknown>>(new Map());
  const callbacks = useRef<Record<keyof RoomCallbacks, Callback[]>>({
    onMyParticipantJoined: [],
    onMyParticipantLeft: [],
    onMyParticipantUpdated: [],
    onParticipantJoined: [],
    onParticipantLeft: [],
    onParticipantUpdated: [],
    onError: [],
    onRoomUpdated: [],
  });
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
    callbacks.current = {
      onMyParticipantJoined: [],
      onMyParticipantLeft: [],
      onMyParticipantUpdated: [],
      onParticipantJoined: [],
      onParticipantLeft: [],
      onParticipantUpdated: [],
      onError: [],
      onRoomUpdated: [],
    }

    initialized.current = false;
  }, []);

  const addComponent = useCallback((component: unknown) => {
    if(!initialized.current) {
      console.warn('[SuperViz] Room not initialized, cannot add component');
      return;
    }

    if(components.current.has((component as Component).name)) {
      console.warn('[SuperViz] Component already initialized, cannot add again');
      return;
    }

    components.current.set((component as Component).name, component);

    room.current?.addComponent(component);
  }, []);

  const removeComponent = useCallback((component: unknown) => {
    if(!initialized.current) {
      console.warn('[SuperViz] Room not initialized, cannot remove component');
      return;
    }

    if(!components.current.has((component as Component).name)) {
      console.warn('[SuperViz] Component not initialized yet, cannot remove');
      return;
    }

    components.current.delete((component as Component).name);

    room.current?.removeComponent(component);
  }, []);

  const updateCallbacks = (newCallbacks: RoomCallbacks) => {
    Object.keys(newCallbacks).forEach((key) => {
      const callbackKey = key as keyof RoomCallbacks;
  
      if (callbacks.current[callbackKey]) {
        const existingCallbacks = callbacks.current[callbackKey];
  
        const callbackMap: Map<string, Callback> = new Map(
          existingCallbacks.map((cb) => [cb.toString(), cb])
        );
  
        const newCallback = newCallbacks[callbackKey] as Callback;
  
        if (newCallback && !callbackMap.has(newCallback.toString())) {
          callbackMap.set(newCallback.toString(), newCallback);
          callbacks.current[callbackKey] = Array.from(callbackMap.values());
        }
      }
    });
  
  };

  const onMyParticipantJoined = useCallback((participant: Participant) => {
    if(callbacks.current.onMyParticipantJoined) {
      callbacks.current.onMyParticipantJoined.forEach(cb => cb(participant));
    }
  }, [callbacks.current]);

  const onMyParticipantLeft = useCallback((participant: Participant) => {
    if(callbacks.current.onMyParticipantLeft) {
      callbacks.current.onMyParticipantLeft.forEach(cb => cb(participant));
    }
  }, [callbacks.current]);

  const onMyParticipantUpdated = useCallback((participant: Participant) => {
    if(callbacks.current.onMyParticipantUpdated) {
      callbacks.current.onMyParticipantUpdated.forEach(cb => cb(participant));
    }
  }, [callbacks.current]);

  const onParticipantJoined = useCallback((participant: Participant) => {
    if(callbacks.current.onParticipantJoined) {
      callbacks.current.onParticipantJoined.forEach(cb => cb(participant));
    }
  }, [callbacks.current]);

  const onParticipantLeft = useCallback((participant: Participant) => {
    if(callbacks.current.onParticipantLeft) {
      callbacks.current.onParticipantLeft.forEach(cb => cb(participant));
    }
  }, [callbacks.current]);
  
  const onParticipantUpdated = useCallback((participant: Participant) => {
    if(callbacks.current.onParticipantUpdated) {
      callbacks.current.onParticipantUpdated.forEach(cb => cb(participant));
    }
  }, [callbacks.current]);
  
  const onError = useCallback((error: RoomError) => {
    if(callbacks.current.onError) {
      callbacks.current.onError.forEach(cb => cb(error));
    }
  }, [callbacks.current]);

  const onRoomUpdated = useCallback((data: RoomUpdate) => {
    if(callbacks.current.onRoomUpdated) {
      callbacks.current.onRoomUpdated.forEach(cb => cb(data));
    }
  }, [callbacks.current]);

  return (
    <RoomContext.Provider 
      value={{ 
        joinRoom, 
        leaveRoom, 
        setCallbacks: updateCallbacks,
        addComponent,
        removeComponent, 
        room: room.current
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

  useMemo(() => { 
    if(Object.keys(callbacks).length) {
      context.setCallbacks(callbacks);
    }
  }, [callbacks])

  return { 
    joinRoom: context.joinRoom,
    leaveRoom: context.leaveRoom,
    addComponent: context.addComponent,
    removeComponent: context.removeComponent,
    room: context.room
  }
};

export { RoomProvider, useRoom };