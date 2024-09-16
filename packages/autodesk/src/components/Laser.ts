import {
  // new THREE (r139)
  Clock,
  Vector3,
} from 'three';

// eslint-disable-next-line import/extensions
import { Avatar } from './Avatar';
import { Slot } from '../types';

export class Laser {
  constructor(viewer: Autodesk.Viewing.GuiViewer3D, slot: Slot, laserOrigin: Vector3) {
    this.viewer = viewer;
    this.laserOrigin = laserOrigin;
    this.clock = new Clock();
    this.clock.start();
    this.isDestroyed = false;

    this.lerpAnimationFrame = requestAnimationFrame(this.animate.bind(this));
    this.generateMaterial(slot);
  }

  private clock: Clock;
  private lerpAnimationFrame: number;
  private viewer: Autodesk.Viewing.GuiViewer3D;
  private isDestroyed: boolean;

  private position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private quaternion: THREE.Quaternion = new THREE.Quaternion(0, 0, 0, 0);
  private mousePosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private lerpedMousePosition = new THREE.Vector3(0, 0, 0);

  private slot: Slot = null;
  private laserOrigin: Vector3;

  public mesh: THREE.Mesh;

  private avatar: Avatar;

  private material: THREE.Material = new THREE.MeshBasicMaterial();

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.lerpAnimationFrame);
    if (this.mesh) {
      this.viewer.overlays.removeMesh(this.mesh, 'avatars-scene');
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
  }

  public setAvatar(avatar: Avatar) {
    if (!avatar) return;

    this.avatar = avatar;
  }

  public setMousePosition(position: THREE.Vector3) {
    if (!position) return;

    this.mousePosition.set(position.x, position.y, position.z);
  }

  public setColorIndex(slot: Slot) {
    if (slot !== this.slot && slot !== undefined) {
      this.generateMaterial(slot);
      this.slot = slot;
    }
  }

  private animate() {
    // this should run slower than 60fps, run this at 20fps so CPU is not cooked
    const fps: number = 20;
    const delta = this.clock.getDelta();
    setTimeout(() => {
      if (this.isDestroyed) {
        return;
      }
      this.lerpAnimationFrame = requestAnimationFrame(this.animate.bind(this));
    }, 1000 / fps);
    if (!this.avatar) {
      return;
    }
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.viewer.overlays.removeMesh(this.mesh, 'avatars-scene');
    }
    this.position = this.avatar.model.position;
    this.quaternion = this.avatar.model.quaternion;

    if (!this.position || !this.mousePosition || !this.quaternion || !this.material) {
      return;
    }
    const startPosition = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    const v1 = new THREE.Vector3(
      this.laserOrigin.x,
      this.laserOrigin.y,
      this.laserOrigin.z,
    ).applyQuaternion(
      new THREE.Quaternion(
        this.quaternion.x,
        this.quaternion.y,
        this.quaternion.z,
        this.quaternion.w,
      ),
    );
    startPosition.add(v1.multiplyScalar(1));

    const speed = 1000;
    this.lerpedMousePosition.lerp(this.mousePosition, (delta / 1000) * speed);
    // @ts-ignore
    const curve = new THREE.LineCurve3(
      startPosition,
      new THREE.Vector3(
        this.lerpedMousePosition.x,
        this.lerpedMousePosition.y,
        this.lerpedMousePosition.z,
      ),
    );
    const thickness: number = 0.005;
    // @ts-ignore
    const tube = new THREE.TubeGeometry(curve, 3, thickness, 4, false);

    this.mesh = new THREE.Mesh(tube, this.material);
    if (this.viewer.overlays.hasScene('avatars-scene')) {
      this.viewer.overlays.addMesh(this.mesh, 'avatars-scene');
    }
  }

  private createTextureCanvas() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1;
    canvas.height = 64;
    // set gradient
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(  0,  0,  0,0.2)');
    gradient.addColorStop(0.1, 'rgba(160,160,160,0.5)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.9, 'rgba(160,160,160,0.5)');
    gradient.addColorStop(1.0, 'rgba(  0,  0,  0,0.2)');
    // fill the rectangle
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    // return the just built canvas
    return canvas;
  }

  private generateMaterial(slot: Slot) {
    const color = slot?.color ?? '#878291';
    const canvas = this.createTextureCanvas();
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    this.material = new THREE.MeshBasicMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      color,
      side: THREE.DoubleSide,
      depthWrite: false,
      transparent: false,
    });
  }
}
