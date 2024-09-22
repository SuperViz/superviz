import { MatterportPin } from '@superviz/matterport-plugin';
import type { MpSdk } from '@superviz/matterport-plugin/dist/common/types/matterport.types';
import { useEffect, useMemo, useRef } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

type UseMatterportPin = {
  pin: MatterportPin | null;
  destroy: () => void;
};

type Params = {
  matterportInstance: MpSdk;
  showcaseWindow: HTMLIFrameElement;
};

export function useMatterportPin({ matterportInstance, showcaseWindow }: Params): UseMatterportPin {
  const { room } = useInternalFeatures();
  const loaded = useRef(false);
  const adapter = useRef<MatterportPin | null>(null);

  useEffect(() => {
    if (!room && loaded.current) {
      loaded.current = false;
      adapter.current?.destroy();
      adapter.current = null;
    }
  }, [room]);

  return useMemo(() => {
    if (!showcaseWindow || !matterportInstance) {
      return {
        pin: null,
        destroy: () => {},
      };
    }

    if (!loaded.current) {
      loaded.current = true;

      const pin = new MatterportPin(matterportInstance, showcaseWindow);
      adapter.current = pin;
    }

    return {
      pin: adapter.current,
      destroy: () => {
        adapter.current?.destroy();
        adapter.current = null;
      },
    };
  }, [showcaseWindow, matterportInstance]);
}
