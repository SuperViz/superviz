import type { Vector3 } from 'three';
import { Slot } from '../types';

const LaserPointer = function () {
  this.inputs = {
    origin: { x: 0, y: 0, z: 0 },
  };

  this.tubeGeometry = null;
  this.group = null;
  this.sphereMaterial = null;

  this.onInit = function () {
    this.THREE = this.context.three;

    this.sphereRadius = 0.008;
    this.sphereGeometry = new this.THREE.SphereGeometry(this.sphereRadius, 16, 16);

    this.destPos = new this.THREE.Vector3(0, 0, 0);
    this.curPos = new this.THREE.Vector3(0, 0, 0);
    this.startPos = new this.THREE.Vector3(0, 0, 0);
    this.counter = 0;
    this.slot = null;
    this.lastIndex = -1;
    this.lastDestPos = new this.THREE.Vector3(1000, 1000, 1000);
    this.lastStartPos = new this.THREE.Vector3(1000, 1000, 1000);
    this.speed = 0.95;
    this.tempStartPos = new this.THREE.Vector3(0, 0, 0);
    this.quat = new this.THREE.Quaternion(0, 0, 0, 0);

    this.sphereMaterial = new this.THREE.MeshPhongMaterial({
      shininess: 60,
      transparent: false,
    });
  };

  this.onTick = function (tickDelta) {
    if (!this.createdMaterial) {
      return;
    }

    if (
      this.counter > 60 &&
      this.lastDestPos.equals(this.destPos) &&
      this.lastStartPos.distanceTo(this.startPos) < 0.2
    ) {
      return;
    }

    this.counter++;

    if (this.lastIndex !== this.slot?.index) {
      const pointerColor = '';
      if (this.material) {
        this.material.color.set(pointerColor);
        this.lastIndex = this.slot?.index;
      }
    }

    this.curPos.lerp(this.destPos, (tickDelta / 1000) * this.speed);

    this.lastDestPos.x = this.destPos.x;
    this.lastDestPos.y = this.destPos.y;
    this.lastDestPos.z = this.destPos.z;

    this.lastStartPos.x = this.startPos.x;
    this.lastStartPos.y = this.startPos.y;
    this.lastStartPos.z = this.startPos.z;

    this._updateMesh(this.startPos, this.curPos);
    this.outputs.objectRoot.visible = this.isOn && this.shouldRenderAvatars;
  };

  this.onDestroy = function () {
    if (this.material) {
      this.material.dispose();
    }
    if (this.sphereGeometry) {
      this.sphereGeometry.dispose();
    }
    if (this.sphereMaterial) {
      this.sphereMaterial.dispose();
    }
    if (this.tubeGeometry) {
      this.tubeGeometry.dispose();
    }
  };

  this.createMaterial = (color: string) => {
    this.createdMaterial = true;
    const pointerColor = this.slot?.color ?? color ?? '#878291';
    this.material = new this.THREE.MeshPhongMaterial({
      color: pointerColor,
      shininess: 60,
      transparent: false,
      side: this.THREE.DoubleSide,
      depthWrite: true,
    });
  };

  this._updateMesh = (startPos: Vector3, destPos: Vector3) => {
    this.tempStartPos.copy(this.inputs.origin);
    this.tempStartPos.applyQuaternion(this.quat);
    this.tempStartPos.add(startPos);

    if (
      this.lastUpdatePos &&
      this.tempStartPos.distanceTo(this.lastUpdatePos) < 0.001 &&
      this.lastDestPos.distanceTo(destPos) < 0.001
    ) {
      return;
    }

    const curve = new this.THREE.LineCurve3(this.tempStartPos, destPos);

    if (this.tubeGeometry) {
      this.tubeGeometry.dispose();
    }

    if (!this.group) {
      this.group = new this.THREE.Group();
    } else {
      while (this.group.children.length) {
        const child = this.group.children[0];
        this.group.remove(child);
        if (child.geometry) child.geometry.dispose();
      }
    }

    this.tubeGeometry = new this.THREE.TubeGeometry(curve, 1, 0.003, 4, false);
    const laserMesh = new this.THREE.Mesh(this.tubeGeometry, this.material);
    this.group.add(laserMesh);

    if (this.sphereGeometry) {
      this.sphereMaterial.color = this.material.color;
      const sphere = new this.THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
      sphere.position.copy(this.tempStartPos);
      this.group.add(sphere);
    }

    this.outputs.objectRoot = this.group;

    if (!this.lastUpdatePos) this.lastUpdatePos = new this.THREE.Vector3();
    this.lastUpdatePos.copy(this.tempStartPos);
  };

  this._doUpdateGeometry = (
    isOn,
    shouldRenderAvatars,
    slot: Slot,
    quat,
    startPos = { x: 0, y: 0, z: 0 },
    destPos = { x: 0, y: 0, z: 0 },
  ) => {
    this.slot = slot;
    if (!this.createdMaterial) {
      this.createMaterial(this.slot);
    }

    this.destPos.x = destPos.x;
    this.destPos.y = destPos.y;
    this.destPos.z = destPos.z;
    this.startPos.x = startPos.x;
    this.startPos.y = startPos.y;
    this.startPos.z = startPos.z;
    this.quat.set(quat.x, quat.y, quat.z, quat.w);

    this.counter = 0;

    this.isOn = isOn;
    this.shouldRenderAvatars = shouldRenderAvatars;
  };

  this.updateGeometry = (startPos, destPos, isOn, shouldRenderAvatars, slot: Slot, quat) => {
    this._doUpdateGeometry(isOn, shouldRenderAvatars, slot, quat, startPos, destPos);
  };

  this.createTextureCanvas = () => {
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
  };

  this.onEvent = function (type, data) {};

  this.onInputsUpdated = function (previous) {};
};

export default () => {
  return new LaserPointer();
};
