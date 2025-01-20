import { ThreeJsPin } from '@superviz/threejs-plugin';
import { useEffect, useMemo, useRef } from 'react';
import { useInternalFeatures } from 'src/contexts/room';
import type { Camera, Object3D, Renderer, Scene } from 'three';

type UseThreeJsPin = {
  pin: ThreeJsPin | null;
  destroy: () => void;
};

type Params = {
  scene: Scene;
  renderer: Renderer;
  camera: Camera;
  player?: Object3D;
  controls?: any;
};

export function useThreeJsPin({
  scene,
  renderer,
  camera,
  player,
  controls,
}: Params): UseThreeJsPin {
  const { room } = useInternalFeatures();
  const loaded = useRef(false);
  const adapter = useRef<ThreeJsPin | null>(null);

  useEffect(() => {
    if (!room && loaded.current) {
      loaded.current = false;
      adapter.current?.destroy();
      adapter.current = null;
    }
  }, [room]);

  return useMemo(() => {
    if (!scene || !renderer || !camera) {
      return {
        pin: null,
        destroy: () => {},
      };
    }

    if (!loaded.current) {
      loaded.current = true;

      // @ts-ignore
      const pin = new ThreeJsPin(scene, renderer, camera, player, controls);
      adapter.current = pin;
    }

    return {
      pin: adapter.current,
      destroy: () => {
        adapter.current?.destroy();
        adapter.current = null;
      },
    };
  }, [scene, renderer, camera, player, controls]);
}
