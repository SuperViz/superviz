const Lerper = function () {
  this.onInit = function () {
    this.THREE = this.context.three;

    this.curVector = new this.THREE.Vector3(0, 0, 0);
    this.destVector = new this.THREE.Vector3(0, 0, 0);

    this.curQuaternion = new this.THREE.Quaternion(0, 0, 0, 0);
    this.destQuaternion = new this.THREE.Quaternion(0, 0, 0, 0);

    this.vectorToSet = null;
    this.quatToSet = null;

    this.vectorCounter = 0;
    this.quatCounter = 0;

    this.speed = 1.25;
  };

  this.onTick = function (tickDelta) {
    if (this.vectorToSet) {
      if (this.vectorToSet.equals(this.destVector) && this.vectorCounter > 120) {
        return;
      }
      this.vectorCounter++;
      this.curVector.lerp(this.destVector, (tickDelta / 1000) * this.speed);
      this.vectorToSet.set(this.curVector.x, this.curVector.y, this.curVector.z);
    }

    if (this.quatToSet) {
      if (this.quatToSet.equals(this.destQuaternion) && this.quatCounter > 120) {
        return;
      }
      this.quatCounter++;
      this.curQuaternion.slerp(this.destQuaternion, (tickDelta / 1000) * this.speed);
      this.quatToSet.set(
        this.curQuaternion.x,
        this.curQuaternion.y,
        this.curQuaternion.z,
        this.curQuaternion.w,
      );
    }
  };

  this.animateVector = function (vectorToSet, destVector) {
    this.vectorCounter = 0;
    this.destVector = destVector;
    this.vectorToSet = vectorToSet;
  };

  this.animateQuaternion = function (quatToSet, destQuaternion) {
    this.quatCounter = 0;
    this.destQuaternion = destQuaternion;
    this.quatToSet = quatToSet;
  };

  this.onEvent = function () {};

  this.onInputsUpdated = function () {};

  this.onDestroy = function () {};
};

export default () => {
  return new Lerper();
};
