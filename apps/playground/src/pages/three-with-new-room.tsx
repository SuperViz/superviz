import { Room, createRoom } from '@superviz/room'
import { Presence3D } from "@superviz/threejs-plugin";
import { v4 as generateId } from "uuid";

import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from "three-mesh-bvh";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useCallback, useEffect, useRef } from "react";
import { getConfig } from "../config";

const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");

export function ThreeWithNewRoom() {
  const three = useRef<Presence3D | null>(null);
  const room = useRef<Room | null>(null);
  const loaded = useRef<boolean>(false);
  const scene = useRef<THREE.Scene>(new THREE.Scene());
  const camera = useRef<THREE.PerspectiveCamera>();
  const controls = useRef<OrbitControls>();
  const renderer = useRef<THREE.WebGLRenderer>();

  const initializeSuperViz = useCallback(async () => {
    const uuid = generateId();

    room.current = await createRoom({
      developerToken: SUPERVIZ_KEY,
      participant: {
        id: uuid,
        name: "Participant",
      },
      group: {
        id: SUPERVIZ_ROOM_PREFIX,
        name: SUPERVIZ_ROOM_PREFIX,
      },
      roomId: `${SUPERVIZ_ROOM_PREFIX}-three`,
      debug: true,
      environment: 'dev',
    });

    three.current = new Presence3D(
      scene.current as never,
      camera.current as never,
      camera.current as never,
      {
        avatarConfig: {
          scale: 0,
          height: -0.45,
          laserOrigin: { x: 0, y: 0, z: 0 },
        },
        isAvatarsEnabled: true,
        isLaserEnabled: true,
        isNameEnabled: true,
        renderLocalAvatar: false,
        isMouseEnabled: true,
      }
    );

    room.current.addComponent(three.current);
  }, []);

  const threejs = useCallback(async () => {
    if (loaded.current) return;
    loaded.current = true;

    const container = document.querySelector("#model");
    (THREE.BufferGeometry.prototype as any).computeBoundsTree =
      computeBoundsTree;
    (THREE.BufferGeometry.prototype as any).disposeBoundsTree =
      disposeBoundsTree;
    THREE.Mesh.prototype.raycast = acceleratedRaycast as any;

    renderer.current = new THREE.WebGLRenderer({ antialias: true });
    renderer.current.setPixelRatio(window.devicePixelRatio);
    renderer.current.setSize(window.innerWidth, window.innerHeight);

    container!.appendChild(renderer.current.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer.current);

    scene.current = new THREE.Scene();
    scene.current.background = new THREE.Color(0xb6b7b8);
    scene.current.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;

    camera.current = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    camera.current.position.set(2, 0, 2);

    controls.current = new OrbitControls(
      camera.current,
      renderer.current.domElement
    );
    controls.current.target.set(0, 0.5, 0);
    controls.current.update();
    controls.current.enablePan = false;
    controls.current.enableDamping = true;
    const loader = new GLTFLoader();
    loader.load(
      "/three_cylinder_motorcycle_engine.glb",
      async (e) => {
        console.log("model loaded");
        const model = e.scene;
        scene.current.add(model);
        scene.current.traverse(function () {
          // if (obj.type === "Mesh") {
          //   (obj as any).geometry.computeBoundsTree();
          // }
        });

        await animate();
        await initializeSuperViz();
      },
      undefined,
      function (e) {
        console.error("aaaa", e);
      }
    );
  }, []);

  const animate = useCallback(() => {
    requestAnimationFrame(animate);
    controls.current!.update();
    renderer.current!.render(scene.current, camera.current!);
  }, []);

  useEffect(() => {
    threejs();

    return () => {
      if(three.current) {
        room.current?.removeComponent(three.current);
      }

      room.current?.leave();
    };
  }, []);

  return (
    <main>
      <section id="model"></section>
    </main>
  );
}
