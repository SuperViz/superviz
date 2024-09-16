import { Clock } from 'three';

import { Slot } from '../types';

export class AvatarName {
  constructor(viewer, userId) {
    this.clock = new Clock();
    this.viewer = viewer;
    this.userId = userId;
    this.renderFrame = requestAnimationFrame(this.render.bind(this));
  }

  private clock: Clock;
  private destPos = new THREE.Vector3(0, 0, 0); // synced
  private curScreenPos = new THREE.Vector2(0, 0);
  public slot: Slot;
  private readonly userId: string;
  private renderFrame: number;
  private viewer: any;
  private avatarModel: THREE.Mesh;

  public load(avatarModel: THREE.Mesh, name, slot: Slot): void {
    if (!avatarModel || !name || !slot) return;

    this.avatarModel = avatarModel;
    const nameEl = document.createElement('div');

    const color = slot.color;
    nameEl.setAttribute('style', `background-color:${color}`);
    nameEl.style.borderRadius = '18px';
    nameEl.style.fontSize = '22px';
    nameEl.style.zIndex = '3';
    nameEl.style.fontWeight = '600';
    nameEl.style.fontFamily = 'Open Sans';
    nameEl.style.width = 'fit-content';
    nameEl.style.position = 'absolute';

    nameEl.innerHTML += name;
    nameEl.style.marginLeft = '0px';
    nameEl.style.marginTop = '-70px';
    nameEl.style.color = slot.textColor;
    nameEl.style.padding = '2px 7px 2px 7px';

    document.body.appendChild(nameEl);
    nameEl.setAttribute('id', `avatarname_${this.userId}`);
  }

  private async render() {
    this.renderFrame = requestAnimationFrame(this.render.bind(this));
    if (this.avatarModel) {
      this.destPos = this.avatarModel.position;
    }
    const delta = this.clock.getDelta();
    const speed = 2000;
    const screenPos = this.viewer.worldToClient(this.destPos);
    let opacity = 1;

    if (screenPos) {
      this.curScreenPos.lerp(screenPos, (delta / 100) * speed);

      const top = this.curScreenPos.y;
      const left = this.curScreenPos.x;
      if (top === 0 && left === 0) {
        opacity = 0;
      }
      const nameEl = document.getElementById(`avatarname_${this.userId}`);
      if (nameEl) {
        nameEl.style.top = `${top}px`;
        nameEl.style.left = `${left}px`;
        nameEl.style.opacity = `${opacity}`;
      } else {
        console.warn('no mouse element');
      }
    }
  }

  destroy() {
    cancelAnimationFrame(this.renderFrame);
    const nameEl = document.getElementById(`avatarname_${this.userId}`);
    document.body.removeChild(nameEl);
  }
}
