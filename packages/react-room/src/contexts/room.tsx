import { Participant, Room, RoomState, createRoom } from '@superviz/room'
import type { Component } from '@superviz/room/dist/common/types/component.types';

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
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
  getParticipants: () => Promise<Participant[]>;
  room: Room | null;
  components: Record<string, unknown>;
}

const RoomContext = createContext<RoomContextInternalProps | undefined>(undefined);

const RoomProvider: React.FC<{
  children: ReactNode
  developerToken: string
}> = ({ children, developerToken }) => {
  const [components, setComponents] = useState<Record<string, unknown>>({});
  const roomInstance = useRef<Room | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const initialized = useRef<boolean>(false);

  const joinRoom = useCallback(async (options: InitializeRoomParams) => {
    if (initialized.current) {
      console.warn('[SuperViz] Room already initialized, leaving room before joining again');
      return;
    }

    initialized.current = true;

    roomInstance.current = await createRoom(
      Object.assign({}, options, { developerToken })
    );

    setRoom(roomInstance.current);
  }, [developerToken, setRoom, initialized.current, roomInstance.current]);

  const leaveRoom = useCallback(() => {
    if (!initialized.current) {
      console.warn('[SuperViz] Room not initialized, nothing to leave');
      return;
    }

    roomInstance.current?.leave();
  }, [initialized]);

  const addComponent = useCallback((component: unknown) => {
    if (!initialized.current) {
      console.warn('[SuperViz] Room not initialized, cannot add component');
      return;
    }

    if (components[(component as Component)?.name]) {
      console.warn('[SuperViz] Component already initialized, cannot add again');
      return;
    }

    roomInstance.current?.addComponent(component);

    console.log(roomInstance.current);
    setComponents(prev => ({ ...prev, [(component as Component)?.name]: component }));
  }, [room, initialized.current]);

  const removeComponent = useCallback((component: unknown) => {
    if (!initialized.current) {
      console.warn('[SuperViz] Room not initialized, cannot remove component');
      return;
    }

    if (!components[(component as Component)?.name]) {
      console.warn('[SuperViz] Component not initialized yet, cannot remove');
      return;
    }

    setComponents(prev => {
      delete prev[(component as Component)?.name];
      return prev;
    });

    roomInstance.current?.removeComponent(component);
  }, []);



  const getParticipants = useCallback(async () => {
    if (!roomInstance.current) {
      console.warn('[SuperViz] Room not initialized, cannot get participants');
      return [];
    }

    return roomInstance.current?.getParticipants();
  }, [roomInstance.current]);

  return (
    <RoomContext.Provider
      value={{
        joinRoom,
        leaveRoom,
        addComponent,
        removeComponent,
        room: room,
        components,
        getParticipants
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

const useInternalFeatures = () => {
  const context = useContext(RoomContext)

  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }

  return context
}

const useRoom = (callbacks?: RoomCallbacks) => {
  const context = useContext(RoomContext)

  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }

  const onMyParticipantJoined = (participant: Participant) => {
    callbacks?.onMyParticipantJoined?.(participant);
  }

  const onMyParticipantLeft = (participant: Participant) => {
    callbacks?.onMyParticipantLeft?.(participant);
  }

  const onMyParticipantUpdated = (participant: Participant) => {
    callbacks?.onMyParticipantUpdated?.(participant);
  }

  const onParticipantJoined = (participant: Participant) => {
    callbacks?.onParticipantJoined?.(participant);
  }

  const onParticipantLeft = (participant: Participant) => {
    callbacks?.onParticipantLeft?.(participant);
  }

  const onParticipantUpdated = (participant: Participant) => {
    callbacks?.onParticipantUpdated?.(participant);
  }

  const onRoomUpdated = (data: RoomUpdate) => {
    callbacks?.onRoomUpdated?.(data);
  }

  const onError = (error: RoomError) => {
    callbacks?.onError?.(error);
  }

  useEffect(() => {
    if (context.room) {
      context.room?.subscribe('my-participant.joined', onMyParticipantJoined);
      context.room?.subscribe('my-participant.left', onMyParticipantLeft);
      context.room?.subscribe('my-participant.updated', onMyParticipantUpdated);
      context.room?.subscribe('participant.joined', onParticipantJoined);
      context.room?.subscribe('participant.left', onParticipantLeft);
      context.room?.subscribe('participant.updated', onParticipantUpdated);
      context.room?.subscribe('room.error', onError);
      context.room?.subscribe('room.update', onRoomUpdated);
    }

    return () => {
      context.room?.unsubscribe('my-participant.joined', onMyParticipantJoined);
      context.room?.unsubscribe('my-participant.left', onMyParticipantLeft);
      context.room?.unsubscribe('my-participant.updated', onMyParticipantUpdated);
      context.room?.unsubscribe('participant.joined', onParticipantJoined);
      context.room?.unsubscribe('participant.left', onParticipantLeft);
      context.room?.unsubscribe('participant.updated', onParticipantUpdated);
      context.room?.unsubscribe('room.error', onError);
      context.room?.unsubscribe('room.update', onRoomUpdated);
    }
  }, [context.room])



  return {
    joinRoom: context.joinRoom,
    leaveRoom: context.leaveRoom,
    addComponent: context.addComponent,
    removeComponent: context.removeComponent,
    room: context.room
  }
};

export { RoomProvider, useRoom, useInternalFeatures };