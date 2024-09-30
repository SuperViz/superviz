import type { Presence3D } from '@superviz/matterport-plugin';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';
import { MatterportComponent } from 'src/contexts/room.types';

type UseMatterportData = {
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

export function useMatterport(): UseMatterportData {
  const { component, room, ...context } =
    useInternalFeatures<MatterportComponent>('presence3dMatterport');
  const instance = useRef<Presence3D | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!component) return;
    instance.current = component;
    setIsReady(true);
  }, [component]);

  useEffect(() => {
    if (!room && instance.current) {
      instance.current = null;
      setIsReady(false);
    }
  }, [room]);

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
  }, [room, context.activeComponents, component, instance.current, isReady]);
}
