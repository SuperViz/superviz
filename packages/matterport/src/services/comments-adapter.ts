// eslint-disable-next-line max-classes-per-file
import type { Annotation, PinAdapter, PinCoordinates } from '@superviz/sdk';
import type { Observer as ObserverType } from '@superviz/sdk/dist/common/utils/observer';
import { Vector3 } from 'three';

import type { Rotation, MpSdk as Matterport } from '../common/types/matterport.types';
import { Logger } from '../common/utils/logger';
import { Observer } from '../common/utils/observer';

import { HorizontalSide, Sides, ParticipantByGroupApi } from './types';

type AnnotationPositionInfo = {
  position: PinCoordinates;
  camera: Matterport.Camera.Pose;
};

let self: MatterportPin;
class ClickSpy {
  public eventType = 'INTERACTION.CLICK';
  public onEvent() {
    self.onClick();
  }
}

export class MatterportPin implements PinAdapter {
  private logger: Logger;
  private isPinsVisible: boolean = true;
  private isActive: boolean;
  private annotations: Annotation[];
  private pins: Map<string, HTMLElement>;
  private matterportSdk: Matterport;
  private cameraPose: Matterport.Camera.Pose;
  private intersection: Matterport.Pointer.Intersection;
  private intersectionObserver: Matterport.ISubscription;
  private showcaseDiv: HTMLElement;
  private showcaseSides: Sides;
  private divWrapper: HTMLElement;
  private inputComponent: Matterport.Scene.IComponent;
  private temporaryPinCoordinates: PinCoordinates;
  private divWrapperReplacementInterval: ReturnType<typeof setInterval> | null = null;
  private isSweeping: boolean = false;
  public onPinFixedObserver: ObserverType;
  private commentsSide: HorizontalSide = 'left';
  private selectedPin: HTMLElement | null = null;
  private participants: ParticipantByGroupApi[];

  constructor(matterportSdk: Matterport, showcase: HTMLElement) {
    if (typeof window === 'undefined') {
      throw new Error(
        '[SuperViz] MatterportPin cannot be initialized in a non-browser environment. Window is not defined',
      );
    }

    self = this;
    this.showcaseDiv = showcase;
    this.matterportSdk = matterportSdk;
    this.logger = new Logger('@superviz/sdk/comments-component/matterport-adapter');
    this.isActive = false;
    this.pins = new Map();
    this.divWrapper = this.createDivWrapper();

    this.matterportSdk.Asset.registerTexture(
      'pointer',
      'https://production.cdn.superviz.com/static/pin-add.png',
    );

    this.createInputListener();

    document.body.addEventListener('select-annotation', this.annotationSelected);
    document.body.addEventListener('toggle-annotation-sidebar', this.onToggleAnnotationSidebar);
    document.body.style.position = 'relative';
    this.onPinFixedObserver = new Observer() as unknown as ObserverType;
    this.annotations = [];
    this.renderAnnotationsPins();

    this.matterportSdk.Camera.pose.subscribe((pose) => {
      this.cameraPose = pose;

      if (this.isActive || this.isPinsVisible) {
        this.renderAnnotationsPins();
      }
    });
    this.showcaseSides = this.showcaseDiv.getBoundingClientRect();
  }

  /**
   * @function destroy
   * @description destroys the canvas pin adapter.
   * @returns {void}
   * */
  public destroy(): void {
    this.removeAnnotationsPins();
    this.removeListeners();
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
      this.matterportSdk.Pointer.editTexture('pointer');

      return;
    }

    this.matterportSdk.Pointer.resetTexture();
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
      temporaryPin.setAttribute('type', 'add');
      temporaryPin.setAttribute('showInput', '');
      temporaryPin.setAttribute('containerSides', JSON.stringify(this.showcaseSides));
      temporaryPin.setAttribute('commentsSide', this.commentsSide);
      temporaryPin.setAttribute('participantsList', JSON.stringify(this.participants));
      temporaryPin.setAttribute('position', JSON.stringify(this.temporaryPinCoordinates));
      temporaryPin.setAttribute('annotation', JSON.stringify({}));
      temporaryPin.setAttributeNode(document.createAttribute('active'));
    }

    const iframe = this.showcaseDiv;
    const { width, height } = iframe.getBoundingClientRect();
    const posScreen = this.position3DToScreen(coordinates, width, height, 0, -32);

    const screenCoordinates = {
      x: posScreen.left,
      y: posScreen.top,
      type: coordinates.type,
    };

    temporaryPin.setAttribute('position', JSON.stringify(screenCoordinates));

    this.divWrapper.appendChild(temporaryPin);
    this.pins.set('temporary-pin', temporaryPin);
  }

  /**
   * @function addListeners
   * @description adds event listeners to the canvas element.
   * @returns {void}
   */
  private addListeners(): void {
    this.intersectionObserver = this.matterportSdk.Pointer.intersection.subscribe(
      (intersection) => {
        this.intersection = intersection;
      },
    );
    this.inputComponent.inputs.eventsEnabled = true;
    this.inputComponent.inputs.userNavigationEnabled = false;
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
    document.body.removeEventListener('toggle-annotation-sidebar', this.onToggleAnnotationSidebar);
    this.intersectionObserver?.cancel();
    this.inputComponent.inputs.eventsEnabled = false;
    this.inputComponent.inputs.userNavigationEnabled = true;
    document.body.removeEventListener('keyup', this.resetPins);
    document.body.removeEventListener('click', this.hideTemporaryPin);
  }

  /**
   * @function renderAnnotationsPins
   * @description Renders the annotations on the canvas.
   * @returns {void}
   */
  private async renderAnnotationsPins(): Promise<void> {
    this.annotations.forEach(async (annotation) => {
      const annotationInfo: AnnotationPositionInfo = JSON.parse(
        annotation.position,
      ) as AnnotationPositionInfo;
      const coordinates: PinCoordinates = annotationInfo.position as PinCoordinates;
      if (coordinates?.type !== 'matterport' || annotation.resolved) {
        return;
      }

      if (!this.pins.has(annotation.uuid)) {
        this.createPin(annotation, coordinates);
      }

      const { width, height } = this.showcaseDiv.getBoundingClientRect();
      const posScreen = this.position3DToScreen(coordinates, width, height, 0, -32);
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
    const temporaryPin = this.pins.get('temporary-pin');
    if (temporaryPin) {
      const { width, height } = this.showcaseDiv.getBoundingClientRect();
      const posScreen = this.position3DToScreen(
        this.temporaryPinCoordinates,
        width,
        height,
        0,
        -32,
      );
      const visible = await this.checkIsVisible(posScreen, this.temporaryPinCoordinates);
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
   * @function setCommentsMetadata
   * @description sets the necessary data to be used by the pin element
   * @param {string} side - The side of the comments sidebar
   * @param {string} avatar - The avatar of the local user
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
    const { width, height } = this.showcaseDiv.getBoundingClientRect();
    // 32 é tamanho do pin
    const posScreen = this.position3DToScreen(coordinates, width, height, 0, -32);

    const pinElement = document.createElement('superviz-comments-annotation-pin');
    this.divWrapper.appendChild(pinElement);
    pinElement.setAttribute('type', 'show');
    pinElement.setAttribute('annotation', JSON.stringify(annotation));
    pinElement.setAttribute('position', JSON.stringify({ x: posScreen.left, y: posScreen.top }));
    pinElement.setAttribute('participantsList', JSON.stringify(this.participants));

    this.pins.set(annotation.uuid, pinElement);
  }

  // removes all the pins from the screen
  private removeAnnotationsPins(): void {
    this.pins.forEach((pinElement) => {
      pinElement.remove();
    });

    this.pins.clear();
  }

  /*
   * @function hideTemporaryPin
   * @description hides the temporary pin if click outside an observed element
   * @param {MouseEvent} event the mouse event object
   * @returns {void}
   */
  private hideTemporaryPin = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;

    if (this.showcaseDiv.contains(target) || this.pins.get('temporary-pin')?.contains(target))
      return;

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

  /** Callbacks  */

  // when an annotation is selected, it will highlight the pin
  private annotationSelected = ({ detail }: CustomEvent): void => {
    const { uuid, haltGoToPin, newPin } = detail;

    if (!uuid) return;

    if (newPin) {
      const pin = this.pins.get(uuid);
      pin.setAttribute('newPin', '');
    }

    const selectedPin = JSON.parse(this.selectedPin?.getAttribute('annotation') ?? '{}');

    this.resetPins();

    if (selectedPin?.uuid === uuid) return;

    document.body.dispatchEvent(new CustomEvent('close-temporary-annotation'));

    const pinElement = this.pins.get(uuid);

    if (!pinElement) return;

    pinElement.setAttribute('active', '');
    this.selectedPin = pinElement;

    const annotation = this.annotations.find((ann) => ann.uuid === uuid);
    if (annotation) {
      const positionInfo: AnnotationPositionInfo = JSON.parse(annotation.position);

      if (positionInfo && !haltGoToPin) {
        const pose: Matterport.Camera.Pose = positionInfo.camera;
        this.moveToSweep(pose.sweep, pose.rotation);
      }
    }
  };

  private moveToSweep(sweepId: string, rotation: Rotation) {
    if (this.isSweeping) {
      return;
    }

    this.isSweeping = true;
    this.matterportSdk.Sweep.moveTo(sweepId, {
      transitionTime: 500,
      transition: this.matterportSdk.Sweep.Transition.FLY,
      rotation,
    }).finally(() => {
      this.isSweeping = false;
    });
  }

  /**
   * @function onClick
   * @description callback when user clicked on iframe
   * @returns {void}
   * */
  public onClick = (): void => {
    if (!this.isActive) {
      return;
    }

    const coordinates: PinCoordinates = {
      x: this.intersection.position.x,
      y: this.intersection.position.y,
      z: this.intersection.position.z,
      type: 'matterport',
    };

    const positionInfo: AnnotationPositionInfo = {
      position: coordinates,
      camera: this.cameraPose,
    };

    this.resetSelectedPin();
    this.onPinFixedObserver.publish(positionInfo);

    this.createTemporaryPin(coordinates);
  };

  /**
   * @function createDivWrapper
   * @description Creates a div wrapper for the pins.
   * @returns {HTMLElement} The newly created div wrapper.
   * */
  private createDivWrapper(): HTMLElement {
    const canvasRect = this.showcaseDiv.getBoundingClientRect();
    const divWrapper = document.createElement('div');

    this.showcaseDiv.parentElement.style.position = 'relative';

    divWrapper.style.position = 'fixed';
    divWrapper.style.top = `${canvasRect.top}px`;
    divWrapper.style.left = `${canvasRect.left}px`;
    divWrapper.style.width = `${canvasRect.width}px`;
    divWrapper.style.height = `${canvasRect.height}px`;
    divWrapper.style.pointerEvents = 'none';
    divWrapper.style.overflow = 'hidden';

    if (!this.divWrapperReplacementInterval) {
      this.divWrapperReplacementInterval = setInterval(() => {
        const canvasRect = this.showcaseDiv.getBoundingClientRect();
        divWrapper.style.top = `${canvasRect.top}px`;
        divWrapper.style.left = `${canvasRect.left}px`;
        divWrapper.style.width = `${canvasRect.width}px`;
        divWrapper.style.height = `${canvasRect.height}px`;
      }, 1);
    }

    this.showcaseDiv.parentElement.appendChild(divWrapper);

    return divWrapper;
  }

  /**
   * @function createInputListener
   * @description create matterport click input listener
   * @returns {void}
   * */
  private async createInputListener() {
    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const node = sceneObject.addNode();
    this.inputComponent = node.addComponent('mp.input', {
      eventsEnabled: false,
      userNavigationEnabled: true,
    });
    node.start();
    this.inputComponent.spyOnEvent(new ClickSpy());
  }

  /**
   * @function position3DToScreen
   * @description translates a 3D coordinate to a 2D screen position
   * @returns 2D screen coordinate
   * */
  private position3DToScreen(position3D, width, height, offsetX, offsetY) {
    const size = {
      w: width,
      h: height,
    };

    const screenPos = this.matterportSdk.Conversion.worldToScreen(
      position3D,
      this.cameraPose,
      size,
    );

    return {
      top: Math.abs(screenPos.y) + offsetY,
      left: Math.abs(screenPos.x) + offsetX,
    };
  }

  /**
   * @function checkIsVisible
   * @description check if a pin is in the cameras view
   * @returns boolean
   * */
  private async checkIsVisible(screenPos, position) {
    const originalPosition = new Vector3(position.x, position.y, position.z);
    const data = await this.matterportSdk.Renderer.getWorldPositionData({
      x: screenPos.left,
      y: screenPos.top,
    });

    if (!data || !data.position) return false;

    const worldPosition = new Vector3(data.position.x, data.position.y, data.position.z);
    const difference = worldPosition.distanceTo(originalPosition);
    const threshold = 3; // threshold distance to hide pin when behind something

    return difference < threshold;
  }

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
