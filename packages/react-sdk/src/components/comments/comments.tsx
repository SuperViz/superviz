import { useEffect, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { CommentsComponent } from '../../lib/sdk';
import { CommentsProps } from './comments.types';

export function Comments({
  pin,
  children,
  onPinActive,
  onPinInactive,
  onMount,
  onUnmount,
  ...params
}: CommentsProps) {
  const { room, component, addComponent } = useInternalFeatures<CommentsComponent>('comments');
  const [initializedTimestamp, setInitializedTimestamp] = useState<number | null>(null);

  const callbacks = {
    'pin-mode.active': onPinActive,
    'pin-mode.inactive': onPinInactive,
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
  }, [component, room, onPinActive, onPinInactive, onMount, onUnmount]);

  useEffect(() => {
    if (!room || initializedTimestamp || !pin) return;

    const commentsInstance = new CommentsComponent(pin, { ...params });

    addComponent(commentsInstance);
    setInitializedTimestamp(Date.now());
  }, [room, pin]);

  useEffect(() => {
    if (!component && initializedTimestamp) {
      setInitializedTimestamp(null);
    }
  }, [component]);

  return children ?? <></>;
}
