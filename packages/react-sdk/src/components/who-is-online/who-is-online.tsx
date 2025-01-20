import { useEffect, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { WhoIsOnlineComponent } from '../../lib/sdk';
import { WhoIsOnlineProps } from './who-is-online.types';

export function WhoIsOnline({ position, styles, onMount, onUnmount, ...flags }: WhoIsOnlineProps) {
  const { room, component, addComponent } =
    useInternalFeatures<WhoIsOnlineComponent>('whoIsOnline');
  const [initializedTimestamp, setInitializedTimestamp] = useState<number | null>(null);

  const callbacks = {
    mount: onMount,
    unmount: onUnmount,
  };

  useEffect(() => {
    if (!component) return;

    Object.entries(callbacks).forEach(([event, callback]) => {
      component.unsubscribe(event, callback);

      if (callback) {
        component.subscribe(event, callback);
      }
    });
  }, [component, room, onMount, onUnmount]);

  useEffect(() => {
    if (!room || initializedTimestamp) return;

    const wioInstance = new WhoIsOnlineComponent({ position, styles, ...flags });
    addComponent(wioInstance);
    setInitializedTimestamp(Date.now());
  }, [room]);

  useEffect(() => {
    if (!component && initializedTimestamp) {
      setInitializedTimestamp(null);
    }
  }, [component]);

  return <></>;
}
