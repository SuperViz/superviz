import type { Vector3 } from 'three';
import { Slot } from '../types';

const LaserPointer = function () {
  this.inputs = {
    origin: { x: 0, y: 0, z: 0 },
  };

  this.onInit = function () {
    this.THREE = this.context.three;

    // Initialize avatarName first
    this.avatarName = null;

    // Initialize geometries once
    this.sphereRadius = 0.008;
    this.sphereGeometry = new this.THREE.SphereGeometry(this.sphereRadius, 16, 16);
    this.tubeGeometry = new this.THREE.TubeGeometry(
      new this.THREE.LineCurve3(new this.THREE.Vector3(0, 0, 0), new this.THREE.Vector3(0, 0, 1)),
      1,
      0.003,
      4,
      false,
    );

    // Initialize vectors and properties
    this.destPos = new this.THREE.Vector3(0, 0, 0);
    this.curPos = new this.THREE.Vector3(0, 0, 0);
    this.startPos = new this.THREE.Vector3(0, 0, 0);
    this.tempStartPos = new this.THREE.Vector3(0, 0, 0);
    this.quat = new this.THREE.Quaternion(0, 0, 0, 0);
    this.counter = 0;
    this.slot = null;
    this.lastIndex = -1;
    this.lastDestPos = new this.THREE.Vector3(1000, 1000, 1000);
    this.lastStartPos = new this.THREE.Vector3(1000, 1000, 1000);
    this.speed = 0.95;

    // Create group and meshes once
    this.group = new this.THREE.Group();
    this.laserMesh = new this.THREE.Mesh(this.tubeGeometry);
    this.sphereMesh = new this.THREE.Mesh(this.sphereGeometry);
    this.group.add(this.laserMesh);
    this.group.add(this.sphereMesh);

    // Important: Set initial visibility
    this.group.visible = true;
    this.outputs.objectRoot = this.group;

    // Create initial materials
    this.createMaterial('#878291');

    if (this.onInitCallback) {
      this.onInitCallback();
    }
  };

  this.createMaterial = (color: string) => {
    this.createdMaterial = true;
    const pointerColor = this.slot?.color ?? color ?? '#878291';

    if (!this.material) {
      this.material = new this.THREE.MeshPhongMaterial({
        color: pointerColor,
        shininess: 60,
        transparent: false,
        side: this.THREE.DoubleSide,
        depthWrite: true,
      });

      this.sphereMaterial = new this.THREE.MeshPhongMaterial({
        shininess: 60,
        transparent: false,
        color: pointerColor,
      });

      this.laserMesh.material = this.material;
      this.sphereMesh.material = this.sphereMaterial;
    } else {
      this.material.color.set(pointerColor);
      this.sphereMaterial.color.set(pointerColor);
    }
  };

  this._updateMesh = (startPos: Vector3, destPos: Vector3) => {
    // Move group to participant position
    this.group.position.copy(startPos);

    // Calculate laser start position with origin offset
    this.tempStartPos.copy(this.inputs.origin);
    this.tempStartPos.applyQuaternion(this.quat);

    // Create laser beam from origin to destination in local space
    const localDest = new this.THREE.Vector3().copy(destPos).sub(startPos);
    const curve = new this.THREE.LineCurve3(this.tempStartPos, localDest);

    if (this.tubeGeometry) {
      this.tubeGeometry.dispose();
    }
    this.tubeGeometry = new this.THREE.TubeGeometry(curve, 1, 0.003, 4, false);
    this.laserMesh.geometry = this.tubeGeometry;

    // Position sphere at origin offset
    this.sphereMesh.position.copy(this.tempStartPos);

    if (!this.lastUpdatePos) this.lastUpdatePos = new this.THREE.Vector3();
    this.lastUpdatePos.copy(startPos);
    this.lastDestPos.copy(destPos);
  };

  this.onTick = function (tickDelta) {
    if (!this.createdMaterial) {
      return;
    }

    this.counter++;

    // Restore lerping
    this.curPos.lerp(this.destPos, (tickDelta / 1000) * this.speed);

    // Update color if slot changed
    if (this.lastIndex !== this.slot?.index) {
      if (this.material) {
        const pointerColor = this.slot?.color ?? '#878291';
        this.material.color.set(pointerColor);
        this.sphereMaterial.color.set(pointerColor);
        this.lastIndex = this.slot?.index;
      }
    }

    this._updateMesh(this.startPos, this.curPos);
    this.group.visible = this.isOn && this.shouldRenderAvatars;
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

  this.updateGeometry = (
    startPos,
    destPos,
    isOn,
    shouldRenderAvatars,
    slot: Slot,
    quat,
    nameHeight,
  ) => {
    this._doUpdateGeometry(isOn, shouldRenderAvatars, slot, quat, startPos, destPos);

    if (this.avatarName?.updateHeight && nameHeight !== undefined) {
      this.avatarName.updateHeight(nameHeight);
    }
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

  this.setNameComponent = function (nameComponent) {
    this.avatarName = nameComponent;
  };
};

export default () => {
  return new LaserPointer();
};
