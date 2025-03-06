import { DEFAULT_COLOR, MATERIAL_SHININESS, TUBE_RADIAL_SEGMENTS, TUBE_RADIUS, TUBE_SEGMENTS } from '../../constants/laser';
import { LaserService } from '../../services/laser-service';
import { ServiceLocator } from '../../services/service-locator';

export class Beam {
  private THREE: any;
  private beamGeometry: any;
  private beamMesh: any;
  private beamMaterial: any;
  private laserModel: any;

  constructor(laserModel: any, participant: any) {
    this.laserModel = laserModel;

    // Replace direct static access with ServiceLocator
    const serviceLocator = ServiceLocator.getInstance();
    const laserService = serviceLocator.get('laserService') as LaserService;
    this.THREE = laserService.getTHREE();

    this.createBeam(participant);
  }

  private createBeam(participant: any) {
    this.beamMaterial = new this.THREE.MeshPhongMaterial({
      color: participant?.slot?.color || DEFAULT_COLOR,
      shininess: MATERIAL_SHININESS,
      transparent: false,
      opacity: 1.0,
    });

    const path = new this.THREE.LineCurve3(
      new this.THREE.Vector3(0, 0, 0),
      new this.THREE.Vector3(0, 0, 1),
    );

    this.beamGeometry = new this.THREE.TubeGeometry(
      path,
      TUBE_SEGMENTS,
      TUBE_RADIUS,
      TUBE_RADIAL_SEGMENTS,
      true,
    );

    this.beamMesh = new this.THREE.Mesh(this.beamGeometry, this.beamMaterial);

    if (this.laserModel?.obj3D) {
      this.laserModel.obj3D.add(this.beamMesh);
    }

    this.beamMesh.lerper = this.laserModel.addComponent('lerper');
  }

  public updatePosition(avatarPos: any, laserTarget: any) {
    const direction = new this.THREE.Vector3().subVectors(laserTarget, avatarPos);
    const length = direction.length();

    this.beamMesh.lerper.animateVector(
      this.beamMesh.position,
      avatarPos,
    );

    const beamQuaternion = new this.THREE.Quaternion().setFromUnitVectors(
      new this.THREE.Vector3(0, 0, 1),
      direction.normalize(),
    );
    this.beamMesh.lerper.animateQuaternion(
      this.beamMesh.quaternion,
      beamQuaternion,
    );

    this.beamMesh.scale.set(1, 1, length);
  }

  public dispose() {
    if (this.beamGeometry) {
      this.beamGeometry.dispose();
      this.beamGeometry = null;
    }

    if (this.beamMaterial) {
      this.beamMaterial.dispose();
      this.beamMaterial = null;
    }

    if (this.beamMesh) {
      this.laserModel.obj3D.remove(this.beamMesh);
      this.beamMesh = null;
    }
  }
}
