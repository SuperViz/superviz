import PubSub from 'pubsub-js';
import { Quaternion, Vector3 } from 'three';

import type { MpSdk as Matterport } from '../../common/types/matterport.types';
import { DEFAULT_AVATAR_URL, AVATARS_HEIGHT_ADJUST } from '../../constants/avatar';
import { AvatarService } from '../../services/avatar-service';
import type { ParticipantOn3D } from '../../types';

function Avatar3D() {
  this.inputs = {
    participant: null as ParticipantOn3D | null,
    matterportSdk: null as Matterport | null,
  };

  this.avatarModel = null;
  this.positionSub = null;

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
  this.intervalManager = null;
  this.myPosition = null;
  this.remotevatarPosition = null;

  const updatePosition = (e: any, payload: { participant: ParticipantOn3D }) => {
    const addedHeight = parseFloat(this.avatarModel.obj3D?.userData?.height ?? '0');
    const addY = addedHeight - AVATARS_HEIGHT_ADJUST;

    let circlePos = new Vector3(0, 0, 0);

    if (payload.participant.name === 'John') {
      circlePos = new Vector3(10000000, 0, 2);
    }

    this.tempLocalPos.set(circlePos.x, 0, circlePos.z);
    this.tempAvatarPos.set(
      payload.participant.position.x,
      0,
      payload.participant.position.z,
    );
    this.tempAdjustPos.copy(this.tempAvatarPos);

    this.tempAdjustPos.sub(this.tempLocalPos);

    this.tempAdjustPos.y = payload.participant.position.y + addY;

    this.avatarModel.lerper.animateVector(
      this.avatarModel.obj3D.position,
      this.tempAdjustPos,
    );

    // this.myPosition = localPositionInfo;
    this.remotevatarPosition = payload.participant.position;
  };

  const updateRotation = (e: any, payload: { participant: ParticipantOn3D }) => {
    // console.log('this is the rotation', rotation, ' of the participant', participantSlotIndex);

    const XVector3: Vector3 = new this.THREE.Vector3(1, 0, 0);
    const YVector3: Vector3 = new this.THREE.Vector3(0, 1, 0);
    const quaternionX: Quaternion = new this.THREE.Quaternion().setFromAxisAngle(
      XVector3,
      this.THREE.MathUtils.degToRad(-payload.participant.rotation.x),
    );

    const quaternionY: Quaternion = new this.THREE.Quaternion().setFromAxisAngle(
      YVector3,
      this.THREE.MathUtils.degToRad(payload.participant.rotation.y) + Math.PI,
    );

    this.avatarModel.lerper.animateQuaternion(
      this.avatarModel.obj3D.quaternion,
      quaternionY.multiply(quaternionX),
    );
  };

  const setupThreeObjects = () => {
    if (!this.context.three) {
      throw new Error('Avatar initialization failed: THREE.js context is missing');
    }
    this.THREE = AvatarService.instance.getTHREE();

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
  };

  const setupAvatar = () => {
    try {
      const scale: number = this.inputs.participant?.avatarConfig?.scale || 0.55;
      const height: number = this.inputs.participant?.avatarConfig?.height || 0.25;

      this.avatarModel.obj3D.rotation.set(0, 0, 0);
      this.avatarModel.obj3D.userData = {
        uuid: this.inputs.participant?.id,
        name: this.inputs.participant?.name,
        height,
      };

      this.avatarModel.lerper = this.avatarModel.addComponent('lerper');
      if (!this.avatarModel.lerper) {
        throw new Error('Failed to create lerper component');
      }

      return { scale, height };
    } catch (error) {
      this.state.hasError = true;
      this.state.errorMessage = `Avatar setup failed: ${error.message}`;
      throw error;
    }
  };

  const loadModel = (scale: number) => {
    const localScale = { x: scale, y: scale, z: scale };

    this.avatarModel.addComponent('mp.gltfLoader', {
      url: this.inputs.participant?.avatar?.model3DUrl ?? DEFAULT_AVATAR_URL,
      localScale,
      onLoaded: () => {
        console.log('Plugin: model loaded');
      },
      onError: (error) => {
        console.log('Plugin: model error', error);
      },
    });
  };

  const destroyModel = () => {
    if (this.avatarModel) {
      // Remove components
      this.avatarModel.lerper = null;
      this.avatarModel = null;
    }

    if (this.avatarModel?.obj3D) {
      this.avatarModel.obj3D.position.set(0, 0, 0);
    }

    if (this.avatarModel?.obj3D) {
      this.avatarModel.obj3D.rotation.set(0, 0, 0);
      this.avatarModel.obj3D.quaternion.identity();
    }
  };

  this.onInit = () => {
    console.log('Plugin: Avatar3D onInit');
    try {
      this.avatarModel = AvatarService.instance.getAvatars()[this.inputs.participant?.id];

      this.positionSub = PubSub.subscribe(`PARTICIPANT_UPDATED_${this.inputs.participant?.id}`, (msg, data) => {
        updatePosition.call(this, msg, data);
        updateRotation.call(this, msg, data);
      });

      setupThreeObjects();
      const { scale } = setupAvatar();
      loadModel(scale);
    } catch (error) {
      console.log('Plugin: Avatar3D error', error);
    }
  };

  this.destroy = () => {
    // Clean up in reverse order of creation
    destroyModel();

    // clean up pubsub ::
    PubSub.unsubscribe(this.positionSub);

    // Clean up cached objects
    Object.keys(this).forEach((key) => {
      if (key.startsWith('temp')) {
        this[key] = null;
      }
    });

    // Reset inputs
    this.inputs = {
      participant: null,
      matterportSdk: null,
    };
  };
}

export default () => new Avatar3D();
