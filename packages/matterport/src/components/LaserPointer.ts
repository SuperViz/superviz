import type { Vector3 } from 'three';

import {
  MAX_NAME_HEIGHT,
  MIN_DIST_SQUARED,
  MIN_NAME_HEIGHT,
  AVATAR_LASER_HEIGHT_OFFSET,
} from '../common/constants/presence';
import { Coordinates } from '../common/types/coordinates.types';
import { Slot } from '../types';
/**
 * Constants for laser pointer configuration
 */
const SPHERE_RADIUS = 0.008;
const TUBE_SEGMENTS = 4;
const TUBE_RADIUS = 0.003;
const TUBE_RADIAL_SEGMENTS = 1;
const DEFAULT_COLOR = '#878291';
const MATERIAL_SHININESS = 60;
const LERP_SPEED = 0.95;
const INITIAL_POSITION = { x: 1000, y: 1000, z: 1000 };

/**
 * LaserPointer component for Matterport scenes
 * Creates and manages a laser pointer visualization with a sphere at its origin
 * and a tube extending to the target position
 */
function LaserPointer() {
  /**
   * Input properties for the laser pointer
   * @property {Object} origin - The origin point of the laser in local space
   */
  this.inputs = {
    origin: { x: 0, y: 0, z: 0 },
    maxDistanceSquared: 0,
  };

  /** THREE.js scene objects */
  this.THREE = null;
  this.group = null;
  this.laserMesh = null;
  this.sphereMesh = null;
  this.material = null;
  this.sphereMaterial = null;

  /** Geometry properties */
  this.sphereRadius = SPHERE_RADIUS;
  this.sphereGeometry = null;
  this.tubeGeometry = null;

  /** State properties */
  this.destPos = null;
  this.curPos = null;
  this.startPos = null;
  this.tempStartPos = null;
  this.quat = null;
  this.counter = 0;
  this.slot = null;
  this.lastIndex = -1;
  this.lastDestPos = null;
  this.lastStartPos = null;
  this.lastUpdatePos = null;
  this.speed = LERP_SPEED;
  this.isOn = false;
  this.shouldRenderAvatars = false;
  this.createdMaterial = false;

  /** Associated components */
  this.avatarName = null;

  /**
   * Initializes the laser pointer component
   * Sets up THREE.js objects, geometries, and materials
   */
  this.onInit = () => {
    this.THREE = this.context.three;
    initializeVectors();
    initializeGeometries();
    initializeMeshes();

    if (this.onInitCallback) {
      this.onInitCallback();
    }
  };

  /**
   * Updates the laser pointer on each frame
   * @param {number} tickDelta - Time elapsed since last tick in milliseconds
   */
  this.onTick = (tickDelta) => {
    if (!this.createdMaterial) return;

    this.counter++;
    updatePosition(tickDelta);
    updateColor();
    updateMesh(this.startPos, this.curPos);
    this.group.visible = this.isOn && this.shouldRenderAvatars;
  };

  /**
   * Cleans up resources when component is destroyed
   */
  this.onDestroy = () => {
    disposeResources();
  };

  /**
   * Updates the laser pointer's geometry and visibility
   * @param {Vector3} startPos - Starting position of the laser
   * @param {Vector3} destPos - Target position of the laser
   * @param {boolean} isOn - Whether the laser should be visible
   * @param {boolean} shouldRenderAvatars - Whether avatars should be rendered
   * @param {Slot} slot - Participant slot information
   * @param {Quaternion} quat - Rotation quaternion
   * @param {number} nameHeight - Height for name label positioning
   */
  this.updateGeometry = (startPos, destPos, isOn, shouldRenderAvatars, slot, quat, nameHeight) => {
    doUpdateGeometry(isOn, shouldRenderAvatars, slot, quat, startPos, destPos);

    if (this.avatarName?.updateHeight && nameHeight !== undefined) {
      this.avatarName.updateHeight(nameHeight);
    }
  };

  /**
   * Sets the name component associated with this laser pointer
   * @param {Object} nameComponent - The name label component to attach
   */
  this.setNameComponent = (nameComponent) => {
    this.avatarName = nameComponent;
  };

  /**
   * Calculates the appropriate height for the name label based on distance from camera
   */
  this.calculateNameHeight = (position: Coordinates, cameraPosition: Coordinates): number => {
    const dx = cameraPosition.x - position.x;
    const dz = cameraPosition.z - position.z;
    const distanceSquared = dx * dx + dz * dz;

    return (
      MIN_NAME_HEIGHT +
      (Math.min(Math.max(distanceSquared - MIN_DIST_SQUARED, 0), this.inputs.maxDistanceSquared) /
        this.inputs.maxDistanceSquared) *
        (MAX_NAME_HEIGHT - MIN_NAME_HEIGHT)
    );
  };

  // Private methods

  /**
   * Initializes vector objects used for position tracking
   */
  const initializeVectors = () => {
    this.destPos = new this.THREE.Vector3(0, 0, 0);
    this.curPos = new this.THREE.Vector3(0, 0, 0);
    this.startPos = new this.THREE.Vector3(0, 0, 0);
    this.tempStartPos = new this.THREE.Vector3(0, 0, 0);
    this.quat = new this.THREE.Quaternion(0, 0, 0, 0);
    this.lastDestPos = new this.THREE.Vector3(
      INITIAL_POSITION.x,
      INITIAL_POSITION.y,
      INITIAL_POSITION.z,
    );
    this.lastStartPos = new this.THREE.Vector3(
      INITIAL_POSITION.x,
      INITIAL_POSITION.y,
      INITIAL_POSITION.z,
    );
  };

  /**
   * Creates the sphere and tube geometries for the laser pointer
   */
  const initializeGeometries = () => {
    this.sphereGeometry = new this.THREE.SphereGeometry(SPHERE_RADIUS, 16, 16);
    this.tubeGeometry = new this.THREE.TubeGeometry(
      new this.THREE.LineCurve3(new this.THREE.Vector3(0, 0, 0), new this.THREE.Vector3(0, 0, 1)),
      TUBE_RADIAL_SEGMENTS,
      TUBE_RADIUS,
      TUBE_SEGMENTS,
      false,
    );
  };

  /**
   * Creates and initializes the mesh objects for the laser pointer
   */
  const initializeMeshes = () => {
    this.group = new this.THREE.Group();
    this.laserMesh = new this.THREE.Mesh(this.tubeGeometry);
    this.sphereMesh = new this.THREE.Mesh(this.sphereGeometry);
    this.group.add(this.laserMesh);
    this.group.add(this.sphereMesh);
    this.group.visible = true;
    this.outputs.objectRoot = this.group;
    createMaterial('#878291');
  };

  /**
   * Updates the current position using linear interpolation
   * @param {number} tickDelta - Time elapsed since last tick
   */
  const updatePosition = (tickDelta) => {
    this.curPos.lerp(this.destPos, (tickDelta / 1000) * this.speed);
  };

  /**
   * Updates the laser pointer's color based on the slot color
   */
  const updateColor = () => {
    if (this.lastIndex !== this.slot?.index) {
      if (this.material) {
        const pointerColor = this.slot?.color ?? '#878291';
        this.material.color.set(pointerColor);
        this.sphereMaterial.color.set(pointerColor);
        this.lastIndex = this.slot?.index;
      }
    }
  };

  /**
   * Disposes of THREE.js resources to prevent memory leaks
   */
  const disposeResources = () => {
    if (this.material) this.material.dispose();
    if (this.sphereGeometry) this.sphereGeometry.dispose();
    if (this.sphereMaterial) this.sphereMaterial.dispose();
    if (this.tubeGeometry) this.tubeGeometry.dispose();
  };

  /**
   * Creates or updates the materials for the laser pointer and sphere
   * @param {string} color - The color to apply to the materials
   */
  const createMaterial = (color: string) => {
    this.createdMaterial = true;
    const pointerColor = this.slot?.color ?? color ?? DEFAULT_COLOR;

    if (!this.material) {
      this.material = new this.THREE.MeshPhongMaterial({
        color: pointerColor,
        shininess: MATERIAL_SHININESS,
        transparent: false,
        side: this.THREE.DoubleSide,
        depthWrite: true,
      });

      this.sphereMaterial = new this.THREE.MeshPhongMaterial({
        shininess: MATERIAL_SHININESS,
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

  /**
   * Updates the mesh geometry based on start and destination positions
   * @param {Vector3} startPos - Starting position of the laser
   * @param {Vector3} destPos - Target position of the laser
   */
  const updateMesh = (startPos: Vector3, destPos: Vector3) => {
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

  /**
   * Updates the geometry state and position information
   * @param {boolean} isOn - Whether the laser should be visible
   * @param {boolean} shouldRenderAvatars - Whether avatars should be rendered
   * @param {Slot} slot - Participant slot information
   * @param {Quaternion} quat - Rotation quaternion
   * @param {Vector3} startPos - Starting position of the laser
   * @param {Vector3} destPos - Target position of the laser
   */
  const doUpdateGeometry = (
    isOn,
    shouldRenderAvatars,
    slot: Slot,
    quat,
    startPos = { x: 0, y: 0, z: 0 },
    destPos = { x: 0, y: 0, z: 0 },
  ) => {
    this.slot = slot;
    if (!this.createdMaterial) {
      createMaterial(this.slot);
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
}

export default () => {
  return new LaserPointer();
};
