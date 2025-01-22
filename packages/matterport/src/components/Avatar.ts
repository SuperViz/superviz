import { Participant } from '@superviz/sdk';
import { Box3, Vector3 } from 'three';

import { AVATARS_HEIGHT_ADJUST } from '../common/constants/presence';
import { Name } from '../common/types/avatarTypes.types';
import { Coordinates, Simple2DPoint } from '../common/types/coordinates.types';
import type { MpSdk as Matterport } from '../common/types/matterport.types';
import type { ParticipantOn3D } from '../types';

/**
 * Avatar component for Matterport scenes
 * Handles 3D avatar representation, movement, and lifecycle management
 */
function Avatar() {
  /**
   * Input configuration for the Avatar component
   * @property {string} url - URL for the 3D model
   * @property {ParticipantOn3D} participant - Participant data
   * @property {any} avatarModel - Matterport avatar model instance
   * @property {Matterport} matterportSdk - Matterport SDK instance
   * @property {MatterportEvents} matterportEvents - Matterport events handler
   * @property {Record<string, Participant>} roomParticipants - All room participants
   */
  this.inputs = {
    url: '' as string,
    participant: null as ParticipantOn3D | null,
    avatarModel: null,
    matterportSdk: null as Matterport | null,
    onCameraMove: null as ((position: any, rotation: any, sweep: any) => void) | null,
    roomParticipants: null as Record<string, Participant> | null,
  };

  /** Cached THREE.js objects for performance optimization */
  this.THREE = null;
  this.tempVector3 = null;
  this.tempLocalPos = null;
  this.tempAvatarPos = null;
  this.tempAdjustPos = null;
  this.tempXAxis = null;
  this.tempYAxis = null;
  this.tempQuaternionX = null;
  this.tempQuaternionY = null;
  this.tempFinalQuaternion = null;

  /** Avatar lifecycle states */
  const AvatarState = {
    UNINITIALIZED: 'uninitialized',
    INITIALIZING: 'initializing',
    LOADING_MODEL: 'loading_model',
    READY: 'ready',
    ERROR: 'error',
    DESTROYED: 'destroyed',
  } as const;

  /** Type for avatar states */
  type AvatarStateType = (typeof AvatarState)[keyof typeof AvatarState];

  /** Current state of the avatar */
  this.state = {
    current: AvatarState.UNINITIALIZED,
    error: null as Error | null,
    lastUpdate: Date.now(),
  };

  /**
   * Manages avatar state transitions and validation
   */
  const stateManager = {
    /**
     * Transitions avatar to a new state
     * @param {string} newState - Target state from AvatarState
     * @param {Error|null} error - Optional error information
     */
    transition: (newState: AvatarStateType, error: Error | null = null) => {
      const oldState = this.state.current;
      this.state.current = newState;
      this.state.error = error;
      this.state.lastUpdate = Date.now();

      console.log(`Avatar state transition: ${oldState} -> ${newState}`, error || '');
    },

    canUpdate: () => this.state.current === AvatarState.READY,

    assertState: (expectedState: AvatarStateType, operation: string) => {
      if (this.state.current !== expectedState) {
        throw new Error(`Cannot ${operation}: avatar is in ${this.state.current} state`);
      }
    },
  };

  // Name Management
  const nameManager = {
    create: () => {
      const nameInstance: Name = this.inputs.avatarModel.avatarName;
      const slot =
        this.inputs.participant?.slot ??
        this.inputs.roomParticipants?.[this.inputs.participant?.id]?.slot;

      const nameHeight = nameManager.calculateHeight();

      nameInstance.createName(
        this.inputs.avatarModel.obj3D,
        this.inputs.participant?.name,
        this.inputs.participant?.slot?.color || '#FF0000',
        nameHeight,
      );
    },

    calculateHeight: () => {
      const boundingBox = new this.THREE.Box3().setFromObject(this.inputs.avatarModel.obj3D);
      this.tempVector3.set(0, 0, 0);
      boundingBox.getSize(this.tempVector3);

      const threeVersion = Number(this.THREE.REVISION);
      const isDefaultAvatar = this.inputs.url?.includes('readyplayerme');

      if (threeVersion <= 146) {
        return boundingBox.min.y - this.inputs.avatarModel.position.y + this.tempVector3.y * 1.1;
      }

      return isDefaultAvatar ? this.tempVector3.y * 4.1 : this.tempVector3.y * 1.2;
    },

    destroy: () => {
      if (this.inputs.avatarModel?.avatarName) {
        this.inputs.avatarModel.avatarName.stop?.();
        this.inputs.avatarModel.avatarName = null;
      }
    },
  };

  // Position Management
  const positionManager = {
    update: (position: Coordinates, currentCirclePosition: Vector3 | null) => {
      if (!position) return;

      const addedHeight = parseFloat(this.inputs.avatarModel.obj3D?.userData?.height ?? '0');
      const addY = addedHeight - AVATARS_HEIGHT_ADJUST;

      // If no circle position provided, use zero vector
      const circlePos = currentCirclePosition || this.tempLocalPos.set(0, 0, 0);

      this.tempLocalPos.set(circlePos.x, 0, circlePos.z);
      this.tempAvatarPos.set(position.x, 0, position.z);
      this.tempAdjustPos.copy(this.tempAvatarPos);

      // Only subtract circle position if it was provided
      if (currentCirclePosition) {
        this.tempAdjustPos.sub(this.tempLocalPos);
      }

      this.tempAdjustPos.y = position.y + addY;

      this.inputs.avatarModel.lerper.animateVector(
        this.inputs.avatarModel.obj3D.position,
        this.tempAdjustPos,
      );
    },

    destroy: () => {
      if (this.inputs.avatarModel?.obj3D) {
        this.inputs.avatarModel.obj3D.position.set(0, 0, 0);
      }
    },
  };

  // Rotation Management
  const rotationManager = {
    update: (rotation: Simple2DPoint, currentCirclePosition: Vector3 | null) => {
      // If we have a circle position, we need to adjust the rotation relative to it
      if (currentCirclePosition) {
        // Calculate angle from circle position to center
        const angleToCenter = Math.atan2(currentCirclePosition.z, currentCirclePosition.x);

        // Adjust Y rotation by the angle to center
        const adjustedYRotation =
          this.THREE.MathUtils.degToRad(rotation?.y) + Math.PI + angleToCenter;

        this.tempQuaternionX.setFromAxisAngle(
          this.tempXAxis,
          this.THREE.MathUtils.degToRad(-rotation.x),
        );

        this.tempQuaternionY.setFromAxisAngle(this.tempYAxis, adjustedYRotation);
      } else {
        // Original rotation calculation when no circle position
        this.tempQuaternionX.setFromAxisAngle(
          this.tempXAxis,
          this.THREE.MathUtils.degToRad(-rotation.x),
        );

        this.tempQuaternionY.setFromAxisAngle(
          this.tempYAxis,
          this.THREE.MathUtils.degToRad(rotation?.y) + Math.PI,
        );
      }

      this.tempFinalQuaternion.copy(this.tempQuaternionY).multiply(this.tempQuaternionX);

      this.inputs.avatarModel.lerper.animateQuaternion(
        this.inputs.avatarModel.obj3D.quaternion,
        this.tempFinalQuaternion,
      );
    },

    destroy: () => {
      if (this.inputs.avatarModel?.obj3D) {
        this.inputs.avatarModel.obj3D.rotation.set(0, 0, 0);
        this.inputs.avatarModel.obj3D.quaternion.identity();
      }
    },
  };

  // Event Management
  const eventManager = {
    handleModelLoaded: () => {
      if (this.inputs.onCameraMove) {
        this.inputs.matterportSdk.Camera.getPose().then((pose) => {
          this.inputs.onCameraMove(pose.position, pose.rotation, null);
        });
      }
      nameManager.create();
    },

    destroy: () => {
      this.inputs.onCameraMove = null;
    },
  };

  // Initialization Management
  const initManager = {
    validateInputs: () => {
      if (!this.inputs.participant) {
        throw new Error('Avatar initialization failed: participant data is required');
      }
      if (!this.inputs.avatarModel) {
        throw new Error('Avatar initialization failed: avatar model is required');
      }
      if (!this.inputs.url) {
        throw new Error('Avatar initialization failed: model URL is required');
      }
    },

    setupThreeObjects: () => {
      if (!this.context.three) {
        throw new Error('Avatar initialization failed: THREE.js context is missing');
      }
      this.THREE = this.context.three;

      // Initialize cached objects
      this.tempVector3 = new this.THREE.Vector3();
      this.tempLocalPos = new this.THREE.Vector3();
      this.tempAvatarPos = new this.THREE.Vector3();
      this.tempAdjustPos = new this.THREE.Vector3();
      this.tempXAxis = new this.THREE.Vector3(1, 0, 0);
      this.tempYAxis = new this.THREE.Vector3(0, 1, 0);
      this.tempQuaternionX = new this.THREE.Quaternion();
      this.tempQuaternionY = new this.THREE.Quaternion();
      this.tempFinalQuaternion = new this.THREE.Quaternion();
    },

    setupAvatar: () => {
      try {
        const scale: number = this.inputs.participant?.avatarConfig?.scale || 0.55;
        const height: number = this.inputs.participant?.avatarConfig?.height || 0.25;

        this.inputs.avatarModel.obj3D.rotation.set(0, 0, 0);
        this.inputs.avatarModel.obj3D.userData = {
          uuid: this.inputs.participant?.id,
          name: this.inputs.participant?.name,
          height,
        };

        this.inputs.avatarModel.lerper = this.inputs.avatarModel.addComponent('lerper');
        if (!this.inputs.avatarModel.lerper) {
          throw new Error('Failed to create lerper component');
        }

        this.inputs.avatarModel.avatarName = this.inputs.avatarModel.addComponent('name');
        if (!this.inputs.avatarModel.avatarName) {
          throw new Error('Failed to create name component');
        }

        return { scale, height };
      } catch (error) {
        this.state.hasError = true;
        this.state.errorMessage = `Avatar setup failed: ${error.message}`;
        throw error;
      }
    },
  };

  // Model Management
  const modelManager = {
    initialize: () => {
      const scale: number = this.inputs.participant?.avatarConfig?.scale || 0.55;
      const height: number = this.inputs.participant?.avatarConfig?.height || 0.25;

      console.log('MODEL MANAGER - initialize - scale ', scale);
      this.inputs.avatarModel.obj3D.rotation.set(0, 0, 0);
      this.inputs.avatarModel.obj3D.userData = {
        uuid: this.inputs.participant?.id,
        name: this.inputs.participant?.name,
        height,
      };

      this.inputs.avatarModel.lerper = this.inputs.avatarModel.addComponent('lerper');
      this.inputs.avatarModel.avatarName = this.inputs.avatarModel.addComponent('name');

      return { scale, height };
    },

    load: (scale: number) => {
      stateManager.transition(AvatarState.LOADING_MODEL);
      const localScale = { x: scale, y: scale, z: scale };

      this.inputs.avatarModel.addComponent('mp.gltfLoader', {
        url: this.inputs.url,
        localScale,
        onLoaded: () => {
          stateManager.transition(AvatarState.READY);
          eventManager.handleModelLoaded();
        },
        onError: (error) => {
          stateManager.transition(AvatarState.ERROR, error);
        },
      });
    },

    destroy: () => {
      if (this.inputs.avatarModel) {
        // Remove components
        this.inputs.avatarModel.lerper = null;
        this.inputs.avatarModel.avatarName = null;
        this.inputs.avatarModel = null;
      }
    },
  };

  /**
   * Initializes the avatar component
   * Sets up THREE.js objects and loads the avatar model
   */
  this.onInit = () => {
    try {
      stateManager.transition(AvatarState.INITIALIZING);
      initManager.validateInputs();
      initManager.setupThreeObjects();
      const { scale } = initManager.setupAvatar();
      modelManager.load(scale);
    } catch (error) {
      stateManager.transition(
        AvatarState.ERROR,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  };

  /**
   * Updates avatar position and rotation
   * @param {Coordinates} position - New position coordinates
   * @param {Simple2DPoint} rotation - New rotation angles
   * @param {Vector3} currentCirclePosition - Current position in circle formation
   */
  this.update = (
    position: Coordinates,
    rotation: Simple2DPoint,
    currentCirclePosition: Vector3,
  ) => {
    if (!stateManager.canUpdate()) {
      console.warn(`Cannot update avatar in ${this.state.current} state`);
      return;
    }
    rotationManager.update(rotation, currentCirclePosition);
    positionManager.update(position, currentCirclePosition);
  };

  /**
   * Cleans up avatar resources and transitions to destroyed state
   */
  this.destroy = () => {
    if (this.state.current === AvatarState.DESTROYED) {
      return;
    }

    stateManager.transition(AvatarState.DESTROYED);

    // Clean up in reverse order of creation
    eventManager.destroy();
    modelManager.destroy();
    nameManager.destroy();
    positionManager.destroy();
    rotationManager.destroy();

    // Clean up cached objects
    Object.keys(this).forEach((key) => {
      if (key.startsWith('temp')) {
        this[key] = null;
      }
    });

    // Reset inputs
    this.inputs = {
      url: '' as string,
      participant: null,
      avatarModel: null,
      matterportSdk: null,
      onCameraMove: null,
      roomParticipants: null,
    };
  };

  /**
   * Returns current avatar state
   * @returns {Object} Copy of current state
   */
  this.getState = () => ({ ...this.state });
}

export default () => new Avatar();
