import { Object3D } from 'three';

import {
  CanvasSettings,
  FontSettings,
  StyleSettings,
  TextObject,
} from '../../common/types/text.types';
import { Slot } from '../../types';

import { Canvas } from './Canvas';
import { Material } from './Material';

/**
 * AvatarName component handles the creation and management of name labels
 * that appear above avatars and laser pointers in the 3D space
 */
function NameLabel() {
  // Canvas settings
  const CANVAS: CanvasSettings = {
    TEXT_HEIGHT: 1000,
    PADDING: {
      HORIZONTAL: 60,
      VERTICAL: 250,
    },
    TEXT_WIDTH_MULTIPLIER: 112,
  };

  // Font settings
  const FONT: FontSettings = {
    SIZE: 0.04,
    FAMILY: 'Roboto',
    URL: 'url(https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2)',
  };

  // Style settings
  const STYLE: StyleSettings = {
    BACKGROUND_COLOR: '#403D45',
    TEXT_COLOR: '#fff',
    BACKGROUND_HEIGHT_SCALE: 1.0,
    BACKGROUND_SCALE: { x: 1.2, y: 1.2, z: 1.1 },
  };

  // Properties
  this.THREE = null;
  this.textObject = null;
  this.context = null;

  // Public interface
  /**
   * Initializes the component with Three.js context
   */
  this.onInit = () => {
    this.THREE = this.context.three;
    this.textObject = null;
  };

  /**
   * Tick function called on each frame
   * @param tickDelta - Time since last tick in milliseconds
   */
  this.onTick = (tickDelta: number): void => {};

  /**
   * Creates a name label and attaches it to a 3D object
   * @param object3D - The Three.js object to attach the name to
   * @param name - The text to display
   * @param color - The participant's slot (determines color)
   * @param height - Vertical offset for the name label
   * @returns Promise resolving to the created text object
   */
  this.createName = async (
    object3D: Object3D,
    name: string,
    color: string,
    height: number,
  ): Promise<TextObject> => {
    const font = new FontFace(FONT.FAMILY, FONT.URL);
    await font.load();
    document.fonts.add(font);

    this.textObject = this.createText(name, STYLE.TEXT_COLOR, STYLE.BACKGROUND_COLOR, color);
    this.textObject.position.set(0, height, 0);
    object3D.add(this.textObject);
    return this.textObject;
  };

  /**
   * Updates the vertical position of the name label
   * @param height - New vertical position
   */
  this.updateHeight = (height: number): void => {
    if (this.textObject) {
      this.textObject.position.y = height;
    }
  };

  /**
   * Creates a text sprite with background
   * @param text - The text to display
   * @param textColor - Color for the text
   * @param backgroundColor - Color for the background
   * @returns TextObject containing the sprite setup
   */
  this.createText = (
    text: string,
    textColor: string,
    backgroundColor: string,
    circleColor: string,
  ): TextObject => {
    const metrics = document.createElement('canvas').getContext('2d').measureText(text);
    const textWidth = metrics.width * CANVAS.TEXT_WIDTH_MULTIPLIER;

    // Create canvases using Canvas module
    const textCanvas = Canvas.createText(text, textColor, CANVAS, FONT, circleColor);
    const backgroundCanvas = Canvas.createBackground(textWidth, backgroundColor, CANVAS, STYLE);

    // Create textures and materials using Material module
    const texture = Material.createTexture(textCanvas, this.THREE);
    const material = Material.createForText(texture, this.THREE);
    const sprite = new this.THREE.Sprite(material);
    sprite.raycast = () => null;

    const textObject = new this.THREE.Object3D();
    textObject.textHeight = FONT.SIZE;
    textObject.textWidth = (textWidth / CANVAS.TEXT_HEIGHT) * textObject.textHeight;
    sprite.scale.set((textWidth / CANVAS.TEXT_HEIGHT) * FONT.SIZE, FONT.SIZE, 1);

    const backgroundTexture = Material.createTexture(backgroundCanvas, this.THREE);
    const backgroundMaterial = Material.createForBackground(
      backgroundTexture,
      backgroundColor,
      this.THREE,
    );
    const background = new this.THREE.Sprite(backgroundMaterial);
    background.scale.set(
      STYLE.BACKGROUND_SCALE.x,
      STYLE.BACKGROUND_SCALE.y,
      STYLE.BACKGROUND_SCALE.z,
    );

    sprite.add(background);
    textObject.add(sprite);
    return textObject;
  };
}

export default () => {
  return new NameLabel();
};
