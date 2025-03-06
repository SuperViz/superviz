import PubSub from 'pubsub-js';
import { Vector3 } from 'three';

import type { MpSdk as Matterport } from '../../common/types/matterport.types';
import { HEIGHT_ADJUSTMENT } from '../../constants/nameLabel';
import { ServiceLocator } from '../../services/service-locator';
import type { ParticipantOn3D } from '../../types';

import { Canvas } from './Canvas';

function NameLabel() {
  this.inputs = {
    participant: null as ParticipantOn3D | null,
    matterportSdk: null as Matterport | null,
  };

  this.nameLabelModel = null;
  this.nameLabel = null;
  this.positionSub = null;
  this.THREE = null;
  this.canvas = null;

  const setupThreeObjects = () => {
    if (!this.context.three) {
      throw new Error('Laser initialization failed: THREE.js context is missing');
    }

    // Replace direct static access with ServiceLocator
    const serviceLocator = ServiceLocator.getInstance();
    const nameService = serviceLocator.get('nameService');
    this.THREE = nameService.getTHREE();

    // Initialize position vector
    this.tempAdjustPos = new this.THREE.Vector3();
  };

  const updatePosition = (e: any, payload: { participant: ParticipantOn3D }) => {
    if (!payload.participant) {
      return;
    }

    const serviceLocator = ServiceLocator.getInstance();
    const participantManager = serviceLocator.get('participantManager');

    const localPosition = participantManager.getLocalParticipantPosition.position;
    const remotePosition = payload.participant.position;

    const dx = localPosition.x - remotePosition.x;
    const dz = localPosition.z - remotePosition.z;

    // Compute the Euclidean distance
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Calculate additional height based on distance
    const additionalHeight = Math.min(
      (distance / HEIGHT_ADJUSTMENT.MAX_DISTANCE) * HEIGHT_ADJUSTMENT.MAX_ADDITIONAL_HEIGHT,
      HEIGHT_ADJUSTMENT.MAX_ADDITIONAL_HEIGHT,
    );

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

    const position = new this.THREE.Vector3(
      this.tempLocalPos.x,
      payload.participant.position.y + HEIGHT_ADJUSTMENT.BASE_OFFSET + additionalHeight,
      this.tempLocalPos.z,
    );

    this.canvas.updatePosition(position);
  };

  const createCanvas = () => {
    this.canvas = new Canvas(this.nameLabelModel, this.inputs.participant);
  };

  this.onInit = async () => {
    try {
      console.log('Plugin: NameLabel onInit - participant:', this.inputs.participant);

      // Replace direct static access with ServiceLocator
      const serviceLocator = ServiceLocator.getInstance();
      const nameService = serviceLocator.get('nameService');

      // Get the name label model from the service
      this.nameLabelModel = nameService.getNameLabels()[this.inputs.participant?.id];

      setupThreeObjects();
      createCanvas();

      // Subscribe to position updates
      this.positionSub = PubSub.subscribe(
        `PARTICIPANT_UPDATED_${this.inputs.participant?.id}`,
        updatePosition.bind(this),
      );
    } catch (error) {
      console.error('Plugin: NameLabel initialization error:', error);
    }
  };

  this.destroy = () => {
    // Clean up name label
    if (this.nameLabel) {
      this.nameLabel.dispose();
      this.nameLabel = null;
    }

    // Clean up subscription
    if (this.positionSub) {
      PubSub.unsubscribe(this.positionSub);
    }

    // Clean up references
    this.nameLabelModel = null;
    this.THREE = null;
  };
}

export default () => new NameLabel();
