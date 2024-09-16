import { Clock, Vector3, SpriteMaterial, Object3D, Scene, Sprite } from 'three';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

import { Colors, TextColors } from '../common/types/colors.types';
import { Slot } from '../types';

export class Mouse {
  constructor(scene: Scene) {
    this.clock = new Clock();
    this.scene = scene;
    this.lerpAnimationFrame = requestAnimationFrame(this.animate.bind(this));
  }

  private clock: Clock;
  private destPos = new Vector3(0, 0, 0); // synced
  private curPos = new Vector3(0, 0, 0);
  private counter: number = 0;
  public slot: Slot = null;
  private lastSlot: Slot = null;
  private lastDestPos: Vector3 = new Vector3(1000, 1000, 1000);
  public origin: Vector3;

  private scene: Scene;

  private lerpAnimationFrame: number;

  public textMesh: Object3D;
  public arrowMesh: Object3D;
  public root: Object3D;
  private backgroundMaterial: SpriteMaterial;

  public async load(name: string, slot: Slot): Promise<Object3D> {
    this.root = new Object3D();
    this.slot = slot;

    if (name.trim().length) {
      const font = new FontFace(
        'OpenSans-SemiBold',
        'url(https://superviz2homologmediaserver.s3.amazonaws.com/static/fonts/OpenSans-SemiBold.woff)',
      );
      await font.load();
      document.fonts.add(font);
      this.textMesh = this.createTextGeometry(name, slot.color) as unknown as Object3D;
      this.textMesh.position.set(0, 0, 0);

      this.root.add(this.textMesh);
    }

    this.arrowMesh = await this.createArrowGeometry(slot);
    this.root.add(this.arrowMesh);

    this.scene.add(this.root);
    return this.root;
  }

  public update = function (destPos: Vector3, colorIndex: number = 0) {
    if (!destPos || colorIndex === undefined) return;

    this.colorIndex = colorIndex;

    this.destPos.x = destPos.x;
    this.destPos.y = destPos.y;
    this.destPos.z = destPos.z;

    this.counter = 0;
  }.bind(this);

  private async animate() {
    this.lerpAnimationFrame = requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();
    const speed = 10000;
    if (this.counter > 30 && this.lastDestPos.equals(this.destPos)) {
      return;
    }

    this.counter++;

    if (this.slot !== undefined && this.lastSlot !== this.slot) {
      // update color
      if (this.backgroundMaterial) {
        const color = new THREE.Color(this.slot?.color ?? '#878291');
        this.backgroundMaterial.color.set(color);
        this.lastSlot = this.slot;
        this.root.remove(this.arrowMesh);
        this.arrowMesh = await this.createArrowGeometry(this.slot);
        this.root.add(this.arrowMesh);
      }
    }

    this.curPos.lerp(this.destPos, (delta / 1000) * speed);

    this.lastDestPos.x = this.destPos.x;
    this.lastDestPos.y = this.destPos.y;
    this.lastDestPos.z = this.destPos.z;

    this.root.position.copy(this.curPos);
  }

  destroy() {
    if (this.backgroundMaterial) {
      this.backgroundMaterial.dispose();
    }
    cancelAnimationFrame(this.lerpAnimationFrame);
    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
  }

  createTextGeometry = (text: string, color: string) => {
    const scale = 0.005;
    const textColor = this.slot?.textColor ?? '#fff';
    const backgroundColor = color;
    const myText = new SpriteText(text, 0.1);
    myText.color = textColor;
    myText.padding = 2.7;
    myText.borderRadius = 8;
    myText.backgroundColor = backgroundColor;
    myText.fontFace = 'OpenSans-SemiBold';
    myText.fontSize = 120;
    myText.scale.set(myText.scale.x * scale, myText.scale.y * scale, myText.scale.z * scale);
    myText.material.sizeAttenuation = false;
    myText.material.depthTest = false;
    myText.center.set(-0.15, 1.0);
    return myText;
  };

  createArrowGeometry = async (slot: Slot): Promise<Sprite> => {
    if (!slot) return;

    return new Promise((resolve) => {
      const svg = `https://production.cdn.superviz.com/static/mouse-pointers/${slot.colorName}.svg`;
      const loader = new THREE.TextureLoader();
      let map;
      loader.load(svg, (texture) => {
        map = texture;
        const material = new THREE.SpriteMaterial({
          map,
          color: 0xffffff,
          fog: false,
          sizeAttenuation: false,
          // depthTest: false,
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.02, 0.02, 0.02);
        sprite.center.set(0.2, 0.23);
        resolve(sprite);
      });
    });
  };
}
