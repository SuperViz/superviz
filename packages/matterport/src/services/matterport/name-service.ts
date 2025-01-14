import { NO_AVATAR_LASER_HEIGHT, NAME_HEIGHT_OFFSET } from '../../common/constants/presence';
import type { Coordinates } from '../../common/types/coordinates.types';
import type { MpSdk as Matterport } from '../../common/types/matterport.types';
import type { ParticipantOn3D } from '../../types';

export class NameService {
  private names: Record<string, any> = {};
  private nameLerpers: Record<string, any> = {};
  private THREE;

  constructor(
    private matterportSdk: Matterport,
    private isNameEnabled: boolean,
    THREE: any,
  ) {
    this.THREE = THREE;
  }

  public async createName(participant: ParticipantOn3D): Promise<void> {
    if (!this.matterportSdk.Scene || !this.isNameEnabled) return;

    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const nameNode = sceneObject.addNode() as any;
    const nameComponent = nameNode.addComponent('name') as any;
    nameComponent.THREE = this.THREE;

    // Create lerper for smooth movement
    const [lerperObject] = await this.matterportSdk.Scene.createObjects(1);
    const lerperNode = lerperObject.addNode() as any;
    this.nameLerpers[participant.id] = {
      node: lerperNode,
      lerper: lerperNode.addComponent('lerper'),
    };
    lerperNode.start();

    // Create an Object3D to hold the name
    const nameObject = new this.THREE.Object3D();
    nameNode.obj3D.add(nameObject);

    const nameHeight = this.calculateNameHeight(participant);
    await nameComponent.createName(nameObject, participant.name, participant.slot, nameHeight);

    this.names[participant.id] = nameNode;
    nameNode.start();
  }

  public updateNamePosition(participantId: string, position: Coordinates): void {
    const nameNode = this.names[participantId];
    const lerper = this.nameLerpers[participantId]?.lerper;

    if (!nameNode || !lerper) return;

    const namePosition = new this.THREE.Vector3(
      position.x,
      NO_AVATAR_LASER_HEIGHT + NAME_HEIGHT_OFFSET,
      position.z,
    );
    lerper.animateVector(nameNode.obj3D.position, namePosition);
  }

  private calculateNameHeight(participant: ParticipantOn3D): number {
    return 0.3; // Keep this for the name sprite size
  }

  public destroyName(participantId: string): void {
    if (this.names[participantId]) {
      this.names[participantId].stop();
      delete this.names[participantId];
    }

    if (this.nameLerpers[participantId]) {
      this.nameLerpers[participantId].node.stop();
      delete this.nameLerpers[participantId];
    }
  }

  public destroyAll(): void {
    Object.keys(this.names).forEach(this.destroyName.bind(this));
  }
}
