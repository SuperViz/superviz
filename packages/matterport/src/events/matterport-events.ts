import type { Presence3DManager } from '@superviz/sdk';
import type { ParticipantDataInput } from '@superviz/sdk/dist/services/presence-3d-manager/types';
import PubSub from 'pubsub-js';

import type { Coordinates } from '../common/types/coordinates.types';
import type { MpSdk as Matterport } from '../common/types/matterport.types';
import { Presence3dEvents } from '../types';

export class MatterportEvents {
  private currentSweepId: string;
  private currentLocalFloorId: number;
  private currentLocalMode: Matterport.Mode.Mode;
  private currentLocalPosition: Coordinates;
  private currentLocalRotation: Coordinates;
  private currentLocalLaserDest: Coordinates;

  constructor(
    private matterportSdk: Matterport,
    private presence3DManager: Presence3DManager | null,
    private getLocalParticipantId: () => string,
    private isPrivate: boolean,
  ) {
    this.matterportSdk = matterportSdk;
    this.presence3DManager = presence3DManager;
    this.getLocalParticipantId = getLocalParticipantId;
    this.isPrivate = isPrivate;

    PubSub.subscribe(Presence3dEvents.LOCAL_MODE_CHANGED, this.onLocalModeChange.bind(this));
    PubSub.subscribe(Presence3dEvents.LOCAL_FOLLOW_PARTICIPANT_CHANGED, this.onLocalFollowParticipantChange.bind(this));
  }

  private onLocalModeChange = (e: any, payload: { localmode: string }) => {
    console.log('onLocalModeChange', payload.localmode);
    // this.currentLocalMode = payload.localmode;
  };

  private onLocalFollowParticipantChange = (e: any, payload: { participantId: string }) => {
    console.log('onLocalFollowParticipantChange', payload.participantId);
    // this.localFollowParticipantId = payload.participantId;
  };

  public subscribeToMatterportEvents(): void {
    this.matterportSdk.Camera.pose.subscribe(this._onLocalCameraMoveObserver);
    this.matterportSdk.Pointer.intersection.subscribe(this._onLocalMouseMoveObserver);
    this.matterportSdk.Floor.current.subscribe(this._onLocalFloorChangeObserver);
    this.matterportSdk.Mode.current.subscribe(this._onLocalModeChangeObserver);
    this.matterportSdk.Sweep.current.subscribe(this._onLocalSweepChangeObserver);
  }

  public _onLocalCameraMoveObserver = ({ position, rotation }): void => {
    const localParticipantId = this.getLocalParticipantId();

    if (!this.presence3DManager || !localParticipantId) return;

    this.currentLocalPosition = position;
    this.currentLocalRotation = rotation;

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: localParticipantId,
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

    const localParticipantId = this.getLocalParticipantId();
    this.presence3DManager.updatePresence3D({
      id: localParticipantId,
      position: this.currentLocalPosition,
      rotation: this.currentLocalRotation,
      laser: this.currentLocalLaserDest,
      mode: this.currentLocalMode,
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

    const localParticipantId = this.getLocalParticipantId();
    this.presence3DManager.updatePresence3D({
      id: localParticipantId,
      floor: this.currentLocalFloorId,
    } as ParticipantDataInput);
  };

  private _onLocalModeChangeObserver = (mode: Matterport.Mode.Mode): void => {
    if (!this.presence3DManager) return;

    this.currentLocalMode = mode;

    if (this.isPrivate) return;

    const localParticipantId = this.getLocalParticipantId();
    this.presence3DManager.updatePresence3D({
      id: localParticipantId,
      mode: this.currentLocalMode,
    } as ParticipantDataInput);
  };

  private _onLocalSweepChangeObserver = (sweep: Matterport.Sweep.ObservableSweepData): void => {
    if (!this.presence3DManager) return;

    this.currentSweepId = sweep.id;

    if (this.isPrivate) return;

    const localParticipantId = this.getLocalParticipantId();
    this.presence3DManager.updatePresence3D({
      id: localParticipantId,
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

  public setPresence3DManager(presence3DManager: Presence3DManager): void {
    this.presence3DManager = presence3DManager;
  }
}
