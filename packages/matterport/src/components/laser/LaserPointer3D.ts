import PubSub from 'pubsub-js';
import { Quaternion, Vector3 } from 'three';

import type { MpSdk as Matterport } from '../../common/types/matterport.types';
import { AVATAR_LASER_HEIGHT, NO_AVATAR_LASER_HEIGHT } from '../../constants/laser';
import { LaserService } from '../../services/laser-service';
import { ServiceLocator } from '../../services/service-locator';
import { ParticipantOn3D } from '../../types';

import { Beam } from './Beam';
import { Sphere } from './Sphere';

function LaserPointer3D() {
  this.inputs = {
    participant: null as ParticipantOn3D | null,
    matterportSdk: null as Matterport | null,
    origin: { x: 0, y: 0, z: 0 },
  };

  this.laserModel = null;
  this.THREE = null;
  this.destPos = null;
  this.curPos = null;
  this.startPos = null;
  this.tempStartPos = null;
  this.quat = null;
  this.lastDestPos = null;
  this.lastStartPos = null;
  this.sphereGeometry = null;
  this.tubeGeometry = null;
  this.group = null;
  this.laserMesh = null;
  this.sphereMesh = null;
  this.material = null;
  this.sphereMaterial = null;
  this.createdMaterial = false;
  this.positionSub = null;

  this.tempVector3 = null;
  this.tempLocalPos = null;
  this.tempAvatarPos = null;
  this.tempAdjustPos = null;
  this.tempXAxis = null;
  this.tempYAxis = null;
  this.tempQuaternionX = null;
  this.tempQuaternionY = null;
  this.tempFinalQuaternion = null;
  this.intervalManager = null;
  this.myPosition = null;
  this.remotevatarPosition = null;

  this.beam = null;
  this.sphere = null;
  this.serviceLocator = null;
  this.laserService = null;

  const setupThreeObjects = () => {
    if (!this.context.three) {
      throw new Error('Laser initialization failed: THREE.js context is missing');
    }

    this.serviceLocator = ServiceLocator.getInstance();
    this.laserService = this.serviceLocator.get('laserService') as LaserService;
    this.THREE = this.laserService.getTHREE();

    // Initialize position vector
    this.tempAdjustPos = new this.THREE.Vector3();
  };

  const createSphere = () => {
    this.sphere = new Sphere(this.laserModel, this.inputs.participant);
  };

  const createBeam = () => {
    this.beam = new Beam(this.laserModel, this.inputs.participant);
  };

  const updatePosition = (e: any, payload: { participant: ParticipantOn3D }) => {
    // console.log('updatePosition', payload);
    if (!this.tempAdjustPos || !this.sphere || !this.beam || !payload.participant.laser) {
      return;
    }

    const circlePos = new Vector3(0, 0, 0);

    /* TODO calculate circle pos */
    // let circlePos = new Vector3(0.26, 0.17169901847839356, 0.22516660498395408);
    // if (payload.participant.name === 'John')
    // circlePos = new Vector3(0.12999999999999995, 0.17169901847839356, 0.22516660498395408);

    this.tempLocalPos = new Vector3(
      payload.participant.position.x,
      payload.participant.position.y,
      payload.participant.position.z,
    );

    this.tempLocalPos.sub(circlePos);

    const avatarPos = new this.THREE.Vector3(
      this.tempLocalPos.x,
      payload.participant.position.y + AVATAR_LASER_HEIGHT,
      this.tempLocalPos.z,
    );

    const laserTarget = new this.THREE.Vector3(
      payload.participant.laser.x,
      payload.participant.laser.y,
      payload.participant.laser.z,
    );

    // Update sphere position
    this.sphere.updatePosition(avatarPos);

    // Update beam
    this.beam.updatePosition(avatarPos, laserTarget);
  };

  this.onInit = () => {
    try {
      this.serviceLocator = ServiceLocator.getInstance();
      this.laserService = this.serviceLocator.get('laserService') as LaserService;
      this.laserModel = this.laserService.getLasers()[this.inputs.participant?.id];

      setupThreeObjects();
      createSphere();
      createBeam();

      // Subscribe to position updates
      this.positionSub = PubSub.subscribe(
        `PARTICIPANT_UPDATED_${this.inputs.participant?.id}`,
        updatePosition.bind(this),
      );
    } catch (error) {
      console.error('Plugin: LaserPointer3D initialization error:', error);
    }
  };

  this.destroy = () => {
    // Clean up sphere
    if (this.sphere) {
      this.sphere.dispose();
      this.sphere = null;
    }

    // Clean up beam
    if (this.beam) {
      this.beam.dispose();
      this.beam = null;
    }

    // Clean up materials
    if (this.sphereMaterial) {
      this.sphereMaterial.dispose();
      this.sphereMaterial = null;
    }

    // Clean up meshes
    if (this.sphereMesh) {
      this.laserModel.obj3D.remove(this.sphereMesh);
      this.sphereMesh = null;
    }

    // Clean up pubsub
    if (this.positionSub) {
      PubSub.unsubscribe(this.positionSub);
    }

    // Clean up references
    this.laserModel = null;
    this.THREE = null;
    this.tempAdjustPos = null;
  };
}

export default () => new LaserPointer3D();
