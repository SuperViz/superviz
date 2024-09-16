import { Clock, Object3D, Quaternion, Vector3 } from 'three'; // new THREE (r139)

// eslint-disable-next-line import/extensions
import { GLTFLoader } from '../utils/GLTFLoader.js';
// eslint-disable-next-line import/extensions
import { TranslateModel } from '../utils/TranslateModel.js';

export class Avatar {
  constructor(url: string, scale: number, height: number) {
    this.url = url;
    this.scale = scale;
    this.height = height;
    this.clock = new Clock();
    this.clock.start();
    this.lerpAnimationFrame = requestAnimationFrame(this.animate.bind(this));
  }

  private clock: Clock;
  public target: Vector3 = new Vector3(0, 0, 0);
  public url: string;
  public scale: number;
  public height: number;
  private lerpAnimationFrame: number;
  public position: Vector3 = new Vector3(0, 0, 0);
  private curPosition: Vector3 = new Vector3(0, 0, 0);
  public quaternion: Quaternion = new Quaternion(0, 0, 0, 0);
  public model: Object3D;

  load = async function (): Promise<Object3D> {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        this.url,
        async (gltf) => {
          this.model = await TranslateModel(THREE, gltf.scene, this.scale, this.height);
          if (!this.model) {
            throw new Error('error creating avatar in forge');
          }
          resolve(this.model);
        },
        undefined,
        (error) => {
          console.error('An error happened loading the avatar', error);
          reject(error);
        },
      );
    });
  };

  public setPosition(position: Vector3) {
    if (!position || (position.x === 0 && position.y === 0 && position.z === 0)) return;

    this.position.set(position.x, position.y, position.z);
  }

  public setQuaternion(quaternion: Quaternion) {
    if (!quaternion) return;

    this.quaternion.set(quaternion._x, quaternion._y, quaternion._z, quaternion._w);
  }

  public destroy() {
    cancelAnimationFrame(this.lerpAnimationFrame);
    this.model.parent.remove(this.model);
  }

  private animate() {
    this.lerpAnimationFrame = requestAnimationFrame(this.animate.bind(this));
    if (!this.model || !this.position || !this.quaternion) {
      return;
    }
    const delta = this.clock.getDelta();
    const speed = 2;
    const lerpSpeed = speed * delta;
    this.curPosition.lerp(this.position, lerpSpeed);

    this.model.position.set(this.curPosition.x, this.curPosition.y, this.curPosition.z);

    const curQuaternion: Quaternion = this.model.quaternion.clone();
    curQuaternion.slerp(this.quaternion, lerpSpeed);
    this.model.quaternion.set(curQuaternion.x, curQuaternion.y, curQuaternion.z, curQuaternion.w);
  }
}
