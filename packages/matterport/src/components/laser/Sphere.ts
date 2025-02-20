import { DEFAULT_COLOR, MATERIAL_SHININESS, SPHERE_RADIUS } from '../constants/laser';
import { LaserService } from '../services/laser-service';

export class Sphere {
  private THREE: any;
  private sphereGeometry: any;
  private sphereMesh: any;
  private sphereMaterial: any;
  private laserModel: any;

  constructor(laserModel: any, participant: any) {
    this.laserModel = laserModel;
    this.THREE = LaserService.instance.getTHREE();
    this.createSphere(participant);
  }

  private createSphere(participant: any) {
    this.sphereGeometry = new this.THREE.SphereGeometry(SPHERE_RADIUS, 16, 16);

    this.sphereMaterial = new this.THREE.MeshPhongMaterial({
      color: participant?.slot?.color || DEFAULT_COLOR,
      shininess: MATERIAL_SHININESS,
      transparent: false,
      opacity: 1.0,
    });

    this.sphereMesh = new this.THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.sphereMesh.position.set(0, 0, 0);

    if (this.laserModel?.obj3D) {
      this.laserModel.obj3D.add(this.sphereMesh);
    }

    this.sphereMesh.lerper = this.laserModel.addComponent('lerper');
  }

  public updatePosition(avatarPos: any) {
    this.sphereMesh.lerper.animateVector(
      this.sphereMesh.position,
      avatarPos,
    );
  }

  public dispose() {
    if (this.sphereGeometry) {
      this.sphereGeometry.dispose();
      this.sphereGeometry = null;
    }

    if (this.sphereMaterial) {
      this.sphereMaterial.dispose();
      this.sphereMaterial = null;
    }

    if (this.sphereMesh) {
      this.laserModel.obj3D.remove(this.sphereMesh);
      this.sphereMesh = null;
    }
  }
}
