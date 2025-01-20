import { useCallback, useEffect, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { MousePointersComponent, PointersCanvas, PointersHTML } from '../../lib/sdk';
import { MousePointersProps } from './mouse-pointers.types';

export function MousePointers({
  children,
  elementId,
  onMount,
  onUnmount,
  ...params
}: MousePointersProps) {
  const [initializedTimestamp, setInitializedTimestamp] = useState<number | null>(null);
  const { room, component, addComponent } = useInternalFeatures<PointersCanvas | PointersHTML>(
    'presence',
  );

  const callbacks = {
    mount: onMount,
    unmount: onUnmount,
  };

  const goTo = useCallback(
    (data: { x: number; y: number; scaleX: number; scaleY: number }) => {
      if (!params.callbacks?.onGoToPresence) return;

      params.callbacks?.onGoToPresence(data);
    },
    [params.callbacks?.onGoToPresence],
  );

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
    if (!room || initializedTimestamp || !document.getElementById(elementId)) return;

    const mouse = new MousePointersComponent(elementId, {
      callbacks: { onGoToPresence: goTo },
    }) as PointersCanvas | PointersHTML;

    addComponent(mouse);
    setInitializedTimestamp(Date.now());
  }, [room, elementId]);

  useEffect(() => {
    if (!component && initializedTimestamp) {
      setInitializedTimestamp(null);
    }
  }, [component]);

  return children ?? <></>;
}
