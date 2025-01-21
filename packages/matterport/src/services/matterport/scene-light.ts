import type { MpSdk as Matterport } from '../../common/types/matterport.types';

export class SceneLight {
  private directionalLight: Matterport.Scene.INode;
  private ambientLight: Matterport.Scene.INode;
  private THREE;

  constructor(private readonly matterportSdk: Matterport) {}

  public async addSceneLight(): Promise<void> {
    this.directionalLight = await this.createDirectionLight();
    this.ambientLight = await this.createAmbientLight();
  }

  private async createDirectionLight(): Promise<Matterport.Scene.INode> {
    if (!this.matterportSdk.Scene) return;

    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const dirLightNode: Matterport.Scene.INode = sceneObject.addNode();
    const initial = {
      enabled: true,
      color: {
        r: 1,
        g: 1,
        b: 1,
      },
      intensity: 1.0,
      position: {
        x: 0.2,
        y: 1,
        z: 0,
      },
      target: {
        x: 0.5,
        y: 0,
        z: 0,
      },
      debug: false,
    };
    const component = dirLightNode.addComponent('mp.directionalLight', initial);
    this.THREE = component.context.three;

    dirLightNode.start();
    return dirLightNode;
  }

  private async createAmbientLight(): Promise<Matterport.Scene.INode> {
    if (!this.matterportSdk.Scene) return;

    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const ambLightNode: Matterport.Scene.INode = sceneObject.addNode();
    const initial = {
      enabled: true,
      color: { r: 1.0, g: 1, b: 1 },
      intensity: 1.0,
    };
    ambLightNode.addComponent('mp.ambientLight', initial);
    ambLightNode.start();
    return ambLightNode;
  }

  public destroy(): void {
    this.ambientLight?.stop();
    this.directionalLight?.stop();
  }

  public getTHREE() {
    return this.THREE;
  }
}
