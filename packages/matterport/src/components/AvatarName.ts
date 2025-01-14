import { Slot } from '../types';

const AvatarName = function () {
  this.onInit = function () {
    this.THREE = this.context.three;
  };

  this.onTick = function (tickDelta) {};

  this.onEvent = function () {};

  this.onInputsUpdated = function () {};

  this.onDestroy = function () {};

  this.createName = async (avatar, name, slot: Slot, height) => {
    const scene = avatar;
    const y = height;
    const backgroundColor: string = slot?.color ?? '#878291';
    const textColor: string = slot?.textColor ?? '#fff';
    const font = new FontFace(
      'OpenSans-SemiBold',
      'url(https://superviz2homologmediaserver.s3.amazonaws.com/static/fonts/OpenSans-SemiBold.woff)',
    );
    await font.load();
    document.fonts.add(font);
    const textObject3D = this.createText(name, textColor, backgroundColor);
    textObject3D.position.set(0, y, 0);
    scene.add(textObject3D);
    return textObject3D;
  };

  this.createText = (text: string, textColor: string, backgroundColor: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const rescaler = 100;
    const textHeight = 10 * rescaler;
    const actualFontSize = 0.03;
    const metrics = context.measureText(text);
    const textWidth = metrics.width * rescaler * 1.12;

    const horizontalPadding = 60;
    const verticalPadding = 150;
    canvas.width = textWidth + horizontalPadding;
    canvas.height = textHeight + verticalPadding;

    context.font = `${textHeight}px OpenSans-SemiBold`;
    context.textBaseline = 'middle';
    context.fillStyle = textColor;
    context.fillText(text, horizontalPadding / 2, (textHeight + verticalPadding) / 2);

    const c = document.createElement('canvas');
    c.width = textWidth + horizontalPadding + 10;
    c.height = textHeight + verticalPadding + 10;
    const ctx = c.getContext('2d');
    const colorWithAlpha = this.addAlpha(backgroundColor.split('#')[1], 0.99);
    ctx.fillStyle = `#${colorWithAlpha}`;

    ctx.beginPath();
    const cornerRadius = c.height / 3;
    ctx.roundRect(0, 0, c.width, c.height * 0.9, cornerRadius);
    ctx.fill();

    const texture = new this.THREE.Texture(canvas);
    texture.needsUpdate = true;
    const material = new this.THREE.SpriteMaterial({
      map: texture,
      useScreenCoordinates: false,
      opacity: 1,
      alphaTest: 0.5,
      depthTest: true,
      transparent: true,
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

    const backgroundMaterial = new this.THREE.SpriteMaterial({
      opacity: 0.99,
      transparent: false,
      useScreenCoordinates: false,
      alphaTest: 0.1,
      color: new this.THREE.Color(backgroundColor),
      map: backgroundTexture,
    });
    const background = new this.THREE.Sprite(backgroundMaterial);
    background.scale.set(1.18, 1.35, 1.1);
    sprite.add(background);
    textObject.add(sprite);
    return textObject;
  };

  this.addAlpha = (color, opacity) => {
    // coerce values so ti is between 0 and 1.
    const _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
    return color + _opacity.toString(16).toUpperCase();
  };
};

export default () => {
  return new AvatarName();
};
