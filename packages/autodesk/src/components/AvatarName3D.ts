import { Shape } from 'three';

import { Slot } from '../types';

export class AvatarName {
  constructor(name: string, slot: Slot, height: number, viewer: any) {
    this.name = name;
    this.viewer = viewer;
    if (slot) {
      this.backgroundColor = slot.color;
      this.textColor = slot.textColor;
    } else {
      const firstColor = '#878291';
      // eslint-disable-next-line prefer-destructuring
      this.textColor = '#fff';
      this.backgroundColor = firstColor;
    }
    this.height = height;
    this.slot = slot;
  }

  public mesh: THREE.Mesh;
  private readonly name: string;
  private readonly backgroundColor: string;
  private readonly textColor: string;

  private readonly height: number;
  public slot: Slot;
  private viewer: any;

  private renderFrame: number;
  private curQuaternion: THREE.Quaternion;

  public load = async () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      // @ts-ignore
      window._typeface_js = { faces: THREE.FontUtils.faces, loadFace: THREE.FontUtils.loadFace };

      script.setAttribute(
        'src',
        'https://production.storage.superviz.com/static/fonts/OpenSans.js',
      );

      script.onload = async () => {
        const mesh = await this.createTextGeometry(this.name, this.textColor);
        mesh.position.set(0, this.height, 0);
        this.mesh = mesh;
        this.renderFrame = requestAnimationFrame(this.render.bind(this));
        resolve(mesh);
      };
      document.body.appendChild(script);
    });
  };

  private createTextGeometry = async (text: string, color: string) => {
    // @ts-ignore
    const geometry = new THREE.TextGeometry(text, {
      font: 'open sans',
      size: 0.08,
      height: 0,
      curveSegments: 3,
    });

    geometry.computeBoundingBox();
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.geometry.center();

    this.createBackground(mesh, this.backgroundColor);
    return mesh;
  };

  private createBackground = async (mesh: THREE.Mesh, color: string) => {
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3(0, 0, 0);
    boundingBox.getSize(size);
    const { x, y } = size;

    // @ts-ignore
    const marginX = 0.12;
    const marginY = 0.06;
    const xStart = -(x / 2 + marginX / 2);
    const yStart = -(y / 2 + marginY / 2) - 0.002; // 0.01 to center text
    const width = x + marginX;
    const height = y + marginY;
    const radius = 0.078;

    const shape = new Shape();
    shape.moveTo(xStart, yStart + radius);
    shape.lineTo(xStart, yStart + height - radius);
    shape.quadraticCurveTo(xStart, yStart + height, xStart + radius, yStart + height);
    shape.lineTo(xStart + width - radius, yStart + height);
    shape.quadraticCurveTo(
      xStart + width,
      yStart + height,
      xStart + width,
      yStart + height - radius,
    );
    shape.lineTo(xStart + width, yStart + radius);
    shape.quadraticCurveTo(xStart + width, yStart, xStart + width - radius, yStart);
    shape.lineTo(xStart + radius, yStart);
    shape.quadraticCurveTo(xStart, yStart, xStart, yStart + radius);
    // @ts-ignore
    const geometry = new THREE.ShapeGeometry(shape);

    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    mesh.add(plane);
    plane.position.set(0, 0, -0.01);
  };

  private render() {
    this.renderFrame = requestAnimationFrame(this.render.bind(this));
    if (this.viewer && this.mesh) {
      const camera = this.viewer.getCamera();

      // @ts-ignore
      this.curQuaternion = this.mesh.parent.quaternion
        .clone()
        // @ts-ignore
        .invert()
        .multiply(camera.quaternion.clone());

      this.mesh.setRotationFromQuaternion(this.curQuaternion);
    }
  }

  public destroy() {
    cancelAnimationFrame(this.renderFrame);
  }
}
