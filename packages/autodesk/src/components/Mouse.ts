import { Clock } from 'three';

import { Slot } from '../types';

const distanceBetween = (v1, v2) => {
  const dx = v1.x - v2.x;
  const dy = v1.y - v2.y;
  const dz = v1.z - v2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};
export class Mouse {
  constructor(viewer, userId) {
    this.clock = new Clock();
    this.viewer = viewer;
    this.userId = userId;
    this.renderFrame = requestAnimationFrame(this.render.bind(this));
    this.renderDivWrapper();
  }

  private clock: Clock;
  private destPos = new THREE.Vector3(0, 0, 0); // synced
  private curScreenPos = new THREE.Vector2(0, 0);
  public slot: Slot = null;
  private userId: any;
  private renderFrame: number;
  private viewer: any;
  private mousesWrapper: HTMLDivElement;

  public async load(name: string, slot: Slot): Promise<THREE.Object3D> {
    if (!name || slot === undefined) return;

    return new Promise(() => {
      const svg = `https://production.cdn.superviz.com/static/mouse-pointers/${slot.colorName}.svg`;

      const mouseEl = document.createElement('div');
      mouseEl.setAttribute('id', `mouse_${this.userId}`);
      mouseEl.setAttribute('style', `background-image:url('${svg}')`);
      mouseEl.style.position = 'absolute';
      mouseEl.style.zIndex = '3';
      mouseEl.style.width = '15px';
      mouseEl.style.height = '15px';
      mouseEl.style.pointerEvents = 'none';
      mouseEl.style.transition = 'all 75ms ease';
      mouseEl.style.top = '-100px';
      mouseEl.style.left = '-100px';

      this.mousesWrapper.appendChild(mouseEl);

      const nameEl = document.createElement('div');

      if (!name.trim().length) return;

      const color = slot?.color ?? '#878291';
      nameEl.setAttribute('style', `background-color:${color}`);
      nameEl.style.borderRadius = '30px';
      nameEl.style.fontSize = '14px';
      nameEl.style.fontWeight = '700';
      nameEl.style.zIndex = '3';
      nameEl.style.fontWeight = '600';
      nameEl.style.fontFamily = 'Open Sans';
      nameEl.style.width = 'fit-content';
      nameEl.style.whiteSpace = 'nowrap';

      nameEl.innerHTML += name;
      nameEl.style.marginLeft = '12px';
      nameEl.style.marginTop = '9px';
      nameEl.style.pointerEvents = 'none';

      nameEl.style.color = slot?.textColor ?? '#fff';
      nameEl.style.padding = '2px 8px 2px 8px';

      mouseEl.appendChild(nameEl);
    });
  }

  public update = (destPos: THREE.Vector3, slot: Slot) => {
    if (slot !== undefined) {
      this.slot = slot;
    }

    if (!destPos || (destPos.x === 0 && destPos.y === 0 && destPos.z === 0)) return;

    this.destPos.x = destPos.x;
    this.destPos.y = destPos.y;
    this.destPos.z = destPos.z;
  };

  public destroy() {
    cancelAnimationFrame(this.renderFrame);
    const mouseEl = document.getElementById(`mouse_${this.userId}`);
    mouseEl.remove();
  }

  private async render() {
    this.renderDivWrapper();
    this.renderFrame = requestAnimationFrame(this.render.bind(this));
    if (this.destPos.x === 0 && this.destPos.y === 0) {
      return;
    }

    const delta = this.clock.getDelta();
    const speed = 2000;
    const screenPos = this.viewer.worldToClient(this.destPos);
    let opacity = 1;
    // check occlusion
    const localPoint3D = this.viewer.utilities.getHitPoint(
      screenPos.x / this.mousesWrapper.clientWidth,
      screenPos.y / this.mousesWrapper.clientHeight,
    );
    if (localPoint3D) {
      const localPosition = this.viewer.navigation.getPosition();
      const distanceLocally = distanceBetween(localPoint3D, localPosition);
      const distanceOriginal = distanceBetween(this.destPos, localPosition);

      if (Math.abs(distanceOriginal - distanceLocally) > 1) {
        opacity = 0.2;
      }
    }

    if (screenPos) {
      this.curScreenPos.lerp(screenPos, (delta / 100) * speed);

      const top = this.curScreenPos.y;
      const left = this.curScreenPos.x;

      if (top === 0 && left === 0) {
        opacity = 0;
      }

      const mouseEl = document.getElementById(`mouse_${this.userId}`);

      if (mouseEl) {
        mouseEl.style.top = `${top}px`;
        mouseEl.style.left = `${left}px`;
        mouseEl.style.opacity = `${opacity}`;
      } else {
        console.warn('no mouse element');
      }
    }
  }

  private renderDivWrapper(): void {
    const canvasRect = this.viewer.canvas.getBoundingClientRect();
    let wrapper = document.getElementById('superviz-autodesk-mouse-wrapper') as HTMLDivElement;

    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'superviz-autodesk-mouse-wrapper';
    }

    wrapper.style.position = 'absolute';
    wrapper.style.top = `${this.viewer.canvas.offsetTop}px`;
    wrapper.style.left = `${this.viewer.canvas.offsetLeft}px`;
    wrapper.style.width = `${canvasRect.width}px`;
    wrapper.style.height = `${canvasRect.height}px`;
    wrapper.style.pointerEvents = 'none';
    wrapper.style.overflow = 'hidden';

    if (this.viewer.canvas.parentElement.style.position === 'static') {
      this.viewer.canvas.parentElement.style.position = 'relative';
    }

    if (!document.getElementById('superviz-autodesk-mouse-wrapper')) {
      this.viewer.canvas.parentElement.appendChild(wrapper);
    }

    this.mousesWrapper = wrapper;
  }
}
