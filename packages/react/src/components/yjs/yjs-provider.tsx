import { useEffect, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { SuperVizYjsProvider } from '../../lib/sdk';
import { YjsProviderCallbacks, YjsProviderProps } from './yjs-provider.types';
import { Events } from '@superviz/yjs/dist/provider/types';

const callbacksToEvents = new Map<keyof YjsProviderCallbacks, keyof Events>([
  ['onConnect', 'connect'],
  ['onDisconnect', 'disconnect'],
  ['onSynced', 'synced'],
  ['onSync', 'sync'],
  ['onDestroy', 'destroy'],
  ['onMessage', 'message'],
  ['onOutgoingMessage', 'outgoingMessage'],
  ['onStateChange', 'state'],
]);

export function YjsProvider({
  doc,
  awareness,
  onMount,
  onUnmount,
  children,
  ...callbacks
}: YjsProviderProps) {
  const { room, component, addComponent } = useInternalFeatures<SuperVizYjsProvider>('yjsProvider');
  const [initializedTimestamp, setInitializedTimestamp] = useState<number | null>(null);
  const [previousCallbacks, setPreviousCallbacks] = useState<typeof callbacks>(
    {} as typeof callbacks,
  );

  useEffect(() => {
    if (!component) return;
    const cbs = Object.entries(callbacks);
    const previousCbs = Object.values(previousCallbacks);
    const list: typeof callbacks = { ...callbacks };

    for (let i = 0; i < cbs.length; i++) {
      if (cbs[i][1] === previousCbs[i]) return;

      const eventName = callbacksToEvents.get(cbs[i][0] as keyof YjsProviderCallbacks);
      component.off(eventName!, previousCbs[i]);

      if (!cbs[i][1]) return;

      component.on(eventName!, cbs[i][1]);

      // @ts-expect-error The types are potentially the same, but since
      // both can have multiple types, ts can't infer that they are the same
      list[cbs[i][0]] = cbs[i][1];
    }

    setPreviousCallbacks(list);
  }, [callbacks]);

  useEffect(() => {
    if (!room || initializedTimestamp) return;

    const provider = new SuperVizYjsProvider(doc, { awareness });

    addComponent(provider);
    setInitializedTimestamp(Date.now());
  }, [room]);

  useEffect(() => {
    if (!component && initializedTimestamp) {
      setInitializedTimestamp(null);
    }
  }, [component]);

  return children ?? <></>;
}
