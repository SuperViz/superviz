import { AutodeskPin } from '@superviz/autodesk-viewer-plugin';
import { useEffect, useMemo, useRef } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

type UseAutodeskPin = {
  pin: AutodeskPin | null;
  destroy: () => void;
};

type Params = {
  autodeskInstance: Autodesk.Viewing.GuiViewer3D;
};

export function useAutodeskPin({ autodeskInstance }: Params): UseAutodeskPin {
  const { room } = useInternalFeatures();
  const loaded = useRef(false);
  const adapter = useRef<AutodeskPin | null>(null);

  useEffect(() => {
    if (!room && loaded.current) {
      loaded.current = false;
      adapter.current?.destroy();
      adapter.current = null;
    }
  }, [room]);

  return useMemo(() => {
    if (!autodeskInstance) {
      return {
        pin: null,
        destroy: () => {},
      };
    }

    if (!loaded.current) {
      loaded.current = true;

      const pin = new AutodeskPin(autodeskInstance);
      adapter.current = pin;
    }

    return {
      pin: adapter.current,
      destroy: () => {
        adapter?.current?.destroy();
        adapter.current = null;
      },
    };
  }, [autodeskInstance, room, adapter.current]);
}
