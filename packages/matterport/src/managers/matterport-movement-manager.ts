import { Mode, PositionInfo } from '../types';
import type { MpSdk as Matterport, Rotation } from '../common/types/matterport.types';
import { SWEEP_DURATION } from '../common/constants/presence';

export class MatterportMovementManager {
  private isSweeping: boolean = false;
  private mpInputComponent: Matterport.Scene.IComponent;

  constructor(private readonly matterportSdk: Matterport) {
    this.addInputComponent();
  }

  private async addInputComponent(): Promise<void> {
    if (!this.matterportSdk.Scene) return;

    const [mpInputObject] = await this.matterportSdk.Scene.createObjects(1);
    const mpInputNode = mpInputObject.addNode();
    this.mpInputComponent = mpInputNode.addComponent('mp.input', {
      eventsEnabled: false,
      userNavigationEnabled: true,
    });
    mpInputNode.start();
  }

  public async moveToParticipant(participantId: string, positionInfo: PositionInfo): Promise<void> {
    if (!positionInfo) return;

    const { mode, sweep, position, rotation, floor } = positionInfo;

    if (mode === Mode.INSIDE && sweep) {
      await this.moveToSweep(sweep, rotation);
    }

    if (mode === Mode.DOLLHOUSE || mode === Mode.FLOORPLAN) {
      await this.moveToPosition(mode, position, rotation, floor);
    }
  }

  private async moveToSweep(sweepId: string, rotation: Rotation): Promise<void> {
    if (this.isSweeping) return;

    if (this.mpInputComponent) {
      this.mpInputComponent.inputs.userNavigationEnabled = false;
    }

    this.isSweeping = true;

    try {
      await this.matterportSdk.Sweep.moveTo(sweepId, {
        transitionTime: SWEEP_DURATION,
        transition: this.matterportSdk.Sweep.Transition.FLY,
        rotation: rotation,
      });
    } catch (error) {
      console.error('[SuperViz] Error when trying to sweep', error);
    } finally {
      this.isSweeping = false;
      if (this.mpInputComponent) {
        this.mpInputComponent.inputs.userNavigationEnabled = true;
      }
    }
  }

  private async moveToPosition(
    mode: Mode,
    position: any,
    rotation: Rotation,
    floor: number,
  ): Promise<void> {
    const transition = this.matterportSdk.Mode.TransitionType.FLY;

    await this.matterportSdk.Mode.moveTo(mode, {
      position,
      rotation,
      transition,
      zoom: 25,
    });

    if (mode === Mode.FLOORPLAN) {
      await this.changeFloor(floor);
    }
  }

  private async changeFloor(floor: number): Promise<void> {
    if (floor === -1) {
      await this.matterportSdk.Floor.showAll();
    } else {
      await this.matterportSdk.Floor.moveTo(floor);
    }
  }

  public destroy(): void {
    if (this.mpInputComponent) {
      this.mpInputComponent = null;
    }
  }
}
