import { Clock, AnimationMixer, Object3D, Quaternion, Vector3, AnimationAction } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Avatar {
  constructor(url: string, scale: number, height: number, isOwnAvatar: boolean) {
    this.url = url;
    this.scale = scale;
    this.height = height;
    this.clock = new Clock();
    this.mixer = null;
    this.isOwnAvatar = isOwnAvatar;
    this.animations = {};
    this.isMoving = false;
    this.isMovingCounter = 0;

    this.lerpAnimationFrame = requestAnimationFrame(this.animate.bind(this));
  }

  private clock: Clock;
  public url: string;
  public scale: number;
  public height: number;
  public mixer: AnimationMixer;
  public animations: { [k: string]: AnimationAction } = {};
  private lerpAnimationFrame: number;
  private position: Vector3 = new Vector3(0, 0, 0);
  private lastPosition: Vector3 = new Vector3(0, 0, 0);
  private quaternion: Quaternion = null;
  private isOwnAvatar: boolean = false;
  public root: Object3D;
  public model: Object3D;
  private currentAnimation: string = null;

  public isMoving: boolean;
  private isMovingCounter: number;

  // object pooling
  private lastWorldModelPos = new Vector3(0, 0, 0);
  private worldPosition = new Vector3(0, 0, 0);

  public load = async (): Promise<Object3D> => {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        this.url,
        async (gltf) => {
          this.mixer = new AnimationMixer(gltf.scene);
          gltf.animations.forEach((anim) => {
            const animationAction: AnimationAction = this.mixer.clipAction(anim);
            this.animations[anim.name] = animationAction;
            this.animations[anim.name].paused = true;
          });

          gltf.scene.scale.set(this.scale, this.scale, this.scale);
          gltf.scene.rotation.set(0, 3.14, 0);
          gltf.scene.position.set(0, this.height, 0);

          const root = new Object3D();
          root.add(gltf.scene);
          this.model = gltf.scene;
          this.root = root;
          resolve(this.root);
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
    this.position.set(position.x, position.y, position.z);
  }

  public setQuaternion(quaternion: Quaternion) {
    this.quaternion = new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  }

  public destroy() {
    cancelAnimationFrame(this.lerpAnimationFrame);
    this.root.parent.remove(this.root);
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));
    if (!this.position || !this.quaternion) {
      return;
    }
    this.lastPosition.set(this.position.x, this.position.y, this.position.z);

    const delta = this.clock.getDelta();
    const speed = this.isOwnAvatar ? 6 : 2;

    const curPosition = this.root.position.clone();
    curPosition.lerp(this.position, speed * delta);
    this.root.position.set(curPosition.x, curPosition.y, curPosition.z);

    const curQuat = this.root.quaternion.clone();
    curQuat.slerp(this.quaternion, speed * delta);
    this.root.quaternion.set(curQuat.x, curQuat.y, curQuat.z, curQuat.w);

    this.mixer.update(delta);

    // is moving checker
    this.model.getWorldPosition(this.worldPosition);
    const minDistance = this.isOwnAvatar ? 0.001 : 0.004;
    const counterValue = this.isOwnAvatar ? 10 : 30;
    if (this.lastWorldModelPos.distanceTo(this.worldPosition) < minDistance) {
      this.isMovingCounter++;
      if (this.isMovingCounter > counterValue) {
        this.isMoving = false;
        this.isMovingCounter = 0;
      }
    } else {
      this.isMoving = true;
    }
    this.model.getWorldPosition(this.lastWorldModelPos);
  }

  public playAnimation(name: string) {
    if (!this.animations[name]) {
      return;
    }

    const animationToPlay = this.animations[name];
    if (animationToPlay && this.currentAnimation !== name) {
      animationToPlay.paused = false;
      animationToPlay.enabled = true;
      animationToPlay.play();
      // crossfade
      if (this.currentAnimation && this.animations[this.currentAnimation]) {
        const fadeOut = this.isOwnAvatar ? 0.3 : 0.7;
        this.animations[this.currentAnimation].crossFadeTo(animationToPlay, fadeOut, true);
      }
      this.currentAnimation = name;
    }
  }

  public stopAnimation(name: string) {
    if (this.animations[name]) {
      this.animations[name].paused = true;
    }
  }

  public stopAllAnimations() {
    Object.values(this.animations).forEach((animation) => {
      const anim = animation;
      anim.paused = true;
    });
  }
}
