import { Object3D } from 'three';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

import { Slot } from '../types';

export class AvatarName {
  constructor(name: string, slot: Slot, height: number, scale: number) {
    this.name = name;
    this.scale = scale;
    if (slot) {
      this.color = slot.color;
    } else {
      const firstColor = '#878291';
      this.color = firstColor;
    }
    this.height = height;
    this.slot = slot;
  }

  public model: Object3D;
  private name: string;
  private color: string;
  private scale: number;
  private height: number;
  public slot: Slot;
  public text: SpriteText;

  load = async () => {
    const y = this.height;
    const font = new FontFace(
      'OpenSans-SemiBold',
      'url(https://superviz2homologmediaserver.s3.amazonaws.com/static/fonts/OpenSans-SemiBold.woff)',
    );
    await font.load();

    document.fonts.add(font);
    const texGeo = this.createTextGeometry(this.name, this.color);
    this.text = texGeo;
    const root = new Object3D();
    root.add(texGeo as unknown as Object3D);
    texGeo.position.set(0, y, 0);
    this.model = root;
    return this.model;
  };

  createTextGeometry = (text: string, color: string) => {
    const { scale } = this;
    const textColor = this.slot?.textColor ?? '#fff';
    const backgroundColor = color;
    const myText = new SpriteText(text, 0.1);
    myText.color = textColor;
    myText.padding = 2.7;
    myText.backgroundColor = backgroundColor;
    myText.fontFace = 'OpenSans-SemiBold';
    myText.fontSize = 100;
    myText.material.sizeAttenuation = true;
    myText.borderRadius = 8;

    // Apply scale to the SpriteText object's scale
    myText.scale.multiplyScalar(scale);

    return myText;
  };
  destroy = () => {
    this.model.remove(this.text as unknown as Object3D);
  };
}
