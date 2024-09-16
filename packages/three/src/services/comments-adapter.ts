// eslint-disable-next-line max-classes-per-file
import type {
  Annotation,
  PinAdapter,
  PinCoordinates,
  Observer as ObserverType,
} from '@superviz/sdk';
import { Vector3, Raycaster, Vector2, Camera, Scene, Renderer, Object3D } from 'three';

import { Logger } from '../common/utils/logger';
import { Observer } from '../common/utils/observer';

import {
  HorizontalSide,
  Sides,
  Simple2DPoint,
  SimpleParticipant,
  ParticipantByGroupApi,
} from './types';

type AnnotationPositionInfo = {
  position: PinCoordinates;
  camera: Vector3;
};

let self: ThreeJsPin;

export class ThreeJsPin implements PinAdapter {
  private logger: Logger;
  private isActive: boolean;
  private isPinsVisible: boolean = true;
  private annotations: Annotation[];
  private pins: Map<string, HTMLElement>;
  private scene: Scene;
  private camera: Camera;

  private showcaseDiv: HTMLElement;
  private divWrapper: HTMLElement;
  private mouseElement: HTMLElement;
  private temporaryPinCoordinates: PinCoordinates;
  private pinHeight: number;
  private animFrame;
  private onClickBinded;
  private animateBinded;
  public onPinFixedObserver: ObserverType;
  private controls;
  private player: Object3D;
  private showcaseSides: Sides;
  private commentsSide: HorizontalSide = 'left';
  private localParticipant: SimpleParticipant = {};
  private pointerDownCoordinates: Simple2DPoint;
  private selectedPin: HTMLElement | null;
  private participants: ParticipantByGroupApi[];

  constructor(scene: Scene, renderer: Renderer, camera: Camera, player?: Object3D, controls?: any) {
    self = this;
    this.scene = scene;
    this.camera = camera;
    this.showcaseDiv = renderer.domElement;

    this.controls = controls;
    if (this.player) {
      this.player = player;
    } else {
      this.player = camera;
    }

    this.logger = new Logger('@superviz/sdk/comments-component/three-js-adapter');
    this.isActive = false;
    this.pins = new Map();
    this.pinHeight = 40;
    this.onClickBinded = this.onClick.bind(this);
    this.animateBinded = this.animate.bind(this);

    document.body.style.position = 'relative';
    this.onPinFixedObserver = new Observer() as unknown as ObserverType;
    this.annotations = [];
    document.body.addEventListener('select-annotation', this.annotationSelected);
    document.body.addEventListener('toggle-annotation-sidebar', this.onToggleAnnotationSidebar);
    this.renderAnnotationsPins();
    this.animFrame = requestAnimationFrame(this.animateBinded);
    this.showcaseSides = this.showcaseDiv.getBoundingClientRect();
  }

  /**
   * @function destroy
   * @description destroys the canvas pin adapter.
   * @returns {void}
   * */
  public destroy(): void {
    document.body.removeEventListener('select-annotation', this.annotationSelected);
    document.body.removeEventListener('toggle-annotation-sidebar', this.onToggleAnnotationSidebar);
    cancelAnimationFrame(this.animFrame);
    this.removeAnnotationsPins();
    this.removeListeners();
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
      temporaryPin.setAttribute('position', JSON.stringify(this.temporaryPinCoordinates));
      temporaryPin.setAttribute('localAvatar', this.localParticipant.avatar ?? '');
      temporaryPin.setAttribute('participantsList', JSON.stringify(this.participants));
      temporaryPin.setAttribute('localName', this.localParticipant.name ?? '');
      temporaryPin.setAttribute('annotation', JSON.stringify({}));
      temporaryPin.setAttributeNode(document.createAttribute('active'));
      temporaryPin.style.pointerEvents = 'auto';
    }

    const posScreen = this.position3DToScreen(coordinates, 0, this.pinHeight);

    const coordinatesInfo = {
      x: posScreen.left,
      y: posScreen.top,
      type: coordinates.type,
    };

    temporaryPin.setAttribute('position', JSON.stringify(coordinatesInfo));

    this.divWrapper.appendChild(temporaryPin);
    this.pins.set('temporary-pin', temporaryPin);
    this.renderAnnotationsPins();
  }

  /**
   * @function addListeners
   * @description adds event listeners to the canvas element.
   * @returns {void}
   */
  private addListeners(): void {
    document.body.addEventListener('select-annotation', this.annotationSelected);
    this.showcaseDiv.addEventListener('pointerdown', this.setPointerDownCoordinates);
    this.showcaseDiv.addEventListener('click', this.onClickBinded);
    this.showcaseDiv.addEventListener('mousemove', this.onMouseMove);
    this.showcaseDiv.addEventListener('mouseout', this.onMouseLeave);
    this.showcaseDiv.addEventListener('mouseenter', this.onMouseEnter);
    document.body.addEventListener('keyup', this.resetPins);
    document.body.addEventListener('click', this.hideTemporaryPin);
  }

  /**
   * @function removeListeners
   * @description removes event listeners from the canvas element.
   * @returns {void}
   * */
  private removeListeners(): void {
    document.body.removeEventListener('select-annotation', this.annotationSelected);
    this.showcaseDiv.removeEventListener('pointerdown', this.setPointerDownCoordinates);
    this.showcaseDiv.removeEventListener('click', this.onClick);
    this.showcaseDiv.removeEventListener('mousemove', this.onMouseMove);
    this.showcaseDiv.removeEventListener('mouseout', this.onMouseLeave);
    this.showcaseDiv.removeEventListener('mouseenter', this.onMouseEnter);
    document.body.removeEventListener('keyup', this.resetPins);
    document.body.removeEventListener('click', this.hideTemporaryPin);
  }

  /**
   * @function animate
   * @description animation frame
   * @returns {void}
   */
  private animate(): void {
    if (this.isActive || this.isPinsVisible) {
      this.renderAnnotationsPins();
    }

    this.renderDivWrapper();
    this.animFrame = requestAnimationFrame(this.animateBinded);
  }

  /**
   * @function renderAnnotationsPins
   * @description Renders the annotations on the canvas.
   * @returns {void}
   */
  private async renderAnnotationsPins(): Promise<void> {
    this.annotations.forEach(async (annotation) => {
      if (!annotation.position) return;

      const annotationInfo: AnnotationPositionInfo = JSON.parse(
        annotation.position,
      ) as AnnotationPositionInfo;

      const coordinates: PinCoordinates = annotationInfo?.position as PinCoordinates;

      if (coordinates?.type !== 'threejs' || annotation.resolved) {
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
   * @function hideTemporaryPin
   * @description hides the temporary pin if click outside an observed element
   * @param {MouseEvent} event the mouse event object
   * @returns {void}
   */
  private hideTemporaryPin = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;

    if (this.showcaseDiv.contains(target) || this.pins.get('temporary-pin')?.contains(target)) {
      return;
    }

    this.removeAnnotationPin('temporary-pin');
  };

  /**
   * @function setPointerDownCoordinates
   * @description stores the mouse down coordinates
   * @param {MouseEvent} event - The mouse event object.
   * @returns {void}
   */
  private setPointerDownCoordinates = ({ x, y }: MouseEvent) => {
    this.pointerDownCoordinates = { x, y };
  };

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

  private removeAnnotationsPins(): void {
    this.pins.forEach((pinElement) => {
      pinElement.remove();
    });

    this.pins.clear();
  }

  /**
   * @function participantsList
   * @description - all participants of developer groupId
   * @param participants - all participants list
   */
  public set participantsList(participants: ParticipantByGroupApi[]) {
    this.participants = participants;
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

    const positionInfo: AnnotationPositionInfo = JSON.parse(
      this.annotations.find((ann) => ann.uuid === uuid).position,
    );

    if (positionInfo && !haltGoToPin) {
      this.onClickedPin(positionInfo);
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
   * @function onClickedPin
   * @description move to pin position
   * @returns {void}
   * */
  private onClickedPin(positionInfo: AnnotationPositionInfo) {
    const annotationPosition = new Vector3(
      positionInfo.position.x,
      positionInfo.position.y,
      positionInfo.position.z,
    );

    const cameraPosition = new Vector3(
      positionInfo.camera.x,
      positionInfo.camera.y,
      positionInfo.camera.z,
    );

    let destPosition;
    if (cameraPosition.distanceTo(annotationPosition) > 3) {
      destPosition = cameraPosition.lerp(annotationPosition, 0.8);
    } else {
      destPosition = cameraPosition;
    }

    if (this.controls) {
      this.controls.target = annotationPosition;
    }

    const moveAnimation = setInterval(() => {
      const speed = 0.02;
      const curPosition = this.player.position.clone();
      curPosition.lerp(destPosition, speed);
      this.player.position.set(curPosition.x, curPosition.y, curPosition.z);
      this.player.lookAt(annotationPosition);
    }, 1);
    setTimeout(() => {
      this.player.lookAt(annotationPosition);
      clearInterval(moveAnimation);
    }, 1000);
  }

  /**
   * @function onClick
   * @description callback when user clicked on iframe
   * @returns {void}
   * */
  public onClick = (evt): void => {
    if (!this.isActive) return;

    {
      const rect = this.showcaseDiv.getBoundingClientRect();
      const { x: pointerDownX, y: pointerDownY } = this.pointerDownCoordinates;
      const originalX = pointerDownX - rect.x;
      const originalY = pointerDownY - rect.y;
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;

      const distance = Math.hypot(x - originalX, y - originalY);
      if (distance > 10) return;
    }

    const raycaster = new Raycaster();

    const mouse = new Vector2();
    this.camera.updateMatrixWorld();
    const rect = this.showcaseDiv.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    mouse.x = (x / this.showcaseDiv.clientWidth) * 2 - 1;
    mouse.y = (y / this.showcaseDiv.clientHeight) * -2 + 1;
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      // @ts-ignore
      const intersect = intersects.filter((i) => !i.object.isLine)[0];
      if (intersect) {
        const coordinates: PinCoordinates = {
          x: intersect.point.x,
          y: intersect.point.y,
          z: intersect.point.z,
          type: 'threejs',
        };
        const positionInfo = {
          position: coordinates,
          camera: this.camera.position,
        };

        this.resetSelectedPin();
        this.onPinFixedObserver.publish(positionInfo);
        this.createTemporaryPin(coordinates);
      }
    }
  };

  /**
   * @function renderDivWrapper
   * @description Creates a div wrapper for the pins.
   * */
  private renderDivWrapper = (): void => {
    const canvasRect = this.showcaseDiv.getBoundingClientRect();
    let wrapper = this.divWrapper;

    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'superviz-autodesk-pins-wrapper';
    }

    wrapper.style.position = 'absolute';
    wrapper.style.top = `${this.showcaseDiv.offsetTop}px`;
    wrapper.style.left = `${this.showcaseDiv.offsetLeft}px`;
    wrapper.style.width = `${canvasRect.width}px`;
    wrapper.style.height = `${canvasRect.height}px`;
    wrapper.style.pointerEvents = 'none';
    wrapper.style.overflow = 'hidden';
    wrapper.style.zIndex = '1';

    if (this.showcaseDiv.parentElement.style.position === 'static') {
      this.showcaseDiv.parentElement.style.position = 'relative';
    }

    if (!document.getElementById('superviz-autodesk-pins-wrapper')) {
      this.showcaseDiv.parentElement.appendChild(wrapper);
    }

    this.divWrapper = wrapper;
  };

  /**
   * @function position3DToScreen
   * @description translates a 3D coordinate to a 2D screen position
   * @returns 2D screen coordinate
   * */
  private position3DToScreen(position3D: PinCoordinates, offsetX, offsetY) {
    const vec = new Vector3(0, 0, 0);
    vec.set(position3D.x, position3D.y, position3D.z);
    this.camera.updateMatrixWorld();
    vec.project(this.camera);

    const rect = this.showcaseDiv.getBoundingClientRect();

    const widthHalf = this.showcaseDiv.clientWidth / 2;
    const heightHalf = this.showcaseDiv.clientHeight / 2;

    vec.x = vec.x * widthHalf + widthHalf;
    vec.y = -(vec.y * heightHalf) + heightHalf;
    vec.z = 0;
    return {
      top: vec.y - offsetY,
      left: vec.x - offsetX,
    };
  }

  /**
   * @function checkIsVisible
   * @description check if a pin is in the cameras view
   * @returns boolean
   * */
  private async checkIsVisible(screenPos, originalPosition) {
    let visible = false;

    const raycaster = new Raycaster();

    const rayOrigin = new Vector2();
    const x = screenPos.left;
    const y = screenPos.top + this.pinHeight;

    rayOrigin.x = (x / this.showcaseDiv.clientWidth) * 2 - 1;
    rayOrigin.y = (y / this.showcaseDiv.clientHeight) * -2 + 1;

    raycaster.setFromCamera(rayOrigin, this.camera);

    const intersects = raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      // @ts-ignore
      const intersect = intersects.filter((i) => !i.object.isLine)[0];
      if (intersect) {
        const hitPosition = intersect.point;

        const distanceLocally = this.distanceBetween(hitPosition, originalPosition);
        const distance = Math.abs(distanceLocally);
        const threshold = 0.2;
        if (distance < threshold) {
          visible = true;
        }
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

    this.showcaseDiv.style.cursor = 'none';

    return mouseElement;
  }

  /**
   * @function onMouseMove
   * @description handles the mouse move event on the canvas.
   * @param event - The mouse event object.
   * @returns {void}
   */
  private onMouseMove = (event: MouseEvent): void => {
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

    this.showcaseDiv.style.cursor = 'default';
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
