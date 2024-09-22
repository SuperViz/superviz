import { Presence3D } from '@superviz/threejs-plugin';
import { useEffect, useState } from 'react';
import { useInternalFeatures } from 'src/contexts/room';
import { ThreeJsComponent } from 'src/contexts/room.types';

import { ThreeJsComponentProps } from './three.types';

export function ThreeJsPresence({
  scene,
  camera,
  player,
  children,
  ...params
}: ThreeJsComponentProps) {
  const { room, component, addComponent } =
    useInternalFeatures<ThreeJsComponent>('presence3dThreejs');
  const [initializedTimestamp, setInitializedTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!room && initializedTimestamp) {
      setInitializedTimestamp(null);
      return;
    }

    if (!room || initializedTimestamp || !scene || !camera || !player) {
      return;
    }

    // @ts-ignore
    const threeInstance = new Presence3D(scene, camera, player, { ...params }) as ThreeJsComponent;

    addComponent(threeInstance);
    setInitializedTimestamp(Date.now());
  }, [room, scene, initializedTimestamp]);

  useEffect(() => {
    if (!component && initializedTimestamp) {
      setInitializedTimestamp(null);
    }
  }, [component]);

  return children ?? <></>;
}
