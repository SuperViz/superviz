import { CanvasSettings, FontSettings, StyleSettings } from '../../common/types/text.types';

interface CanvasMetrics {
  circleSize: number;
  circlePadding: number;
  leftPadding: number;
  canvasWidth: number;
  canvasHeight: number;
  centerY: number;
  centerX: number;
}

export const Canvas = {
  /**
   * Calculate common canvas metrics used by both text and background
   */
  calculateMetrics(textWidth: number, CANVAS: CanvasSettings): CanvasMetrics {
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
  },

  createText(
    text: string,
    textColor: string,
    CANVAS: CanvasSettings,
    FONT: FontSettings,
    circleColor: string,
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Enable text smoothing
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    const metrics = context.measureText(text);
    const textWidth = metrics.width * CANVAS.TEXT_WIDTH_MULTIPLIER;

    const { circleSize, circlePadding, leftPadding, canvasWidth, canvasHeight, centerY, centerX } =
      this.calculateMetrics(textWidth, CANVAS);

    // Increase canvas resolution for sharper text
    const scale = window.devicePixelRatio || 2; // Use at least 2x scaling
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    context.scale(scale, scale);

    // Draw circle
    context.beginPath();
    context.arc(centerX, centerY, circleSize / 2, 0, Math.PI * 2);
    context.fillStyle = circleColor;
    context.fill();

    // Draw text with proper vertical alignment
    context.font = `bold ${CANVAS.TEXT_HEIGHT}px ${FONT.FAMILY}`;
    context.textBaseline = 'middle'; // This ensures vertical middle alignment
    context.textAlign = 'left'; // Explicit text alignment

    // Enable font smoothing
    context.fillStyle = textColor;
    context.shadowColor = textColor;
    context.shadowBlur = 0;
    context.lineWidth = 1;

    // Calculate text position to align with circle
    const textX = leftPadding + circleSize + circlePadding;
    const textY = canvasHeight / 2; // Center text vertically in canvas

    context.fillText(text, textX, textY);

    return canvas;
  },

  createBackground(
    textWidth: number,
    backgroundColor: string,
    CANVAS: CanvasSettings,
    STYLE: StyleSettings,
  ): HTMLCanvasElement {
    const { canvasWidth, canvasHeight } = this.calculateMetrics(textWidth, CANVAS, true);

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const context = canvas.getContext('2d');
    context.fillStyle = backgroundColor;

    // Draw rounded rectangle background
    context.beginPath();
    const cornerRadius = canvas.height / 3;
    context.roundRect(
      0,
      0,
      canvas.width,
      canvas.height * STYLE.BACKGROUND_HEIGHT_SCALE,
      cornerRadius,
    );
    context.fill();

    return canvas;
  },
};
