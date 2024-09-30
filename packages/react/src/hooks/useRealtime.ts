import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import {
  Channel,
  RealtimeComponent,
  RealtimeComponentState,
  type RealtimeMessage,
} from '../lib/sdk';

type UseRealtimeData = {
  /**
   * @property isReady
   * @description is the realtime component ready
   * @returns {boolean}
   */
  isReady: boolean;
  /**
   * @function subscribe
   * @description subscribe to a realtime event
   * @returns {void}
   */
  subscribe: <T extends Callback>(event: string, callback: T) => void;
  /**
   * @function unsubscribe
   * @description unsubscribe from a realtime event
   * @returns {void}
   */
  unsubscribe: <T extends Callback>(event: string, callback: T) => void;
  /**
   * @function publish
   * @description publish a realtime event
   * @returns {void}
   */
  publish: <T>(event: string, data: T) => void;
  /**
   * @function string
   * @description get realtime client data history
   * @returns {RealtimeMessage | Record<string, RealtimeMessage>}
   */
  fetchHistory: (
    eventName?: string,
  ) => Promise<RealtimeMessage[] | Record<string, RealtimeMessage[]> | null>;
};

type Callback = (data: any) => void;

export function useRealtime(channelName: string): UseRealtimeData {
  const [started, setStarted] = useState(false);
  const [channelReady, setChannelReady] = useState(false);
  const { component, room, ...context } = useInternalFeatures<RealtimeComponent>('realtime');
  const eventsToSubscribe = useRef<Record<string, Callback[]>>({});
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
    (async () => {
      if ((!started && !channel.current) || !component) return;
      channel.current = await component!.connect(channelName);

      if (channel.current['state'] === 'CONNECTED') {
        setChannelReady(true);
        return;
      }

      channel.current.subscribe('realtime-channel.state-changed', (state) => {
        setChannelReady(state === 'CONNECTED');
      });
    })();
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
          channel.current!.subscribe(event, callback as Callback);
        });
      });

      eventsToSubscribe.current = {};
    }
  }, [channelReady]);

  const subscribe = useCallback(
    (event: string, callback: Callback) => {
      if (!channel.current) {
        const previus = eventsToSubscribe.current[event] || [];

        eventsToSubscribe.current[event] = previus.includes(callback)
          ? previus
          : [...previus, callback];

        return;
      }

      channel.current.subscribe(event, callback);
    },
    [component, context, eventsToSubscribe.current],
  );

  const publish = useCallback(
    (event: string, data: any) => {
      if (!started || !channelReady) return;

      channel.current!.publish(event, data);
    },
    [component, context, started],
  );

  const unsubscribe = useCallback(
    (event: string, callback: Callback) => {
      if (!started || !channelReady) return;

      channel.current!.unsubscribe(event, callback);
    },
    [component, context, started],
  );

  const fetchHistory = useCallback(
    async (
      eventName?: string,
    ): Promise<RealtimeMessage[] | Record<string, RealtimeMessage[]> | null> => {
      if (!started) {
        console.warn('[SuperViz] Realtime component is not ready - try again later');
        return Promise.resolve(null);
      }

      if (!channelReady) {
        console.warn(`[SuperViz] Channel ${channelName} is not ready - try again later`);
        return Promise.resolve(null);
      }

      const response = await channel.current!.fetchHistory(eventName);

      return response;
    },
    [component, context, started],
  );

  return useMemo(() => {
    return {
      isReady: channelReady && started,
      publish,
      subscribe,
      unsubscribe,
      fetchHistory,
    };
  }, [component, context, started, channelReady]);
}
