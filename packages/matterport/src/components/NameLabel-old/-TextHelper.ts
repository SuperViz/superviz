import { CanvasSettings, FontSettings } from '../../common/types/text.types';
import { CANVAS, FONT, STYLE } from '../../constants/nameLabel';

export class TextHelper {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
  }

  async createTextCanvas(text: string, circleColor: string): Promise<HTMLCanvasElement> {
    // Load font first
    const font = new FontFace(FONT.FAMILY, FONT.URL);
    await font.load();
    document.fonts.add(font);

    // Calculate text metrics
    this.context.font = `bold ${CANVAS.TEXT_HEIGHT}px ${FONT.FAMILY}`;
    const metrics = this.context.measureText(text);
    const textWidth = metrics.width * CANVAS.TEXT_WIDTH_MULTIPLIER;

    // Setup canvas with proper dimensions
    const circleSize = CANVAS.TEXT_HEIGHT * 0.4;
    const circleTextGap = CANVAS.PADDING.HORIZONTAL * 4;
    const leftPadding = CANVAS.PADDING.HORIZONTAL;
    const canvasWidth = textWidth + leftPadding * 2 + circleSize + circleTextGap;
    const canvasHeight = CANVAS.TEXT_HEIGHT + CANVAS.PADDING.VERTICAL * 2;

    // Set canvas size with device pixel ratio for sharp text
    const scale = window.devicePixelRatio || 2;
    this.canvas.width = canvasWidth * scale;
    this.canvas.height = canvasHeight * scale;
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    // Setup context
    this.context.scale(scale, scale);
    this.context.textBaseline = 'middle';
    this.context.textAlign = 'left';

    // Draw circle
    const centerY = CANVAS.TEXT_HEIGHT / 2 + CANVAS.PADDING.VERTICAL;
    const centerX = leftPadding + circleSize / 2;

    this.context.beginPath();
    this.context.arc(centerX, centerY, circleSize / 2, 0, Math.PI * 2);
    this.context.fillStyle = circleColor;
    this.context.fill();

    // Draw text
    this.context.font = `bold ${CANVAS.TEXT_HEIGHT}px ${FONT.FAMILY}`;
    this.context.fillStyle = STYLE.TEXT_COLOR;
    const textX = leftPadding + circleSize + circleTextGap;
    const textY = canvasHeight / 2;

    this.context.fillText(text, textX, textY);

    return this.canvas;
  }
}
