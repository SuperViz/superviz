import { STYLE, RECTANGLE } from '../../constants/nameLabel';
import { NameService } from '../../services/name-service';
import { ServiceLocator } from '../../services/service-locator';

import { MaterialHelper } from './MaterialHelper';

export class Canvas {
  private THREE: any;
  private nameLabelModel: any;
  private sprite: any;
  private materialHelper: MaterialHelper;

  constructor(nameLabelModel: any, participant: any) {
    const serviceLocator = ServiceLocator.getInstance();
    const nameService = serviceLocator.get('nameService') as NameService;
    this.THREE = nameService.getTHREE();
    this.nameLabelModel = nameLabelModel;
    this.materialHelper = new MaterialHelper(this.THREE);
    this.createLabel(participant);
  }

  private createBackgroundCanvas(participant: any): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const canvasWidth = 500;
    const canvasHeight = 100;
    const padding = 20;
    const dotSize = 16;
    const dotRightPadding = 10;

    // Measure text width
    const context = document.createElement('canvas').getContext('2d');
    context.font = '24px Arial';
    const text = participant?.name || 'Unknown';
    const textWidth = context.measureText(text).width;

    // Calculate background width needed
    const backgroundWidth = padding + dotSize + dotRightPadding + textWidth + padding;

    // Calculate starting X to center everything
    const startX = (canvasWidth - backgroundWidth) / 2;

    // Setup canvas
    const scale = window.devicePixelRatio || 2;
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const canvasContext = canvas.getContext('2d');
    canvasContext.scale(scale, scale);

    // Calculate dimensions
    const rectHeight = (RECTANGLE.HEIGHT / 100) * canvasHeight;
    const rectY = (canvasHeight - rectHeight) / 2;

    // Draw background
    canvasContext.fillStyle = STYLE.BACKGROUND_COLOR;
    canvasContext.beginPath();
    const cornerRadius = rectHeight / 3;
    canvasContext.roundRect(startX, rectY, backgroundWidth, rectHeight, cornerRadius);
    canvasContext.fill();

    // Draw colored dot
    const dotY = canvasHeight / 2;
    const dotX = startX + padding + dotSize / 2;
    canvasContext.beginPath();
    canvasContext.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
    canvasContext.fillStyle = participant?.slot?.color || '#FFFFFF';
    canvasContext.fill();

    // Add text
    canvasContext.fillStyle = '#FFFFFF';
    canvasContext.font = '24px Arial';
    canvasContext.textAlign = 'left';
    canvasContext.textBaseline = 'middle';
    canvasContext.fillText(text, startX + padding + dotSize + dotRightPadding, canvasHeight / 2);

    return canvas;
  }

  private createLabel(participant: any) {
    const backgroundCanvas = this.createBackgroundCanvas(participant);
    const backgroundTexture = this.materialHelper.createTexture(backgroundCanvas);
    const backgroundMaterial = this.materialHelper.createBackgroundMaterial(backgroundTexture);

    this.sprite = new this.THREE.Sprite(backgroundMaterial);
    this.sprite.scale.set(0.5, 0.1, 1); // Keep scale fixed

    if (this.nameLabelModel?.obj3D) {
      this.nameLabelModel.obj3D.add(this.sprite);
    }

    this.sprite.lerper = this.nameLabelModel.addComponent('lerper');
  }

  public updatePosition(avatarPos: any) {
    if (this.sprite?.lerper) {
      this.sprite.lerper.animateVector(this.sprite.position, avatarPos);
    }
  }

  public dispose() {
    if (this.sprite) {
      if (this.sprite.material) {
        if (this.sprite.material.map) {
          this.sprite.material.map.dispose();
        }
        this.sprite.material.dispose();
      }
      this.nameLabelModel.obj3D.remove(this.sprite);
      this.sprite = null;
    }
  }
}
