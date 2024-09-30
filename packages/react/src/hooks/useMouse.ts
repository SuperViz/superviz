import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';

import { PointersCanvas, PointersHTML } from '../lib/sdk';

type UseMouseData = {
  isReady: boolean;
  /**
   * @function toggleMeetingSetup
   * @description open/close meeting setup
   * @returns {void}
   */
  transform: (data: { translate?: { x?: number; y?: number }; scale?: number }) => void;
};

export function useMouse(): UseMouseData {
  const { component, room, ...context } = useInternalFeatures<PointersCanvas | PointersHTML>(
    'presence',
  );
  const instance = useRef<PointersCanvas | PointersHTML | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (component) {
      instance.current = component;
      setIsReady(true);
    }

    if (!room && isReady) {
      instance.current = null;
      setIsReady(false);
    }
  }, [component]);

  const transform = useCallback(
    (data: { translate?: { x?: number; y?: number }; scale?: number }) => {
      if (!instance.current) return;

      instance.current.transform(data);
    },
    [instance.current],
  );

  return useMemo(() => {
    return {
      isReady,
      transform,
    };
  }, [room, context.activeComponents, component, isReady]);
}
