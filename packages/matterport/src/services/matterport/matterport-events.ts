import type { MpSdk as Matterport } from '../../common/types/matterport.types';
import type { Coordinates } from '../../common/types/coordinates.types';
import type { ParticipantDataInput } from '@superviz/sdk/dist/services/presence-3d-manager/types';
import type { Presence3DManager } from '@superviz/sdk';

export class MatterportEvents {
  private currentSweepId: string;
  private currentLocalFloorId: number;
  private currentLocalMode: Matterport.Mode.Mode;
  private currentLocalPosition: Coordinates;
  private currentLocalRotation: Coordinates;
  private currentLocalLaserDest: Coordinates;
  private isPrivate: boolean;

  constructor(
    private matterportSdk: Matterport,
    private presence3DManager: Presence3DManager,
    private localParticipantId: string,
    private adjustMyPositionToCircle: (position: Coordinates) => Coordinates,
  ) {}

  public subscribeToMatterportEvents(): void {
    this.matterportSdk.Camera.pose.subscribe(this._onLocalCameraMoveObserver);
    this.matterportSdk.Pointer.intersection.subscribe(this._onLocalMouseMoveObserver);
    this.matterportSdk.Floor.current.subscribe(this._onLocalFloorChangeObserver);
    this.matterportSdk.Mode.current.subscribe(this._onLocalModeChangeObserver);
    this.matterportSdk.Sweep.current.subscribe(this._onLocalSweepChangeObserver);
  }

  private _onLocalSweepChangeObserver = (sweep: Matterport.Sweep.ObservableSweepData): void => {
    if (!this.presence3DManager) return;

    this.currentSweepId = sweep.id;

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      sweep: this.currentSweepId,
    } as ParticipantDataInput);
  };

  private _onLocalFloorChangeObserver = (floor: Matterport.Floor.ObservableFloorData): void => {
    if (!this.presence3DManager) return;

    if (floor.id !== '') {
      this.currentLocalFloorId = parseFloat(floor.id);
    }
    if (floor.name === 'all') {
      this.currentLocalFloorId = -1;
    }

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      floor: this.currentLocalFloorId,
    } as ParticipantDataInput);
  };

  private _onLocalModeChangeObserver = (mode: Matterport.Mode.Mode): void => {
    if (!this.presence3DManager) return;

    this.currentLocalMode = mode;

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      mode: this.currentLocalMode,
    } as ParticipantDataInput);
  };

  private _onLocalCameraMoveObserver = ({ position, rotation }): void => {
    if (!this.presence3DManager) return;

    this.currentLocalPosition = this.adjustMyPositionToCircle(position);
    this.currentLocalRotation = rotation;

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      position: this.currentLocalPosition,
      rotation: this.currentLocalRotation,
      laser: this.currentLocalLaserDest,
      sweep: this.currentSweepId,
      mode: this.currentLocalMode,
      floor: this.currentLocalFloorId,
    } as ParticipantDataInput);
  };

  private _onLocalMouseMoveObserver = (intersectionData): void => {
    if (!this.presence3DManager || this.isPrivate) return;

    this.currentLocalLaserDest = intersectionData.position;

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      position: this.currentLocalPosition,
      rotation: this.currentLocalRotation,
      laser: this.currentLocalLaserDest,
      mode: this.currentLocalMode,
      sweep: this.currentSweepId,
    } as ParticipantDataInput);
  };

  public setPrivate(isPrivate: boolean): void {
    this.isPrivate = isPrivate;
  }

  public onCameraMove(position: any, rotation: any): void {
    this._onLocalCameraMoveObserver({ position, rotation });
  }

  public getCurrentPosition(): Coordinates {
    return this.currentLocalPosition;
  }

  public getCurrentRotation(): Coordinates {
    return this.currentLocalRotation;
  }

  public getCurrentSweepId(): string {
    return this.currentSweepId;
  }

  public getCurrentMode(): Matterport.Mode.Mode {
    return this.currentLocalMode;
  }

  public getCurrentFloorId(): number {
    return this.currentLocalFloorId;
  }

  public getCurrentLaserDest(): Coordinates {
    return this.currentLocalLaserDest;
  }

  public setMode(mode: Matterport.Mode.Mode): void {
    this.currentLocalMode = mode;
  }

  public setFloor(floor: number): void {
    this.currentLocalFloorId = floor;
  }
}
