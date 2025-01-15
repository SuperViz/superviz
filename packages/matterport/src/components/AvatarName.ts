import { Slot } from '../types';

const AvatarName = function () {
  this.onInit = function () {
    this.THREE = this.context.three;
    this.textObject = null;
  };

  this.onTick = function (tickDelta) {};

  this.createName = async (object3D, name, slot: Slot, height) => {
    const y = height;
    const backgroundColor: string = '#403D45';
    const textColor: string = '#fff';

    const font = new FontFace(
      'Roboto',
      'url(https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2)',
    );
    await font.load();
    document.fonts.add(font);
    this.textObject = this.createText(name, textColor, backgroundColor);
    this.textObject.position.set(0, y, 0);
    object3D.add(this.textObject);
    return this.textObject;
  };

  this.updateHeight = function (height) {
    if (this.textObject) {
      this.textObject.position.y = height;
    }
  };

  this.createText = (text: string, textColor: string, backgroundColor: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const textHeight = 1000;
    const actualFontSize = 0.03;
    const metrics = context.measureText(text);
    const textWidth = metrics.width * 112;

    const horizontalPadding = 60;
    const verticalPadding = 150;
    canvas.width = textWidth + horizontalPadding;
    canvas.height = textHeight + verticalPadding;

    context.font = `${textHeight}px Roboto`;
    context.textBaseline = 'middle';
    context.fillStyle = textColor;
    context.fillText(text, horizontalPadding / 2, (textHeight + verticalPadding) / 2);

    const c = document.createElement('canvas');
    c.width = textWidth + horizontalPadding + 10;
    c.height = textHeight + verticalPadding + 10;
    const ctx = c.getContext('2d');
    ctx.fillStyle = `${backgroundColor}`;

    ctx.beginPath();
    const cornerRadius = c.height / 3;
    ctx.roundRect(0, 0, c.width, c.height * 0.9, cornerRadius);
    ctx.fill();

    const texture = new this.THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = this.THREE.LinearMipMapLinearFilter;
    texture.magFilter = this.THREE.LinearFilter;
    texture.generateMipmaps = true;
    const material = new this.THREE.SpriteMaterial({
      map: texture,
      useScreenCoordinates: false,
      opacity: 1,
      alphaTest: 0.5,
      depthTest: true,
      transparent: true,
      sizeAttenuation: false,
    });
    const sprite = new this.THREE.Sprite(material);
    sprite.raycast = () => {
      return null;
    };

    const textObject = new this.THREE.Object3D();
    textObject.textHeight = actualFontSize;
    textObject.textWidth = (textWidth / textHeight) * textObject.textHeight;
    sprite.scale.set((textWidth / textHeight) * actualFontSize, actualFontSize, 1);

    const backgroundTexture = new this.THREE.Texture(c);
    backgroundTexture.needsUpdate = true;
    backgroundTexture.minFilter = this.THREE.LinearMipMapLinearFilter;
    backgroundTexture.magFilter = this.THREE.LinearFilter;
    backgroundTexture.generateMipmaps = true;

    const backgroundMaterial = new this.THREE.SpriteMaterial({
      opacity: 0.99,
      transparent: false,
      useScreenCoordinates: false,
      alphaTest: 0.1,
      color: new this.THREE.Color(backgroundColor),
      map: backgroundTexture,
      sizeAttenuation: false,
    });
    const background = new this.THREE.Sprite(backgroundMaterial);
    background.scale.set(1.18, 1.35, 1.1);
    sprite.add(background);
    textObject.add(sprite);
    return textObject;
  };
};

export default () => {
  return new AvatarName();
};
