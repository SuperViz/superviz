import { useEffect, useMemo, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { CommentsComponent, HTMLPin } from '../lib/sdk';

type UseHTMLPin = {
  pin: HTMLPin | null;
  destroy: () => void;
};

type Params = {
  containerId: string;
  dataAttributeName?: string;
  dataAttributeValueFilters?: RegExp[];
};

let pin: HTMLPin | null = null;

export function useHTMLPin({ containerId, ...params }: Params): UseHTMLPin {
  const { room } = useInternalFeatures<CommentsComponent>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!room && pin) {
      pin = null;
      setLoaded(false);
    }
  }, [room]);

  return useMemo(() => {
    if (!containerId || !document.getElementById(containerId)) {
      return {
        pin: null,
        destroy: () => {},
      };
    }

    if (!pin) {
      pin = new HTMLPin(containerId, params);
      setLoaded(true);
    }

    return {
      pin: pin,
      destroy: () => {
        pin?.destroy();
        setLoaded(false);
      },
    };
  }, [containerId, room, loaded]);
}
