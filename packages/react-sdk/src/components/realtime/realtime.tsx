import { useEffect, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { RealtimeComponent, RealtimeComponentEvent } from '../../lib/sdk';
import { RealtimeProps } from './realtime.types';

export function Realtime({ onStateChange, onMount, onUnmount }: RealtimeProps) {
  const { room, component, addComponent } = useInternalFeatures<RealtimeComponent>('realtime');
  const [initializedTimestamp, setInitializedTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!room || initializedTimestamp) return;

    const realtimeInstance = new RealtimeComponent();
    addComponent(realtimeInstance);
    setInitializedTimestamp(Date.now());

    if (onStateChange)
      realtimeInstance.subscribe(
        RealtimeComponentEvent.REALTIME_STATE_CHANGED,
        onStateChange as (data: unknown) => void,
      );

    if (onMount) onMount();
  }, [room]);

  useEffect(() => {
    if (!component && initializedTimestamp) {
      setInitializedTimestamp(null);
      if (onUnmount) onUnmount();
    }
  }, [component]);

  return <></>;
}
