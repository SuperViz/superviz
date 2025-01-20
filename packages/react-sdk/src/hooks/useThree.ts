import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';
import type { ThreeJsComponent } from 'src/contexts/room.types';

type UseThreeData = {
  isReady: boolean;
  /**
   * @function follow
   * @description follow a participant
   * @param participantId - participant id to follow, if not provided, follow is disabled
   * @returns {void}
   */
  follow(participantId?: string): void;
  /**
   * @function goTo
   * @description go to a participant
   * @param participantId - participant id to go to
   * @returns {void}
   */
  goTo: (participantId: string) => void;
};

export function useThree(): UseThreeData {
  const { component, ...context } = useInternalFeatures<ThreeJsComponent>('presence3dThreejs');
  const instance = useRef<ThreeJsComponent | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!component) return;
    instance.current = component;
    setIsReady(true);
  }, [component]);

  const follow = useCallback(
    (participantId?: string) => {
      if (!instance.current) return;
      instance.current.follow(participantId);
    },
    [instance.current, component],
  );

  const goTo = useCallback(
    (participantId: string) => {
      if (!instance.current) return;
      instance.current.goTo(participantId);
    },
    [instance.current, component],
  );

  return useMemo(() => {
    return {
      isReady,
      follow,
      goTo,
    };
  }, [context.room, context.activeComponents, component, isReady]);
}
