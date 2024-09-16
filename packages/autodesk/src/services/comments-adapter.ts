// eslint-disable-next-line max-classes-per-file
import type {
  Annotation,
  PinAdapter,
  PinCoordinates,
  Observer as ObserverType,
} from '@superviz/sdk';
import { Vector3 } from 'three';

import { Logger } from '../common/utils/logger';
import { Observer } from '../common/utils/observer';

import { HorizontalSide, Sides, SimpleParticipant, ParticipantByGroupApi } from './types';

let self: AutodeskPin;

type AnnotationPositionInfo = {
  position: PinCoordinates;
  camera: Vector3;
};

export class AutodeskPin implements PinAdapter {
  private logger: Logger;
  private isPinsVisible: boolean = true;
  private isActive: boolean;
  private annotations: Annotation[];
  private pins: Map<string, HTMLElement>;
  private viewer: Autodesk.Viewing.GuiViewer3D;
  private showcaseSides: Sides;
  private selectedPin: HTMLElement | null;
  private divWrapper: HTMLElement;
  private mouseElement: HTMLElement;
  private temporaryPinCoordinates: PinCoordinates;
  private pinHeight: number;
  public onPinFixedObserver: ObserverType;
  private commentsSide: HorizontalSide = 'left';
  private localParticipant: SimpleParticipant = {};
  private participants: ParticipantByGroupApi[];
  private renderFrame: number;
  private isDragging: boolean = false;
  private hasLayerSelected: boolean = false;

  constructor(viewer: Autodesk.Viewing.GuiViewer3D) {
    self = this;
    this.viewer = viewer;
    this.logger = new Logger('@superviz/sdk/comments-component/autodesk-adapter');
    this.isActive = false;
    this.pins = new Map();
    this.pinHeight = 32;

    this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraMove);
    this.viewer.addEventListener(
      Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
      this.onAggregateSelectionChanged,
    );

    document.body.addEventListener('select-annotation', this.annotationSelected);
    document.body.addEventListener('toggle-annotation-sidebar', this.onToggleAnnotationSidebar);
    document.body.style.position = 'relative';

    this.onPinFixedObserver = new Observer() as unknown as ObserverType;
    this.annotations = [];
    this.renderAnnotationsPins();
    this.showcaseSides = this.viewer.canvas.getBoundingClientRect();
    this.renderDivWrapper();
    this.renderFrame = requestAnimationFrame(this.animate);
  }

  /**
   * @function destroy
   * @description destroys the canvas pin adapter.
   * @returns {void}
   * */
  public destroy(): void {
    this.viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraMove);
    this.viewer.removeEventListener(
      Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
      this.onAggregateSelectionChanged,
    );
    document.body.removeEventListener('select-annotation', this.annotationSelected);
    document.body.removeEventListener('toggle-annotation-sidebar', this.onToggleAnnotationSidebar);
    this.removeAnnotationsPins();
    this.removeListeners();
    cancelAnimationFrame(this.renderFrame);
    this.mouseElement = null;
  }

  /**
   * @function setActive
   * @param {boolean} isOpen - Whether the canvas pin adapter is active or not.
   * @returns {void}
   */
  public setActive(isOpen: boolean): void {
    this.isActive = isOpen;

    if (this.isActive) {
      this.addListeners();
      return;
    }

    this.removeListeners();
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
   * @function animate
   * @description animates the canvas pin adapter.
   * @returns {void}
   */
  private animate = () => {
    this.positionWrapper();
    this.renderFrame = requestAnimationFrame(this.animate);
  };

  /**
   * @function positionWrapper
   * @description reposition the div wrapper to adapt to the canvas current position.
   * @returns {void}
   */
  private positionWrapper() {
    const canvasRect = this.viewer.canvas.getBoundingClientRect();
    this.divWrapper.style.position = 'fixed';
    this.divWrapper.style.top = `${canvasRect.top}px`;
    this.divWrapper.style.left = `${canvasRect.left}px`;
    this.divWrapper.style.width = `${canvasRect.width}px`;
    this.divWrapper.style.height = `${canvasRect.height}px`;
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
    this.annotations = this.annotations.filter((annotation) => annotation.uuid !== uuid);
  }

  /**
   * @function createTemporaryPin
   * @description
          creates a temporary pin with the id
          temporary-pin to mark where the annotation is being created
   * @param {PinCoordinates} coordinates  - The coordinates of the pin to be created.
   */
  public createTemporaryPin(coordinates: PinCoordinates): void {
    let temporaryPin = document.getElementById('superviz-temporary-pin');
    this.temporaryPinCoordinates = coordinates;

    if (!temporaryPin) {
      temporaryPin = document.createElement('superviz-comments-annotation-pin');
      temporaryPin.id = 'superviz-temporary-pin';
      const add = 'add';
      temporaryPin.setAttribute('type', add);
      temporaryPin.setAttribute('showInput', '');
      temporaryPin.setAttribute('containerSides', JSON.stringify(this.showcaseSides));
      temporaryPin.setAttribute('commentsSide', this.commentsSide);
      temporaryPin.setAttribute('localAvatar', this.localParticipant.avatar ?? '');
      temporaryPin.setAttribute('participantsList', JSON.stringify(this.participants));
      temporaryPin.setAttribute('localName', this.localParticipant.name ?? '');
      temporaryPin.setAttribute('position', JSON.stringify(this.temporaryPinCoordinates));
      temporaryPin.setAttribute('annotation', JSON.stringify({}));
      temporaryPin.setAttributeNode(document.createAttribute('active'));
      temporaryPin.style.pointerEvents = 'auto';
    }

    const posScreen = this.position3DToScreen(coordinates, 0, this.pinHeight);

    const screenCoordinates = {
      x: posScreen.left,
      y: posScreen.top,
      type: coordinates.type,
    };

    temporaryPin.setAttribute('position', JSON.stringify(screenCoordinates));

    this.divWrapper.appendChild(temporaryPin);
    this.pins.set('temporary-pin', temporaryPin);
    this.renderAnnotationsPins();
  }

  /**
   * @function setCommentsMetadata
   * @description sets metadata about how the comments was initialized and the user avatar
   * @param {string} side  - The side of the window where the comments are
   * @param {string} avatar  - The avatar of the user
   */
  public setCommentsMetadata = (side: 'left' | 'right'): void => {
    this.commentsSide = side;
  };

  /**
   * @function addListeners
   * @description adds event listeners to the canvas element.
   * @returns {void}
   */
  private addListeners(): void {
    this.viewer.canvas.addEventListener('mouseup', this.onMouseUp);
    this.viewer.canvas.addEventListener('mousedown', this.onMouseDown);
    this.viewer.canvas.addEventListener('mousemove', this.onMouseMove);
    this.viewer.canvas.addEventListener('mouseout', this.onMouseLeave);
    this.viewer.canvas.addEventListener('mouseenter', this.onMouseEnter);
    document.body.addEventListener('keyup', this.resetPins);
    document.body.addEventListener('click', this.hideTemporaryPin);
  }

  /**
   * @function removeListeners
   * @description removes event listeners from the canvas element.
   * @returns {void}
   * */
  private removeListeners(): void {
    this.viewer.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.viewer.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.viewer.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.viewer.canvas.removeEventListener('mouseout', this.onMouseLeave);
    this.viewer.canvas.removeEventListener('mouseenter', this.onMouseEnter);
    document.body.removeEventListener('keyup', this.resetPins);
    document.body.removeEventListener('click', this.hideTemporaryPin);
  }

  private onAggregateSelectionChanged = (event): void => {
    this.hasLayerSelected = !!event.selections.length;
    this.renderAnnotationsPins();
  };

  private onCameraMove = (): void => {
    if (!this.isActive && !this.isPinsVisible) return;

    this.renderAnnotationsPins();
  };

  /**
   * @function renderAnnotationsPins
   * @description Renders the annotations on the canvas.
   * @returns {void}
   */
  private async renderAnnotationsPins(): Promise<void> {
    this.annotations.forEach(async (annotation) => {
      const positionInfo = JSON.parse(annotation.position) as AnnotationPositionInfo;
      const coordinates: PinCoordinates = positionInfo.position;

      if (coordinates?.type !== 'autodesk' || annotation.resolved) {
        return;
      }

      if (!this.pins.has(annotation.uuid)) {
        this.createPin(annotation, coordinates);
        return;
      }
      const posScreen = this.position3DToScreen(coordinates, 0, this.pinHeight);

      const visible = await this.checkIsVisible(posScreen, coordinates);
      const pin = this.pins.get(annotation.uuid);
      if (visible) {
        pin.setAttribute('style', 'opacity: 1');

        this.pins
          .get(annotation.uuid)
          .setAttribute('position', JSON.stringify({ x: posScreen.left, y: posScreen.top }));
      } else {
        pin.setAttribute('style', 'opacity: 0');
      }
    });

    if (this.pins.get('temporary-pin')) {
      const posScreen = this.position3DToScreen(this.temporaryPinCoordinates, 0, this.pinHeight);
      const visible = await this.checkIsVisible(posScreen, this.temporaryPinCoordinates);
      const temporaryPin = this.pins.get('temporary-pin');
      if (visible) {
        temporaryPin.setAttribute('style', 'opacity: 1');

        temporaryPin.setAttribute(
          'position',
          JSON.stringify({ x: posScreen.left, y: posScreen.top }),
        );
      } else {
        temporaryPin.setAttribute('style', 'opacity: 0');
      }
    }
  }

  /**
   * @function createPin
   * @description
          creates a temporary the actual pin
   * @param {Annotation} annotation  - The annotation saved in the database
   * @param {PinCoordinates} coordinates  - The coordinates of the pin to be created.
   */
  private createPin(annotation: Annotation, coordinates: PinCoordinates) {
    const posScreen = this.position3DToScreen(coordinates, 0, this.pinHeight);

    const pinElement = document.createElement('superviz-comments-annotation-pin');
    this.divWrapper.appendChild(pinElement);
    pinElement.setAttribute('type', 'show');
    pinElement.setAttribute('annotation', JSON.stringify(annotation));
    pinElement.setAttribute('position', JSON.stringify({ x: posScreen.left, y: posScreen.top }));
    pinElement.setAttribute('participantsList', JSON.stringify(this.participants));
    pinElement.style.pointerEvents = 'auto';
    this.pins.set(annotation.uuid, pinElement);
  }

  private onClickedPin(positionInfo: AnnotationPositionInfo): void {
    const coordinates = positionInfo.position;
    const camera = this.viewer.navigation.getCamera();
    camera.updateMatrixWorld();
    const originalCameraPosition: THREE.Vector3 = new Vector3(
      positionInfo.camera.x,
      positionInfo.camera.y,
      positionInfo.camera.z,
    );
    const position = new THREE.Vector3(coordinates.x, coordinates.y, coordinates.z);
    let destPosition;
    if (position.distanceTo(originalCameraPosition) > 5) {
      destPosition = originalCameraPosition.lerp(position, 0.6);
    } else {
      destPosition = originalCameraPosition;
    }

    this.onPinFixedObserver.publish({
      x: positionInfo.position.x,
      y: positionInfo.position.y,
      z: positionInfo.position.z,
      type: 'autodesk',
    });

    // @ts-ignore
    this.viewer.utilities.setPivotPoint(position, false, false);
    // @ts-ignore
    this.viewer.utilities.transitionView(
      destPosition,
      position,
      camera.fov,
      camera.up,
      camera.worldup,
      true,
      position,
    );
  }

  private removeAnnotationsPins(): void {
    this.pins.forEach((pinElement) => {
      pinElement.remove();
    });

    this.pins.clear();
  }

  /** Callbacks  */

  // when an annotation is selected, it will highlight the pin
  private annotationSelected = ({ detail }: CustomEvent): void => {
    const { uuid, haltGoToPin, newPin } = detail;
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

    const { position } = this.annotations.find((ann) => ann.uuid === uuid);
    if (position && !haltGoToPin) {
      const info = JSON.parse(position) as AnnotationPositionInfo;
      this.onClickedPin(info);
    }
  };

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

  /*
   * @function hideTemporaryPin
   * @description hides the temporary pin if click outside an observed element
   * @param {MouseEvent} event the mouse event object
   * @returns {void}
   */
  private hideTemporaryPin = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;

    if (this.viewer.canvas.contains(target) || this.pins.get('temporary-pin')?.contains(target)) {
      return;
    }

    this.removeAnnotationPin('temporary-pin');
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
   * @function renderDivWrapper
   * @description Creates a div wrapper for the pins.
   * */
  private renderDivWrapper = (): void => {
    const canvasRect = this.viewer.canvas.getBoundingClientRect();
    let wrapper = this.divWrapper;

    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'superviz-autodesk-pins-wrapper';
    }

    wrapper.style.position = 'fixed';
    wrapper.style.top = `${this.viewer.canvas.offsetTop}px`;
    wrapper.style.left = `${this.viewer.canvas.offsetLeft}px`;
    wrapper.style.width = `${canvasRect.width}px`;
    wrapper.style.height = `${canvasRect.height}px`;
    wrapper.style.pointerEvents = 'none';
    wrapper.style.overflow = 'hidden';
    wrapper.style.zIndex = '1';

    if (!document.getElementById('superviz-autodesk-pins-wrapper')) {
      document.body.appendChild(wrapper);
    }

    this.divWrapper = wrapper;
  };

  /**
   * @function position3DToScreen
   * @description translates a 3D coordinate to a 2D screen position
   * @returns 2D screen coordinate
   * */
  private position3DToScreen(position3D: Vector3, offsetX, offsetY) {
    const vector = this.viewer.worldToClient(position3D);
    return {
      top: vector.y - offsetY,
      left: vector.x - offsetX,
    };
  }

  /**
   * @function checkIsVisible
   * @description check if a pin is in the cameras view
   * @returns boolean
   * */
  private async checkIsVisible(screenPos, originalPosition) {
    let visible = true;

    const hitTest = this.viewer.clientToWorld(
      screenPos.left,
      screenPos.top + this.pinHeight,
      false,
    );

    if (hitTest) {
      const hitPosition = hitTest.point;

      const distanceLocally = this.distanceBetween(hitPosition, originalPosition);
      const distance = Math.abs(distanceLocally);

      const threshold = this.hasLayerSelected ? 8 : 3;

      if (distance > threshold) {
        visible = false;
      }
    }

    return visible;
  }

  private distanceBetween = (v1, v2) => {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    const dz = v1.z - v2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  /**
   * @function createMouseElement
   * @description Creates a new mouse element for the canvas pin adapter.
   * @returns {HTMLElement} The newly created mouse element.
   */
  private createMouseElement(): HTMLElement {
    const mouseElement = document.createElement('superviz-comments-annotation-pin');
    mouseElement.setAttribute('type', 'add');
    mouseElement.setAttribute('annotation', JSON.stringify({}));
    mouseElement.setAttribute('position', JSON.stringify({ x: 0, y: 0 }));
    document.body.appendChild(mouseElement);

    this.viewer.canvas.style.cursor = 'none';

    return mouseElement;
  }

  private onMouseUp = (event: MouseEvent): void => {
    if (this.isDragging) return;

    const hitTest = this.viewer.clientToWorld(event.offsetX, event.offsetY, false);
    const mousePosition = hitTest.point;

    if (mousePosition) {
      const coordinates: PinCoordinates = {
        x: mousePosition.x,
        y: mousePosition.y,
        z: mousePosition.z,
        type: 'autodesk',
      };

      const camera = this.viewer.navigation.getCamera();
      camera.updateMatrixWorld();
      const origin: THREE.Vector3 = new Vector3(0, 0, 0);
      camera.getWorldPosition(origin);
      const positionInfo: AnnotationPositionInfo = {
        position: coordinates,
        camera: origin,
      };

      this.resetSelectedPin();
      this.onPinFixedObserver.publish(positionInfo);
      this.createTemporaryPin(coordinates);
    }
  };

  /**
   * @function onMouseDown
   * @description handles the mouse down event on the canvas.
   * @param event - The mouse event object.
   * @returns {void}
   */
  private onMouseDown = (event: MouseEvent): void => {
    this.isDragging = false;
  };

  /**
   * @function onMouseMove
   * @description handles the mouse move event on the canvas.
   * @param event - The mouse event object.
   * @returns {void}
   */
  private onMouseMove = (event: MouseEvent): void => {
    this.isDragging = true;

    const { x, y } = event;

    if (!this.mouseElement) {
      this.mouseElement = this.createMouseElement();
    }
    const adjustedY = y - this.pinHeight;
    this.mouseElement.setAttribute('position', JSON.stringify({ x, y: adjustedY }));
  };

  /**
   * @function onMouseLeave
   * @description
      Removes the mouse element and sets the canvas cursor
      to default when the mouse leaves the canvas.
   * @returns {void}
   */
  private onMouseLeave = (): void => {
    if (this.mouseElement) {
      this.mouseElement.remove();
      this.mouseElement = null;
    }

    this.viewer.canvas.style.cursor = 'default';
  };

  /**
   * @function onMouseEnter
   * @description
        Handles the mouse enter event for the canvas pin adapter.
        If there is no mouse element, creates one.
   * @returns {void}
   */
  private onMouseEnter = (): void => {
    if (this.mouseElement) return;

    this.mouseElement = this.createMouseElement();
  };

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
}
