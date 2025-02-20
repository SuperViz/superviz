import { CANVAS, FONT, STYLE } from '../../constants/nameLabel';
import { NameService } from '../../services/name-service';

interface CanvasMetrics {
  circleSize: number;
  circlePadding: number;
  leftPadding: number;
  canvasWidth: number;
  canvasHeight: number;
  centerY: number;
  centerX: number;
}

export class NameLabelCanvas {
  private THREE: any;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private texture: any;
  private material: any;
  private sprite: any;
  private nameLabelModel: any;
  private lerper: any;

  constructor(nameLabelModel: any, participant: any) {
    console.log('Plugin: NameLabelCanvas constructor', { nameLabelModel, participant });
    this.nameLabelModel = nameLabelModel;
    this.THREE = NameService.instance.getTHREE();
    this.createNameLabel(participant);
  }

  private calculateMetrics(textWidth: number): CanvasMetrics {
    const circleSize = CANVAS.TEXT_HEIGHT * 0.4;
    const circleTextGap = CANVAS.PADDING.HORIZONTAL * 4;
    const leftPadding = CANVAS.PADDING.HORIZONTAL;

    return {
      circleSize,
      circlePadding: circleTextGap,
      leftPadding,
      canvasWidth: textWidth + leftPadding * 2 + circleSize + circleTextGap,
      canvasHeight: CANVAS.TEXT_HEIGHT + CANVAS.PADDING.VERTICAL * 2,
      centerY: CANVAS.TEXT_HEIGHT / 2 + CANVAS.PADDING.VERTICAL,
      centerX: leftPadding + circleSize / 2,
    };
  }

  private async createNameLabel(participant: any) {
    // Load font first
    const font = new FontFace(FONT.FAMILY, FONT.URL);
    await font.load();
    document.fonts.add(font);

    // Create canvas and context
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    // Enable text smoothing
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';

    // Set font before measuring
    this.context.font = `bold ${CANVAS.TEXT_HEIGHT}px ${FONT.FAMILY}`;

    // Calculate metrics
    const metrics = this.context.measureText(participant.name);
    const textWidth = metrics.width * CANVAS.TEXT_WIDTH_MULTIPLIER;
    const canvasMetrics = this.calculateMetrics(textWidth);

    // Set canvas size with device pixel ratio
    const scale = window.devicePixelRatio || 2;
    this.canvas.width = canvasMetrics.canvasWidth * scale;
    this.canvas.height = canvasMetrics.canvasHeight * scale;
    this.canvas.style.width = `${canvasMetrics.canvasWidth}px`;
    this.canvas.style.height = `${canvasMetrics.canvasHeight}px`;
    this.context.scale(scale, scale);

    // Need to set font again after canvas resize
    this.context.font = `bold ${CANVAS.TEXT_HEIGHT}px ${FONT.FAMILY}`;

    // Draw name label
    this.drawNameLabel(participant, canvasMetrics);

    // Create sprite
    this.createSprite();
  }

  private drawNameLabel(participant: any, metrics: CanvasMetrics) {
    // Draw background
    this.context.fillStyle = STYLE.BACKGROUND_COLOR;
    this.context.beginPath();
    const cornerRadius = metrics.canvasHeight / 3;
    this.context.roundRect(
      0,
      0,
      metrics.canvasWidth,
      metrics.canvasHeight * STYLE.BACKGROUND_HEIGHT_SCALE,
      cornerRadius,
    );
    this.context.fill();

    // Draw circle (colored dot)
    this.context.beginPath();
    this.context.arc(metrics.centerX, metrics.centerY, metrics.circleSize / 2, 0, Math.PI * 2);
    this.context.fillStyle = participant.slot?.color || STYLE.BACKGROUND_COLOR;
    this.context.fill();

    // Draw text with proper vertical alignment
    this.context.font = `bold ${CANVAS.TEXT_HEIGHT}px ${FONT.FAMILY}`;
    this.context.textBaseline = 'middle';
    this.context.textAlign = 'left';
    this.context.fillStyle = STYLE.TEXT_COLOR;
    this.context.shadowColor = STYLE.TEXT_COLOR;
    this.context.shadowBlur = 0;
    this.context.lineWidth = 1;

    const textX = metrics.leftPadding + metrics.circleSize + metrics.circlePadding;
    const textY = metrics.canvasHeight / 2;
    this.context.fillText(participant.name, textX, textY);
  }

  private createSprite() {
    // Create texture
    this.texture = new this.THREE.Texture(this.canvas);
    this.texture.needsUpdate = true;
    this.texture.minFilter = this.THREE.LinearFilter;
    this.texture.magFilter = this.THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.texture.anisotropy = 16;

    // Create material
    this.material = new this.THREE.SpriteMaterial({
      map: this.texture,
      useScreenCoordinates: false,
      opacity: 1,
      alphaTest: 0.01,
      depthTest: true,
      transparent: true,
      sizeAttenuation: false,
      precision: 'highp',
    });

    // Create sprite
    this.sprite = new this.THREE.Sprite(this.material);
    this.sprite.scale.set(FONT.SIZE * 2, FONT.SIZE, 1);

    if (this.nameLabelModel?.obj3D) {
      this.nameLabelModel.obj3D.add(this.sprite);
      // Create lerper component
      this.lerper = this.nameLabelModel.addComponent('lerper');
    }
  }

  public updatePosition(position: any) {
    if (this.sprite && this.lerper) {
      // Use lerper to animate position
      this.lerper.animateVector(
        this.sprite.position,
        new this.THREE.Vector3(
          position.x,
          position.y + 0.3, // Offset above avatar
          position.z,
        ),
      );
    }
  }

  public dispose() {
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }

    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    if (this.sprite) {
      this.nameLabelModel.obj3D.remove(this.sprite);
      this.sprite = null;
    }

    if (this.canvas) {
      this.canvas = null;
      this.context = null;
    }

    this.lerper = null;
  }
}
