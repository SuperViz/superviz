import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';
import type { AutoDeskComponent } from 'src/contexts/room.types';

type UseAutodesk = {
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

export function useAutodesk(): UseAutodesk {
  const { component } = useInternalFeatures<AutoDeskComponent>('presence3dAutodesk');
  const instance = useRef<AutoDeskComponent | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (component) {
      instance.current = component;
      setIsReady(true);
    }
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
  }, [component, isReady]);
}
