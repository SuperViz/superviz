import { ParticipantByGroupApi } from '../../../common/types/participant.types';
import { Logger, Observer } from '../../../common/utils';
import { PinMode } from '../../../web-components/comments/components/types';
import { Annotation, PinAdapter, PinCoordinates } from '../types';

import { CanvasSides } from './types';

export class CanvasPin implements PinAdapter {
  private logger: Logger;
  private canvas: HTMLCanvasElement;
  private canvasSides: CanvasSides;
  private divWrapper: HTMLElement;
  private isActive: boolean;
  private isPinsVisible: boolean = true;
  private annotations: Annotation[];
  private pins: Map<string, HTMLElement>;
  private selectedPin: HTMLElement | null = null;
  private animateFrame: number;
  private goToPinCallback: (position: { x: number; y: number }) => void;
  public onPinFixedObserver: Observer;
  private mouseDownCoordinates: { x: number; y: number };
  private temporaryPinCoordinates: { x: number; y: number } | null = null;
  private commentsSide: 'left' | 'right' = 'left';
  private movedTemporaryPin: boolean;
  private originalCanvasCursor: string;
  declare participants: ParticipantByGroupApi[];

  constructor(
    canvasId: string,
    options?: { onGoToPin?: (position: { x: number; y: number }) => void },
  ) {
    this.logger = new Logger('@superviz/sdk/comments-component/canvas-pin-adapter');
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.isActive = false;
    this.pins = new Map();
    this.goToPinCallback = options?.onGoToPin;

    if (!this.canvas) {
      const message = `Canvas with id ${canvasId} not found`;
      this.logger.log(message);
      throw new Error(message);
    }

    this.canvasSides = this.canvas.getBoundingClientRect();

    document.body.style.position = 'relative';
    this.onPinFixedObserver = new Observer({ logger: this.logger });
    this.divWrapper = this.renderDivWrapper();
    this.annotations = [];
    this.renderAnnotationsPins();

    this.animateFrame = requestAnimationFrame(this.animate);

    document.body.addEventListener('select-annotation', this.annotationSelected);
    document.body.addEventListener('keyup', this.resetPins);
  }

  /**
   * @function destroy
   * @description destroys the canvas pin adapter.
   * @returns {void}
   * */
  public destroy(): void {
    this.isActive = false;
    this.removeListeners();
    this.removeAnnotationsPins();
    this.pins = new Map();
    this.divWrapper.remove();
    this.divWrapper = null;
    this.onPinFixedObserver.destroy();
    this.onPinFixedObserver = null;
    this.canvas.style.cursor = 'default';
    this.annotations = [];

    cancelAnimationFrame(this.animateFrame);
    document.body.removeEventListener('select-annotation', this.annotationSelected);
    document.body.removeEventListener('keyup', this.resetPins);
  }

  public setPinsVisibility(isVisible: boolean): void {
    this.isPinsVisible = isVisible;

    if (this.isPinsVisible) {
      this.renderAnnotationsPins();
      return;
    }

    this.removeAnnotationsPins();
  }

  /**
   * @function setActive
   * @param {boolean} isOpen - Whether the canvas pin adapter is active or not.
   * @returns {void}
   */
  public setActive(isOpen: boolean): void {
    if (this.isActive === isOpen) return;

    this.isActive = isOpen;

    if (this.isActive) {
      this.originalCanvasCursor = this.canvas.style.cursor;
      this.canvas.style.cursor =
        'url("https://production.cdn.superviz.com/static/pin-html.png") 0 100, pointer';
      this.addListeners();
      return;
    }

    this.resetPins();
    this.removeListeners();
    this.canvas.style.cursor = this.originalCanvasCursor;
  }

  /**
   * @function updateAnnotations
   * @description updates the annotations of the canvas.
   * @param {Annotation[]} annotations - New annotation to be added to the canvas.
   * @returns {void}
   */
  public updateAnnotations(annotations: Annotation[]): void {
    this.logger.log('updateAnnotations', annotations);

    this.annotations = annotations;

    if (!this.isActive && !this.isPinsVisible) return;

    this.removeAnnotationsPins();
    this.renderAnnotationsPins();
  }

  /**
   * @function removeAnnotationPin
   * @description Removes an annotation pin from the canvas.
   * @param {string} uuid - The uuid of the annotation to be removed.
   * @returns {void}
   * */
  public removeAnnotationPin(uuid: string): void {
    const pinElement = this.pins.get(uuid);

    if (!pinElement) return;

    pinElement.remove();
    this.pins.delete(uuid);

    if (uuid === 'temporary-pin') return;

    this.annotations = this.annotations.filter((annotation) => annotation.uuid !== uuid);
  }

  /**
   * @function renderTemporaryPin
   * @description
          creates a temporary pin with the id
          temporary-pin to mark where the annotation is being created
   */
  public renderTemporaryPin(): void {
    let temporaryPin = document.getElementById('superviz-temporary-pin');

    if (!temporaryPin) {
      temporaryPin = document.createElement('superviz-comments-annotation-pin');
      temporaryPin.id = 'superviz-temporary-pin';
      temporaryPin.setAttribute('type', PinMode.ADD);
      temporaryPin.setAttribute('showInput', '');
      temporaryPin.setAttribute('containerSides', JSON.stringify(this.canvasSides));
      temporaryPin.setAttribute('commentsSide', this.commentsSide);
      temporaryPin.setAttribute('position', JSON.stringify(this.temporaryPinCoordinates));
      temporaryPin.setAttribute('annotation', JSON.stringify({}));
      temporaryPin.setAttribute('participantsList', JSON.stringify(this.participants));
      temporaryPin.setAttributeNode(document.createAttribute('active'));
      this.divWrapper.appendChild(temporaryPin);
    }

    const { x: savedX, y: savedY } = this.temporaryPinCoordinates;

    const context = this.canvas.getContext('2d');
    const transform = context.getTransform();

    const currentTranslateX = transform.e;
    const currentTranslateY = transform.f;
    const currentScaleWidth = transform.a;
    const currentScaleHeight = transform.d;

    const x = savedX * currentScaleWidth + currentTranslateX;
    const y = savedY * currentScaleHeight + currentTranslateY;

    temporaryPin.setAttribute('position', JSON.stringify({ x, y }));

    this.pins.set('temporary-pin', temporaryPin);
  }

  /**
   * @function addListeners
   * @description adds event listeners to the canvas element.
   * @returns {void}
   */
  private addListeners(): void {
    this.canvas.addEventListener('click', this.onClick);
    this.canvas.addEventListener('mousedown', this.setMouseDownCoordinates);
    document.body.addEventListener('toggle-annotation-sidebar', this.onToggleAnnotationSidebar);
    document.body.addEventListener('click', this.hideTemporaryPin);
  }

  public setCommentsMetadata = (side: 'left' | 'right'): void => {
    this.commentsSide = side;
  };

  /**
   * @function removeListeners
   * @description removes event listeners from the canvas element.
   * @returns {void}
   * */
  private removeListeners(): void {
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('mousedown', this.setMouseDownCoordinates);
    document.body.removeEventListener('toggle-annotation-sidebar', this.onToggleAnnotationSidebar);
    document.body.addEventListener('click', this.hideTemporaryPin);
  }

  /**
   * @function resetSelectedPin
   * @description Unselects a pin by removing its 'active' attribute
   * @returns {void}
   * */
  private resetSelectedPin(): void {
    if (!this.selectedPin) return;
    this.selectedPin.removeAttribute('active');
    this.selectedPin = null;
  }

  /**
   * @function resetPins
   * @description Unselects selected pin and removes temporary pin.
   * @param {that} this - The canvas pin adapter instance.
   * @param {KeyboardEvent} event - The keyboard event object.
   * @returns {void}
   * */
  private resetPins = (event?: KeyboardEvent): void => {
    if (event && event?.key !== 'Escape') return;

    this.resetSelectedPin();
    this.removeAnnotationPin('temporary-pin');
    this.temporaryPinCoordinates = null;
  };

  /**
   * @function animate
   * @description animation frame
   * @returns {void}
   */
  private animate = (): void => {
    if (this.isActive || this.isPinsVisible) {
      this.renderAnnotationsPins();
      this.divWrapper = this.renderDivWrapper();
    }

    if (this.temporaryPinCoordinates) {
      this.renderTemporaryPin();
    }

    this.animateFrame = requestAnimationFrame(this.animate);
  };

  /**
   * @function renderDivWrapper
   * @description Creates a div wrapper for the pins.
   * @returns {HTMLElement} The newly created div wrapper.
   * */
  private renderDivWrapper(): HTMLElement {
    const canvasRect = this.canvas.getBoundingClientRect();
    let wrapper = this.divWrapper;

    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'superviz-canvas-wrapper';
      if (['', 'static'].includes(this.canvas.parentElement.style.position)) {
        this.canvas.parentElement.style.position = 'relative';
      }
    }

    wrapper.style.position = 'absolute';
    wrapper.style.top = `${this.canvas.offsetTop}px`;
    wrapper.style.left = `${this.canvas.offsetLeft}px`;
    wrapper.style.width = `${canvasRect.width}px`;
    wrapper.style.height = `${canvasRect.height}px`;
    wrapper.style.pointerEvents = 'none';
    wrapper.style.overflow = 'hidden';

    if (!document.getElementById('superviz-canvas-wrapper')) {
      this.canvas.parentElement.appendChild(wrapper);
    }

    return wrapper;
  }

  /**
   * @function renderAnnotationsPins
   * @description Renders the annotations on the canvas.
   * @returns {void}
   */
  private renderAnnotationsPins(): void {
    if (
      (!this.annotations.length || this.canvas.style.display === 'none') &&
      !this.pins.get('temporary-pin')
    ) {
      this.removeAnnotationsPins();
      return;
    }

    this.annotations.forEach((annotation) => {
      if (annotation.resolved) {
        return;
      }

      const position = JSON.parse(annotation.position) as PinCoordinates;
      if (position?.type !== 'canvas') return;

      const { x: savedX, y: savedY } = position;

      const context = this.canvas.getContext('2d');
      const transform = context.getTransform();

      const currentTranslateX = transform.e;
      const currentTranslateY = transform.f;
      const currentScaleWidth = transform.a;
      const currentScaleHeight = transform.d;

      const x = savedX * currentScaleWidth + currentTranslateX;
      const y = savedY * currentScaleHeight + currentTranslateY;

      if (this.pins.has(annotation.uuid)) {
        const pin = this.pins.get(annotation.uuid);

        const isVisible = this.divWrapper.clientWidth > x && this.divWrapper.clientHeight > y;

        if (isVisible) {
          pin.setAttribute('style', 'opacity: 1');

          this.pins.get(annotation.uuid).setAttribute('position', JSON.stringify({ x, y }));
          return;
        }

        pin.setAttribute('style', 'opacity: 0');

        return;
      }
      const pinElement = document.createElement('superviz-comments-annotation-pin');
      pinElement.setAttribute('type', PinMode.SHOW);
      pinElement.setAttribute('participantsList', JSON.stringify(this.participants));

      pinElement.setAttribute('annotation', JSON.stringify(annotation));
      pinElement.setAttribute('position', JSON.stringify({ x, y }));
      pinElement.id = annotation.uuid;

      this.divWrapper.appendChild(pinElement);
      this.pins.set(annotation.uuid, pinElement);
    });
  }

  /**
   * @function setMouseDownCoordinates
   * @description stores the mouse down coordinates
   * @param {MouseEvent} event - The mouse event object.
   * @returns {void}
   */
  private setMouseDownCoordinates = ({ x, y }: MouseEvent) => {
    this.mouseDownCoordinates = { x, y };
  };

  /**
   * @function removeAnnotationsPins
   * @description clears all pins from the canvas.
   * @returns {void}
   */
  private removeAnnotationsPins(): void {
    this.pins.forEach((pinElement) => {
      pinElement.remove();
    });

    this.pins.clear();
  }

  /** Callbacks  */

  /**
   * @function annotationSelected
   * @description highlights the selected annotation and scrolls to it
   * @param {CustomEvent} event
   * @returns {void}
   */
  private annotationSelected = ({ detail: { uuid, haltGoToPin, newPin } }: CustomEvent): void => {
    if (!uuid) return;

    if (newPin) {
      const pin = this.pins.get(uuid);
      pin.setAttribute('newPin', '');
    }

    const annotation = JSON.parse(this.selectedPin?.getAttribute('annotation') ?? '{}');

    this.resetPins();

    if (annotation?.uuid === uuid) return;

    document.body.dispatchEvent(new CustomEvent('close-temporary-annotation'));

    const pinElement = this.pins.get(uuid);

    if (!pinElement) return;

    pinElement.setAttribute('active', '');

    this.selectedPin = pinElement;

    if (haltGoToPin) return;

    this.goToPin(uuid);
  };

  /**
   * @function participantsList
   * @description - all participants of developer groupId
   * @param participants - all participants list
   */
  public set participantsList(participants: ParticipantByGroupApi[]) {
    this.participants = participants;
  }

  /**
   * @function goToPin
   * @description - translate the canvas to the pin position
   * @param uuid - annotation uuid
   */
  private goToPin(uuid: string): void {
    const annotation = this.annotations.find((annotation) => annotation.uuid === uuid);

    if (!annotation) return;

    const position = JSON.parse(annotation.position) as PinCoordinates;

    if (position?.type !== 'canvas') return;

    const rect = this.canvas.getBoundingClientRect();
    const { width, height } = rect;

    const { x, y } = position;

    const widthHalf = width / 2;
    const heightHalf = height / 2;

    const translateX = widthHalf - x;
    const translateY = heightHalf - y;

    if (this.goToPinCallback) this.goToPinCallback({ x: translateX, y: translateY });
  }

  /**
   * @function onClick
   * @description
      handles the click event on the canvas
      element and saves the coordinates of the click.
   * @param event - The MouseEvent object representing the click event.
   */
  private onClick = (event: MouseEvent): void => {
    if (!this.isActive) return;
    const rect = this.canvas.getBoundingClientRect();

    const { x: mouseDownX, y: mouseDownY } = this.mouseDownCoordinates;
    const originalX = mouseDownX - rect.x;
    const originalY = mouseDownY - rect.y;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const distance = Math.hypot(x - originalX, y - originalY);
    if (distance > 10) return;

    const context = this.canvas.getContext('2d');

    const transform = context.getTransform();

    const invertedMatrix = transform.inverse();
    const transformedPoint = new DOMPoint(x, y - 31).matrixTransform(invertedMatrix);

    this.onPinFixedObserver.publish({
      x: transformedPoint.x,
      y: transformedPoint.y,
      type: 'canvas',
    } as PinCoordinates);

    this.resetSelectedPin();
    this.temporaryPinCoordinates = { x: transformedPoint.x, y: transformedPoint.y };
    this.renderTemporaryPin();

    const temporaryPin = document.getElementById('superviz-temporary-pin');

    // we don't care about the actual movedTemporaryPin value
    // it only needs to trigger an update
    this.movedTemporaryPin = !this.movedTemporaryPin;
    temporaryPin.setAttribute('movedPosition', String(this.movedTemporaryPin));
    if (this.selectedPin) return;

    document.body.dispatchEvent(new CustomEvent('unselect-annotation'));
  };

  /**
   * @function onToggleAnnotationSidebar
   * @description Removes temporary pin and unselects selected pin
   * @param {CustomEvent} event
   * @returns {void}
   */
  private onToggleAnnotationSidebar = ({ detail }: CustomEvent): void => {
    const { open } = detail;

    if (open) return;

    this.pins.forEach((pinElement) => {
      pinElement.removeAttribute('active');
    });

    if (this.pins.has('temporary-pin')) {
      this.removeAnnotationPin('temporary-pin');
    }
  };

  /**
   * @function hideTemporaryPin
   * @description hides the temporary pin if click outside an observed element
   * @param {MouseEvent} event the mouse event object
   * @returns {void}
   */
  private hideTemporaryPin = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const isCanvasParent = target.contains(this.canvas);
    const { x, y } = event;
    const { left, top, right, bottom } = this.canvas.getBoundingClientRect();
    const clickIsInsideCanvas = x > left && x < right && y > top && y < bottom;

    if (
      this.canvas.contains(target) ||
      this.pins.get('temporary-pin')?.contains(target) ||
      (isCanvasParent && clickIsInsideCanvas)
    )
      return;

    this.removeAnnotationPin('temporary-pin');
    this.temporaryPinCoordinates = null;
  };
}
