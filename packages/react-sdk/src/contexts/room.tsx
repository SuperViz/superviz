import { isEqual } from 'lodash';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import SupervizRoom, {
  type BaseComponent,
  type LauncherFacade,
  type Participant,
  ParticipantEvent,
  type SuperVizSdkOptions,
} from '../lib/sdk';
import {
  ComponentNames,
  InternalFeaturesContextData,
  RoomContextData,
  RoomProviderCallbacks,
  RoomProviderProps,
  SuperVizComponent,
} from './room.types';

const generateCallbackList = (callbacks: RoomProviderCallbacks) => {
  return {
    [ParticipantEvent.JOINED]: callbacks.onParticipantJoined,
    [ParticipantEvent.LEFT]: callbacks.onParticipantLeft,
    [ParticipantEvent.LIST_UPDATED]: callbacks.onParticipantListUpdated,
    [ParticipantEvent.LOCAL_JOINED]: callbacks.onParticipantLocalJoined,
    [ParticipantEvent.LOCAL_LEFT]: callbacks.onParticipantLocalLeft,
    [ParticipantEvent.LOCAL_UPDATED]: callbacks.onParticipantLocalUpdated,
  };
};

export const SuperVizRoomContext = createContext({
  hasProvider: false,
  room: null,
} as RoomContextData);

/**
 * it's exported to be used by the internal components,
 * `never` be exported to the end-users, this is a private hook
 */
export function useInternalFeatures<T>(
  componentName?: ComponentNames,
): InternalFeaturesContextData<T> {
  const { hasProvider, ...context } = useContext(SuperVizRoomContext);

  useEffect(() => {
    if (!hasProvider) {
      console.error('[SuperViz] You need to wrap your component with SuperVizRoomProvider');
    }
  }, [hasProvider]);

  if (componentName) {
    return {
      ...context,
      component: context.activeComponents[componentName],
    } as InternalFeaturesContextData<T>;
  }

  return context as InternalFeaturesContextData<T>;
}

export function SuperVizRoomProvider(params: RoomProviderProps) {
  const {
    roomId,
    group,
    debug,
    children,
    environment,
    participant,
    developerKey,
    customColors,
    onParticipantJoined,
    onParticipantLeft,
    onParticipantListUpdated,
    onParticipantLocalJoined,
    onParticipantLocalLeft,
    onParticipantLocalUpdated,
    stopAutoStart,
  } = params;

  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [room, setRoom] = useState<LauncherFacade | null>(null);
  const [callbacks, setCallbacks] = useState<ReturnType<typeof generateCallbackList> | null>(null);
  const [activeComponents, setActiveComponents] = useState<
    Record<ComponentNames, SuperVizComponent>
  >({} as Record<ComponentNames, SuperVizComponent>);

  const fetchingRoom = useRef(false);

  // This effect will start the room when the component is mounted
  // and stop the room when the component is unmounted
  useEffect(() => {
    if (!startRoom || hasJoinedRoom || stopAutoStart) return;

    if (!fetchingRoom.current) startRoom();

    return () => {
      if (!stopRoom || !hasJoinedRoom) return;

      stopRoom();
    };
  }, []);

  useEffect(() => {
    const updatedCallbacks = generateCallbackList(params);

    if (!room || isEqual(callbacks, updatedCallbacks)) return;

    updateCallbacks(room, params);
  }, [
    onParticipantJoined,
    onParticipantLeft,
    onParticipantListUpdated,
    onParticipantLocalJoined,
    onParticipantLocalLeft,
    onParticipantLocalUpdated,
    room,
  ]);

  useEffect(() => {
    if (!hasJoinedRoom) return;

    room?.unsubscribe(ParticipantEvent.LOCAL_UPDATED);
    room?.subscribe(ParticipantEvent.LOCAL_UPDATED, onMyParticipantUpdated);
  }, [room, activeComponents]);

  function updateCallbacks(room: LauncherFacade, callbacks: RoomProviderCallbacks) {
    const updatedList = generateCallbackList(callbacks);

    Object.entries(updatedList).forEach(([event, callback]) => {
      const currentCallback = callbacks[event as keyof RoomProviderCallbacks];

      if ((!callback && currentCallback) || callback !== currentCallback) {
        room.unsubscribe(event);
      }

      if (callback) {
        room.subscribe(event, callback);
      }
    });

    setCallbacks(updatedList);
  }

  async function startRoom(): Promise<void> {
    if (hasJoinedRoom || room) {
      console.log('[SuperViz] Room already started');
      return;
    }

    try {
      fetchingRoom.current = true;
      const room = await SupervizRoom(developerKey, {
        participant: participant as SuperVizSdkOptions['participant'],
        roomId,
        group,
        environment,
        debug,
        customColors,
      });

      updateCallbacks(room, params);
      setRoom(room);
      setHasJoinedRoom(true);

      room.subscribe(ParticipantEvent.LOCAL_UPDATED, onMyParticipantUpdated);
      room.subscribe(ParticipantEvent.LOCAL_JOINED, onMyParticipantJoined);
      room.subscribe(ParticipantEvent.LOCAL_LEFT, onMyParticipantLeft);
    } catch (error) {
      fetchingRoom.current = false;
      console.error('[SuperViz] Error starting room', error);
    }

    fetchingRoom.current = false;
  }

  function stopRoom(): void {
    if (!room) {
      console.error(
        '[SuperViz] Room not started yet, you need to start the room before stopping it',
      );
      return;
    }

    room.destroy();
    setActiveComponents({} as Record<ComponentNames, SuperVizComponent>);
    setRoom(null);
    setHasJoinedRoom(false);
  }

  function addComponent(component: SuperVizComponent) {
    if (!room) return;

    if (!activeComponents[component.name]) {
      room?.addComponent(component as BaseComponent);
    }

    setActiveComponents((prev) => ({ ...prev, [component.name]: component }));
  }

  function removeComponent(component: SuperVizComponent) {
    if (!room) return;

    if (activeComponents[component.name]) {
      room?.removeComponent(component as BaseComponent);
    }

    setActiveComponents((prev) => {
      const updated = { ...prev };
      delete updated[component.name];
      return updated;
    });
  }

  function onMyParticipantUpdated(participant: Participant) {
    onParticipantLocalUpdated && onParticipantLocalUpdated(participant);

    if (!participant?.activeComponents || !participant?.activeComponents.length) return;

    const deleteList: string[] = [];

    Object.keys(activeComponents).forEach((componentName) => {
      if (!participant.activeComponents?.includes(componentName as any)) {
        deleteList.push(componentName);
      }
    });

    setActiveComponents((prev) => {
      const updated = { ...prev };
      deleteList.forEach((componentName) => {
        delete updated[componentName as ComponentNames];
      });
      return updated;
    });
  }

  function onMyParticipantJoined() {
    setHasJoinedRoom(true);
  }

  function onMyParticipantLeft() {
    setHasJoinedRoom(false);
  }

  const value = useMemo<RoomContextData>(() => {
    return {
      hasProvider: true,
      hasJoinedRoom,
      room,
      addComponent,
      removeComponent,
      activeComponents,
      startRoom,
      stopRoom,
    };
  }, [room, developerKey, participant, roomId, group, activeComponents, hasJoinedRoom]);

  return <SuperVizRoomContext.Provider value={value}>{children}</SuperVizRoomContext.Provider>;
}
