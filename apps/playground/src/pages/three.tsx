import { v4 as uuid } from 'uuid'
import { useCallback, useEffect, useRef } from "react"
import * as THREE from 'three'
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Presence3D } from '../lib/three';
import { LauncherFacade, Room } from '../lib/sdk';
import { getConfig } from '../config';


const SUPERVIZ_KEY = getConfig<string>("keys.superviz");
const SUPERVIZ_ROOM_PREFIX = getConfig<string>("roomPrefix");
const componentName = 'threejs'


export function Three() {
  const room = useRef<LauncherFacade | null>()

  useEffect(() => {
    initializeThreeJs()

    return () => {
      room.current?.destroy()
    }
  }, [])

  const initializeSuperViz = useCallback(async (scene: THREE.Scene, camera: THREE.Camera) => { 
    room.current = await Room(SUPERVIZ_KEY, {
      roomId: `${SUPERVIZ_ROOM_PREFIX}-${componentName}`,
      participant: {
        name: "Participant",
        id: uuid(),
      },
      group: {
        name: SUPERVIZ_ROOM_PREFIX,
        id: SUPERVIZ_ROOM_PREFIX,
      },
      environment: "dev",
      debug: true,
    });

    const presence = new Presence3D(scene, camera, camera)
    room.current.addComponent(presence)
  }, [])

  const initializeThreeJs = useCallback(async () => {
    const canvas = document.getElementById('showcase') as HTMLCanvasElement
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height)

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb6b7b8);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 300);
    camera.position.set(2, 0, 2);
  
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.update();
    controls.enablePan = false;
    controls.enableDamping = true;
  
    const loader = new GLTFLoader();
    loader.load(
      "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb",
      (model: GLTF) => { 
        scene.add(model.scene)
        initializeSuperViz(scene, camera)
      },
      undefined,
      (e: unknown) => {
        console.error(e)
      }
    );
  
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
  
      renderer.render(scene, camera);
    };
  
    animate();
  }, [initializeSuperViz])


  return (
    <main className='w-full h-full'>
       <canvas id='showcase' className='w-full h-full' />
    </main>
  );
}