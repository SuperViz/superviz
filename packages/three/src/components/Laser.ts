import {
  Clock,
  Mesh,
  TubeGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Texture,
  Vector3,
  LineCurve3,
  AdditiveBlending,
  Object3D,
  Scene,
  Quaternion,
  Camera,
} from 'three';

import { Colors } from '../common/types/colors.types';
import { Slot } from '../types';

export class Laser {
  constructor(camera: Camera, scene: Scene, origin: Vector3) {
    this.clock = new Clock();
    this.origin = origin;
    this.lerpAnimationFrame = requestAnimationFrame(this.animate.bind(this));
  }

  private clock: Clock;
  private destPos = new Vector3(0, 0, 0); // synced
  private curPos = new Vector3(0, 0, 0);
  private startPos = new Vector3(0, 0, 0);
  private counter: number = 0;
  private slot: Slot = null;
  private lastSlot: Slot = null;
  private lastDestPos: Vector3 = new Vector3(1000, 1000, 1000);
  private lastStartPos: Vector3 = new Vector3(1000, 1000, 1000);
  public origin: Vector3;

  private createdMaterial: boolean = false;

  private material: MeshBasicMaterial;

  private lerpAnimationFrame: number;

  public mesh: Mesh;
  public root: Object3D;

  private tempStartVec: Vector3 = new Vector3(0, 0, 0);

  public load() {
    this.createMaterial();
    this.root = new Object3D();
    if (this.origin.x === 0 && this.origin.y === 0 && this.origin.z === 0) {
      this.origin.set(0, -0.1, 0);
    }
  }

  public update = function (
    startPos: Vector3,
    destPos: Vector3,
    quat: Quaternion,
    slot: number = 0,
  ) {
    this.slot = slot;
    this.destPos.x = destPos.x;
    this.destPos.y = destPos.y;
    this.destPos.z = destPos.z;

    this.tempStartVec.copy(this.origin);
    this.tempStartVec.applyQuaternion(quat);
    this.startPos.copy(startPos);
    this.startPos.add(this.tempStartVec);

    this.counter = 0;
  }.bind(this);

  private animate() {
    this.lerpAnimationFrame = requestAnimationFrame(this.animate.bind(this));
    if (!this.createdMaterial) {
      return;
    }
    const delta = this.clock.getDelta();
    const speed = 10000;
    if (
      this.counter > 2 &&
      this.lastDestPos.equals(this.destPos) &&
      this.lastStartPos.distanceTo(this.startPos) < 0.2
    ) {
      return;
    }

    this.counter++;

    if (this.lastSlot !== this.slot) {
      const pointerColor = this.slot.color ?? '#878291';
      if (this.material) {
        this.material.color.set(pointerColor);
        this.lastSlot = this.slot;
      }
    }

    this.curPos.lerp(this.destPos, (delta / 1000) * speed);

    this.lastDestPos.x = this.destPos.x;
    this.lastDestPos.y = this.destPos.y;
    this.lastDestPos.z = this.destPos.z;

    this.lastStartPos.x = this.startPos.x;
    this.lastStartPos.y = this.startPos.y;
    this.lastStartPos.z = this.startPos.z;

    this.updateMesh(this.startPos, this.curPos);
  }

  destroy() {
    if (this.material) {
      this.material.dispose();
    }
    cancelAnimationFrame(this.lerpAnimationFrame);
    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
  }

  private createMaterial() {
    const canvas = this.createTextureCanvas();
    const texture = new Texture(canvas);
    texture.needsUpdate = true;
    const pointerColor = this.slot.color ?? '#878291';
    this.material = new MeshBasicMaterial({
      map: texture,
      blending: AdditiveBlending,
      color: pointerColor,
      side: DoubleSide,
      depthWrite: true,
      transparent: true,
    });
    this.createdMaterial = true;
  }

  private updateMesh(startPos: Vector3, destPos: Vector3) {
    const curve = new LineCurve3(startPos, destPos);

    if (this.mesh && this.mesh.geometry) {
      this.mesh.geometry.dispose();
      this.root.remove(this.mesh);
    }

    const tube = new TubeGeometry(curve, 1, 0.003, 4, false);
    if (this.material) {
      this.mesh = new Mesh(tube, this.material);
      this.root.add(this.mesh);
    }
  }

  private createTextureCanvas() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1;
    canvas.height = 64;
    // set gradient
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(  0,  0,  0,0.1)');
    gradient.addColorStop(0.1, 'rgba(160,160,160,0.3)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(0.9, 'rgba(160,160,160,0.3)');
    gradient.addColorStop(1.0, 'rgba(  0,  0,  0,0.1)');
    // fill the rectangle
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    // return the just built canvas
    return canvas;
  }
}
