import { useEffect, useRef } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { CanvasPin } from '../lib/sdk';

type UseCanvasPin = {
  pin: CanvasPin | null;
  destroy: () => void;
};

type GoToPinHandler = (position: { x: number; y: number }) => void;

type Params = {
  onGoToPin?: GoToPinHandler;
  canvasId: string;
};

export function useCanvasPin({ canvasId, onGoToPin: goToPinCallback }: Params): UseCanvasPin {
  const { room } = useInternalFeatures();
  const loaded = useRef(false);
  const adapter = useRef<CanvasPin | null>(null);

  function onGoToPin(args: { x: number; y: number }) {
    goToPinCallback && goToPinCallback(args);
  }

  useEffect(() => {
    if (!room && adapter.current) {
      loaded.current = false;
      adapter.current = null;
    }
  }, [room]);

  if (!canvasId || !document.getElementById(canvasId)) {
    return {
      pin: null,
      destroy: () => {},
    };
  }

  if (!loaded.current) {
    loaded.current = true;

    const pin = new CanvasPin(canvasId, {
      onGoToPin,
    });
    adapter.current = pin;
  }

  return {
    pin: adapter.current,
    destroy: () => {
      adapter.current?.destroy();
      adapter.current = null;
    },
  };
}
