import { PresenceCallback, PresenceEvent } from '@superviz/socket-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { Channel, PresenceEvents, RealtimeComponent, RealtimeComponentState } from '../lib/sdk';

type Events = PresenceEvents | `${PresenceEvents}`;

type UseRealtimeParticipantData = {
  /**
   * @property isReady
   * @description is the channel ready
   * @returns {boolean}
   */
  isReady: boolean;
  /**
   * @function subscribe
   * @description subscribe to a presence event
   * @returns {void}
   */
  subscribe: <T = any>(event: Events, callback: PresenceCallback<T>) => void;
  /**
   * @function unsubscribe
   * @description unsubscribe from a presence event
   * @returns {void}
   */
  unsubscribe: (event: Events) => void;
  /**
   * @function update
   * @description update a realtime presence event
   * @returns {void}
   */
  update: <T = any>(data: T) => void;
  /**
   * @function string
   * @description get realtime client data history
   * @returns {RealtimeMessage | Record<string, RealtimeMessage>}
   */
  getAll: () => Promise<PresenceEvent[]>;
};

export function useRealtimeParticipant(channelName: string): UseRealtimeParticipantData {
  const [started, setStarted] = useState(false);
  const [channelReady, setChannelReady] = useState(false);
  const { component, room, ...context } = useInternalFeatures<RealtimeComponent>('realtime');
  const eventsToSubscribe = useRef<Record<Events, PresenceCallback<any>[]>>({
    [PresenceEvents.JOINED_ROOM]: [],
    [PresenceEvents.LEAVE]: [],
    [PresenceEvents.UPDATE]: [],
  });

  const channel = useRef<Channel | null>(null);

  useEffect(() => {
    if (!component) return;

    if (component['state'] === RealtimeComponentState.STARTED) {
      setStarted(true);
      return;
    }

    component.subscribe('realtime-component.state-changed', (state) => {
      setStarted(state === RealtimeComponentState.STARTED);
    });
  }, [component, eventsToSubscribe.current]);

  useEffect(() => {
    if ((!started && !channel.current) || !component) return;
    const connectChannel = async () => {
      channel.current = await component!.connect(channelName);

      if (channel.current['state'] === 'CONNECTED') {
        setChannelReady(true);
        return;
      }

      channel.current.subscribe('realtime-channel.state-changed', (state) => {
        setChannelReady(state === 'CONNECTED');
      });
    };

    connectChannel();
  }, [started]);

  useEffect(() => {
    if (channel.current && !room) {
      channel.current.disconnect();
      channel.current = null;
      setChannelReady(false);
      setStarted(false);
    }
  }, [component, room]);

  useEffect(() => {
    if (!channelReady) return;

    if (Object.keys(eventsToSubscribe.current).length) {
      Object.entries(eventsToSubscribe.current).forEach(([event, callbacks]) => {
        callbacks.forEach((callback) => {
          channel.current!.participant.subscribe(event as PresenceEvents, callback);
        });
      });

      eventsToSubscribe.current = {
        [PresenceEvents.JOINED_ROOM]: [],
        [PresenceEvents.LEAVE]: [],
        [PresenceEvents.UPDATE]: [],
      };
    }
  }, [channelReady]);

  const subscribe = useCallback<UseRealtimeParticipantData['subscribe']>(
    (event, callback) => {
      if (!channel.current) {
        const previous = eventsToSubscribe.current[event] || [];

        eventsToSubscribe.current[event] = previous.includes(callback)
          ? previous
          : [...previous, callback];

        return;
      }

      channel.current.participant.subscribe(event, callback);
    },
    [component, context, eventsToSubscribe.current],
  );

  const update = useCallback<UseRealtimeParticipantData['update']>(
    <T = any>(data: T) => {
      if (!started || !channelReady) return;

      channel.current!.participant.update<T>(data);
    },
    [component, context, started],
  );

  const unsubscribe = useCallback<UseRealtimeParticipantData['unsubscribe']>(
    (event) => {
      if (!started || !channelReady) return;

      channel.current!.participant.unsubscribe(event);
    },
    [component, context, started],
  );

  const getAll = useCallback(async (): Promise<PresenceEvent[]> => {
    if (!started) {
      console.warn('[SuperViz] Realtime component is not ready - try again later');
      return Promise.resolve([]);
    }

    if (!channelReady) {
      console.warn(`[SuperViz] Channel ${channelName} is not ready - try again later`);
      return Promise.resolve([]);
    }

    const response = await channel.current!.participant.getAll();

    return response;
  }, [component, context, started]);

  return useMemo(() => {
    return {
      isReady: channelReady && started,
      update,
      subscribe,
      unsubscribe,
      getAll,
    };
  }, [component, context, started, channelReady]);
}
