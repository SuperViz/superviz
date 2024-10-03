import { useEffect, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { SuperVizYjsProvider } from '../../lib/sdk';
import { YjsProviderCallbacks, YjsProviderProps } from './yjs-provider.types';
import type { Events } from '@superviz/yjs';

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
  const [previousCallbacks, setPreviousCallbacks] = useState<typeof callbacks>({} as any);

  useEffect(() => {
    if (!component) return;

    const callbacksArray = Object.entries(callbacks);
    const previousCallbacksArray = Object.entries(previousCallbacks);

    let hasChanged = false;
    for (let i = 0; i < callbacksArray.length; i++) {
      if (callbacksArray[i][1] !== previousCallbacksArray[i]?.[1]) {
        hasChanged = true;
        break;
      }
    }

    if (!hasChanged) return;

    // Proceed with event binding/unbinding only if callbacks changed
    callbacksArray.forEach(([key, value]) => {
      const eventName = callbacksToEvents.get(key as keyof YjsProviderCallbacks);
      // @ts-ignore
      if (previousCallbacks[key]) component.off(eventName!, previousCallbacks[key]);
      if (value) component.on(eventName!, value);
    });

    setPreviousCallbacks(callbacks);
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
