import { Participant } from '@superviz/sdk';
import { Box3, Vector3 } from 'three';

import { AVATARS_HEIGHT_ADJUST } from '../common/constants/presence';
import { Name } from '../common/types/avatarTypes.types';
import { Coordinates, Simple2DPoint } from '../common/types/coordinates.types';
import type { MpSdk as Matterport } from '../common/types/matterport.types';
import { MatterportEvents } from '../services/matterport/matterport-events';
import type { ParticipantOn3D } from '../types';

function Avatar() {
  // Properties
  this.inputs = {
    url: '' as string,
    participant: null as ParticipantOn3D | null,
    avatarModel: null,
    matterportSdk: null as Matterport | null,
    matterportEvents: null as MatterportEvents | null,
    roomParticipants: null as Record<string, Participant> | null,
  };

  // Public interface
  this.onInit = () => {
    this.THREE = this.context.three;
    const { scale } = initializeAvatar();
    loadModel(scale);
  };

  this.createName = () => {
    const nameInstance: Name = this.inputs.avatarModel.avatarName;
    const slot =
      this.inputs.participant?.slot ??
      this.inputs.roomParticipants?.[this.inputs.participant?.id]?.slot;

    const boundingBox = new this.THREE.Box3().setFromObject(this.inputs.avatarModel.obj3D);
    const size = new this.THREE.Vector3(0, 0, 0);
    boundingBox.getSize(size);

    const nameHeight = calculateNameHeight(boundingBox, size);

    console.log(this.inputs.participant);
    nameInstance.createName(
      this.inputs.avatarModel.obj3D,
      this.inputs.participant?.name,
      this.inputs.participant?.slot?.color || '#FF0000',
      nameHeight,
    );
  };

  this.update = (
    position: Coordinates,
    rotation: Simple2DPoint,
    currentCirclePosition: Vector3,
  ) => {
    const quaternion = this.calculateRotation(rotation);
    this.updatePosition(position, currentCirclePosition);
  };

  this.calculateRotation = (rotation: Simple2DPoint) => {
    const XVector3 = new this.THREE.Vector3(1, 0, 0);
    const YVector3 = new this.THREE.Vector3(0, 1, 0);

    const quaternionX = new this.THREE.Quaternion().setFromAxisAngle(
      XVector3,
      this.THREE.MathUtils.degToRad(-rotation.x),
    );
    const quaternionY = new this.THREE.Quaternion().setFromAxisAngle(
      YVector3,
      this.THREE.MathUtils.degToRad(rotation?.y) + Math.PI,
    );

    const finalQuaternion = quaternionY.multiply(quaternionX);
    this.inputs.avatarModel.lerper.animateQuaternion(
      this.inputs.avatarModel.obj3D.quaternion,
      finalQuaternion,
    );
  };

  this.updatePosition = (position: Coordinates, currentCirclePosition: Vector3) => {
    const addedHeight = parseFloat(this.inputs.avatarModel.obj3D?.userData?.height ?? '0');
    const addY = addedHeight - AVATARS_HEIGHT_ADJUST;

    const localPosVec = new this.THREE.Vector3(currentCirclePosition.x, 0, currentCirclePosition.z);
    const avatarPosVec = new this.THREE.Vector3(position?.x, 0, position?.z);
    const adjustPosVec = avatarPosVec.sub(localPosVec);
    adjustPosVec.y = position.y + addY;

    this.inputs.avatarModel.lerper.animateVector(
      this.inputs.avatarModel.obj3D.position,
      adjustPosVec,
    );
  };

  this.destroy = () => {
    // Cleanup logic here
  };

  // Private functions
  const initializeAvatar = () => {
    const scale: number = this.inputs.participant?.avatarConfig?.scale || 0.55;
    const height: number = this.inputs.participant?.avatarConfig?.height || 0.25;

    this.inputs.avatarModel.obj3D.rotation.set(0, 0, 0);
    this.inputs.avatarModel.obj3D.userData = {
      uuid: this.inputs.participant?.id,
      name: this.inputs.participant?.name,
      height,
    };

    this.inputs.avatarModel.lerper = this.inputs.avatarModel.addComponent('lerper');
    this.inputs.avatarModel.avatarName = this.inputs.avatarModel.addComponent('name');

    return { scale, height };
  };

  const loadModel = (scale: number) => {
    const localScale = { x: scale, y: scale, z: scale };

    this.inputs.avatarModel.addComponent('mp.gltfLoader', {
      url: this.inputs.url,
      localScale,
      onLoaded: () => {
        if (this.inputs.matterportEvents) {
          this.inputs.matterportSdk.Camera.getPose().then((pose) => {
            this.inputs.matterportEvents.onCameraMove(pose.position, pose.rotation);
          });
        }
        this.createName();
      },
    });
  };

  const calculateNameHeight = (boundingBox: Box3, size: Vector3): number => {
    const threeVersion = Number(this.THREE.REVISION);
    const isDefaultAvatar = this.inputs.url?.includes('readyplayerme');

    if (threeVersion <= 146) {
      return boundingBox.min.y - this.inputs.avatarModel.position.y + size.y * 1.1;
    }

    return isDefaultAvatar ? size.y * 4.1 : size.y * 1.2;
  };
}

export default () => {
  return new Avatar();
};
