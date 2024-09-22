import { useMemo } from 'react';

import { useInternalFeatures } from '../contexts/room';

export function useSuperviz() {
  const { startRoom, stopRoom, hasJoinedRoom } = useInternalFeatures();

  return useMemo(
    () => ({
      startRoom,
      stopRoom,
      hasJoinedRoom,
    }),
    [startRoom, stopRoom, hasJoinedRoom],
  );
}
