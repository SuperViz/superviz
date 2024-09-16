import { isEqual } from 'lodash';

import { ParticipantByGroupApi } from '../../../common/types/participant.types';
import { Logger, Observer } from '../../../common/utils';
import { PinMode } from '../../../web-components/comments/components/types';
import { Annotation, PinAdapter, PinCoordinates } from '../types';

import { HorizontalSide, Simple2DPoint, TemporaryPinData, HTMLPinOptions } from './types';

export class HTMLPin implements PinAdapter {
  // Public properties
  // Observers
  public onPinFixedObserver: Observer;

  // Private properties
  // Comments data
  private annotations: Annotation[];

  declare participants: ParticipantByGroupApi[];

  // Loggers
  private logger: Logger;

  // Booleans
  private isActive: boolean;
  private isPinsVisible: boolean = true;
  private movedTemporaryPin: boolean;

  // Data about the current state of the application
  private selectedPin: HTMLElement | null = null;
  private dataAttribute: string = 'data-superviz-id';
  private animateFrame: number;
  private dataAttributeValueFilters: RegExp[];

  // Coordinates/Positions
  private mouseDownCoordinates: Simple2DPoint;
  private commentsSide: HorizontalSide = 'left';
  private temporaryPinCoordinates: TemporaryPinData = {};

  // Elements
  private container: HTMLElement;
  private elementsWithDataId: Record<string, HTMLElement> = {};
  private divWrappers: Map<string, HTMLElement> = new Map();
  private pins: Map<string, HTMLElement>;
  private voidElementsWrappers: Map<string, HTMLElement> = new Map();
  private svgWrappers: HTMLElement;
  private hoveredWrapper: HTMLElement;

  // Observers
  private mutationObserver: MutationObserver;

  // Consts
  private readonly VOID_ELEMENTS = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
    'svg',
    'rect',
    'ellipse',
  ];

  constructor(containerId: string, options: HTMLPinOptions = {}) {
    this.logger = new Logger('@superviz/sdk/comments-component/container-pin-adapter');
    this.container = document.getElementById(containerId) as HTMLElement;

    if (!this.container) {
      const message = `Element with id ${containerId} not found`;
      this.logger.log(message);
      throw new Error(message);
    }

    if (typeof options !== 'object')
      throw new Error('Second argument of the HTMLPin constructor must be an object');

    const { dataAttributeName, dataAttributeValueFilters } = options;

    if (dataAttributeName === '') throw new Error('dataAttributeName must be a non-empty string');
    if (dataAttributeName === null) throw new Error('dataAttributeName cannot be null');
    if (dataAttributeName !== undefined && typeof dataAttributeName !== 'string')
      throw new Error('dataAttributeName must be a non-empty string');

    this.dataAttribute = dataAttributeName || this.dataAttribute;
    this.dataAttributeValueFilters = dataAttributeValueFilters || [];

    this.isActive = false;
    this.prepareElements();

    this.mutationObserver = new MutationObserver(this.handleMutationObserverChanges);
    this.observeContainer();

    this.pins = new Map();
    this.onPinFixedObserver = new Observer({ logger: this.logger });
    this.annotations = [];

    document.body.addEventListener('select-annotation', this.annotationSelected);
    document.body.addEventListener('keyup', this.resetPins);

    if (!this.voidElementsWrappers.size) return;
    this.animateFrame = requestAnimationFrame(this.animate);
  }

  // ------- setup -------
  /**
   * @function destroy
   * @description destroys the pin adapter.
   * @returns {void}
   * */
  public destroy(): void {
    this.logger.log('Destroying HTML Pin Adapter for Comments');
    this.removeListeners();
    this.removeObservers();
    this.divWrappers.forEach((divWrapper) => divWrapper.remove());
    this.divWrappers.clear();
    this.pins.forEach((pin) => pin.remove());
    this.pins.clear();
    this.divWrappers = undefined;
    this.pins = undefined;
    this.elementsWithDataId = undefined;
    this.logger = undefined;
    this.onPinFixedObserver.destroy();
    this.onPinFixedObserver = undefined;
    this.container = undefined;
    this.voidElementsWrappers.clear();
    this.voidElementsWrappers = undefined;
    this.annotations = [];
    this.svgWrappers?.remove();
    this.svgWrappers = undefined;
    document.body.removeEventListener('select-annotation', this.annotationSelected);
    document.body.removeEventListener('toggle-annotation-sidebar', this.onToggleAnnotationSidebar);

    cancelAnimationFrame(this.animateFrame);
  }

  /**
   * @function addElementListeners
   * @description adds event listeners to the element.
   * @param {string} id the id of the element to add the listeners to.
   * @returns {void}
   */
  private addElementListeners(id: string): void {
    this.divWrappers.get(id).addEventListener('click', this.onClick, true);
    this.divWrappers.get(id).addEventListener('mousedown', this.onMouseDown);
    this.divWrappers.get(id).addEventListener('mouseenter', this.onMouseEnter);
    this.divWrappers.get(id).addEventListener('mouseleave', this.onMouseLeave);
  }

  /**
   * @function removeElementListeners
   * @description removes event listeners from the element
   * @param {string} id the id of the element to remove the listeners from.
   * @returns {void}
   */
  private removeElementListeners(id: string): void {
    this.divWrappers.get(id).removeEventListener('click', this.onClick, true);
    this.divWrappers.get(id).removeEventListener('mousedown', this.onMouseDown);
    this.divWrappers.get(id).removeEventListener('mouseenter', this.onMouseEnter);
    this.divWrappers.get(id).removeEventListener('mouseleave', this.onMouseLeave);
  }

  /**
   * @public setParticipantsList
   */
  public set participantsList(participants: ParticipantByGroupApi[]) {
    this.participants = participants;
  }

  /**
   * @function removeObservers
   * @description disconnects the observers.
   * @returns {void}
   */
  private removeObservers(): void {
    this.mutationObserver.disconnect();
    this.mutationObserver = undefined;
  }

  /**
   * @function addListeners
   * @description adds event listeners to the container element.
   * @returns {void}
   */
  private addListeners(): void {
    this.divWrappers.forEach((_, id) => this.addElementListeners(id));
    document.body.addEventListener('toggle-annotation-sidebar', this.onToggleAnnotationSidebar);
    document.body.addEventListener('click', this.hideTemporaryPin);
  }

  /**
   * @function animate
   * @description updates the position of the wrappers of the void elements.
   * @returns {void}
   */
  private animate = (): void => {
    if (this.voidElementsWrappers) {
      this.updatePinsPositions();
      this.animateFrame = requestAnimationFrame(this.animate);
    }
  };

  /**
   * @function removeListeners
   * @description removes event listeners from the container element.
   * @returns {void}
   * */
  private removeListeners(): void {
    this.divWrappers.forEach((_, id) => this.removeElementListeners(id));
    document.body.removeEventListener('keyup', this.resetPins);
    document.body.removeEventListener('click', this.hideTemporaryPin);
  }

  /**
   * @function observeContainer
   * @description observes the container for changes in the specified data attribute.
   * @returns {void}
   */
  private observeContainer(): void {
    this.mutationObserver.observe(this.container, {
      subtree: true,
      attributes: true,
      attributeFilter: [this.dataAttribute],
      attributeOldValue: true,
    });
  }

  /**
   * @function prepareElements
   * @description sets elements with the specified data attribute as pinnable.
   * @returns {void}
   */
  private prepareElements(): void {
    const elementsWithDataId = this.container.querySelectorAll(`[${this.dataAttribute}]`);

    elementsWithDataId.forEach((el: HTMLElement) => {
      const id = el.getAttribute(this.dataAttribute);
      const skip = this.dataAttributeValueFilters.some((filter) => {
        return id.match(filter);
      });

      if (skip) return;

      this.setElementReadyToPin(el, id);
    });
  }

  /**
   * @function addAllCursors
   * @description sets the mouse cursor to a special cursor when hovering over all the elements with the specified data-attribute.
   * @returns {void}
   */
  private addAllCursors(): void {
    this.divWrappers.forEach((wrapper, id) => {
      this.addCursor(wrapper, id);
    });
  }

  /**
   * @function removeAddCursor
   * @description removes the special cursor.
   * @returns {void}
   */
  private removeAddCursor(): void {
    this.divWrappers.forEach((wrapper, id) => {
      let element: HTMLElement | SVGElement = wrapper;

      const isSvgElement = wrapper.getAttribute('data-wrapper-type');
      if (isSvgElement) {
        const elementTagname = isSvgElement.split('-')[1];
        element = this.divWrappers.get(id).querySelector(elementTagname);
      }

      element.style.setProperty('cursor', 'default');
      element.style.setProperty('pointer-events', 'none');
    });
  }

  // ------- public methods -------
  /**
   * @function setPinsVisibility
   * @description sets the visibility of the pins, hides them if it is not visible.
   * @param {boolean} isVisible controls the visibility of the pins.
   * @returns {void}
   */
  public setPinsVisibility(isVisible: boolean): void {
    this.isPinsVisible = isVisible;

    if (this.isPinsVisible) {
      this.renderAnnotationsPins();
    }

    this.removeAnnotationsPins();
  }

  /**
   * @function removeAnnotationPin
   * @description Removes an annotation pin from the container.
   * @param {string} uuid - The uuid of the annotation to be removed.
   * @returns {void}
   * */
  public removeAnnotationPin(uuid: string): void {
    const pinElement = this.pins.get(uuid);

    if (!pinElement && uuid === 'temporary-pin') return;

    if (pinElement) {
      pinElement.remove();
      this.pins.delete(uuid);
    }

    if (uuid === 'temporary-pin') return;

    this.annotations = this.annotations.filter((annotation) => {
      return annotation.uuid !== uuid;
    });
  }

  /**
   * @function setCommentsMetadata
   * @description stores data related to the local participant
   * @param {HorizontalSide} side whether the comments sidebar is on the left or right side of the screen
   * @param {string} avatar the avatar of the local participant
   * @param {string} name the name of the local participant
   * @returns {void}
   */
  public setCommentsMetadata = (side: HorizontalSide): void => {
    this.commentsSide = side;
  };

  /**
   * @function updateAnnotations
   * @description updates the annotations of the container.
   * @param {Annotation[]} annotations new annotation to be added to the container.
   * @returns {void}
   */
  public updateAnnotations(annotations: Annotation[]): void {
    this.logger.log('updateAnnotations', annotations);

    this.annotations = annotations;

    if (!this.isPinsVisible) return;

    this.removeAnnotationsPins();
    this.renderAnnotationsPins();
  }

  /**
   * @function setActive
   * @description sets the container pin adapter as active or not
   * @param {boolean} isOpen whether the container pin adapter is active or not.
   * @returns {void}
   */
  public setActive(isOpen: boolean): void {
    if (this.isActive === isOpen) return;

    this.isActive = isOpen;

    if (this.isActive) {
      this.addListeners();
      this.addAllCursors();
      this.prepareElements();
      return;
    }

    this.resetPins();
    this.removeListeners();
    this.removeAddCursor();
  }

  /**
   * @function renderTemporaryPin
   * @description creates a temporary pin with the id temporary-pin to mark where the annotation is being created
   * @param {string} elementId the id of the element where the temporary pin will be rendered.
   * @returns {void}
   */
  public renderTemporaryPin(elementId?: string): void {
    this.temporaryPinCoordinates.elementId ||= elementId;
    let temporaryPin = this.pins.get('temporary-pin');

    if (elementId && elementId !== this.temporaryPinCoordinates.elementId) {
      this.pins.get('temporary-pin').remove();
      this.pins.delete('temporary-pin');

      this.temporaryPinCoordinates.elementId = elementId;
      temporaryPin = null;
    }

    if (!temporaryPin) {
      const elementSides = this.elementsWithDataId[elementId]?.getBoundingClientRect();

      temporaryPin = document.createElement('superviz-comments-annotation-pin');

      temporaryPin.id = 'superviz-temporary-pin';
      temporaryPin.setAttribute('type', PinMode.ADD);
      temporaryPin.setAttribute('showInput', '');
      temporaryPin.setAttribute('containerSides', JSON.stringify(elementSides));
      temporaryPin.setAttribute('commentsSide', this.commentsSide);
      temporaryPin.setAttribute('position', JSON.stringify(this.temporaryPinCoordinates));
      temporaryPin.setAttribute('annotation', JSON.stringify({}));
      temporaryPin.setAttribute('participantsList', JSON.stringify(this.participants));

      temporaryPin.setAttribute('keepPositionRatio', '');
      temporaryPin.setAttributeNode(document.createAttribute('active'));

      this.addTemporaryPinToElement(elementId, temporaryPin);
    }

    const { x, y } = this.temporaryPinCoordinates;

    temporaryPin.setAttribute('position', JSON.stringify({ x, y }));

    this.pins.set('temporary-pin', temporaryPin);
  }

  // ------- regular methods -------
  /**
   * @function renderAnnotationsPins
   * @description appends the pins on the container.
   * @returns {void}
   */
  private renderAnnotationsPins(): void {
    if (!this.annotations.length) {
      this.removeAnnotationsPins();
      return;
    }

    this.annotations.forEach((annotation) => {
      if (annotation.resolved) {
        return;
      }

      const { x, y, elementId, type } = JSON.parse(annotation.position) as PinCoordinates;
      if (type !== 'html') return;

      if (this.pins.has(annotation.uuid)) {
        return;
      }

      const element = this.elementsWithDataId[elementId];
      if (!element) return;

      const wrapper = this.divWrappers.get(elementId);
      if (!wrapper) return;

      const pinElement = this.createPin(annotation, x, y);
      wrapper.appendChild(pinElement);
      this.pins.set(annotation.uuid, pinElement);
    });
  }

  /**
   * @function updatePinsPositions
   * @description updates the position of the wrappers of the void elements.
   * @returns {void}
   */
  private updatePinsPositions() {
    this.voidElementsWrappers.forEach((wrapper, id) => {
      const wrapperRect = JSON.stringify(wrapper.getBoundingClientRect());
      let elementRect = this.elementsWithDataId[id].getBoundingClientRect();

      if (this.elementsWithDataId[id].tagName.toLowerCase() === 'ellipse') {
        elementRect = (
          this.elementsWithDataId[id] as unknown as SVGEllipseElement
        ).viewportElement.getBoundingClientRect();
      }

      if (isEqual(JSON.stringify(elementRect), wrapperRect)) return;

      wrapper.style.setProperty('top', `${elementRect.top}px`);
      wrapper.style.setProperty('left', `${elementRect.left}px`);
      wrapper.style.setProperty('width', `${elementRect.width}px`);
      wrapper.style.setProperty('height', `${elementRect.height}px`);
    });
  }

  /**
   * @function hideTemporaryPin
   * @description hides the temporary pin if click outside an observed element
   * @param {MouseEvent} event the mouse event object
   * @returns {void}
   */
  private hideTemporaryPin = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const temporaryPinWrapper = this.divWrappers.get(this.temporaryPinCoordinates.elementId);

    if (!temporaryPinWrapper) return;

    const clickedOnWrapper = temporaryPinWrapper.contains(target);
    const clickedOnTemporaryPin = this.pins.get('temporary-pin')?.contains(target);

    if (clickedOnWrapper || clickedOnTemporaryPin) return;

    this.removeAnnotationPin('temporary-pin');
    this.temporaryPinCoordinates = {};
  };

  /**
   * @function clearElement
   * @description clears an element that no longer has the specified data attribute
   * @param {string} id the id of the element to be cleared
   * @returns {void}
   */
  private clearElement(id: string): void {
    const element = this.elementsWithDataId[id];
    if (!element) return;

    const wrapper = this.divWrappers.get(id);
    if (wrapper) {
      const pins = wrapper.children;
      const { length } = pins;

      for (let i = 0; i < length; ++i) {
        const pin = pins.item(i);
        this.pins.delete(pin.id);
      }

      wrapper.remove();
    }

    this.voidElementsWrappers.delete(id);
    this.removeElementListeners(id);
    this.divWrappers.delete(id);
    this.elementsWithDataId[id] = undefined;

    if (!this.voidElementsWrappers.size) {
      cancelAnimationFrame(this.animateFrame);
      this.animateFrame = undefined;
    }
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
   * @function resetHoveredWrapper
   * @description removes the outline of the currently hovered wrapper
   * @returns {void}
   */
  private resetHoveredWrapper(): void {
    if (!this.hoveredWrapper) return;
    this.onMouseLeave({ target: this.hoveredWrapper } as unknown as MouseEvent);
  }

  /**
   * @function removeAnnotationsPins
   * @description clears all pins from the container.
   * @returns {void}
   */
  private removeAnnotationsPins(): void {
    this.pins.forEach((pinElement) => {
      pinElement.remove();
    });

    this.pins.clear();
  }

  /**
   * @function setElementReadyToPin
   * @description prepare an element with all necessary to add pins over it
   * @param {HTMLElement} element
   * @param {string} id
   * @returns {void}
   */
  private setElementReadyToPin(element: Element, id: string): void {
    if (this.elementsWithDataId[id]) return;

    this.elementsWithDataId[id] = element as HTMLElement;

    if (!this.divWrappers.get(id)) {
      const divWrapper = this.createWrapper(element, id);
      this.divWrappers.set(id, divWrapper);
    }

    if (!this.isActive || !this.isPinsVisible) return;

    this.addCursor(this.divWrappers.get(id), id);
    this.addElementListeners(id);
  }

  /**
   * @function handleSvgElement
   * @description handles the svg element and creates a wrapper for it
   * @param {Element} element the svg element to be handled
   * @param {HTMLDivElement} wrapper the wrapper for the svg element
   * @returns {HTMLDivElement} the wrapper for the svg element
   */
  private handleSvgElement(element: Element, wrapper: HTMLDivElement): HTMLDivElement {
    const viewport = (element as SVGElement).viewportElement;

    const isNormalHTML = viewport === undefined;
    if (isNormalHTML) return;

    const isSvgElement = element.tagName.toLowerCase() === 'svg';
    if (isSvgElement) {
      const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      foreignObject.setAttribute('height', '100%');
      foreignObject.setAttribute('width', '100%');
      foreignObject.style.setProperty('overflow', 'visible');
      foreignObject.appendChild(wrapper);
      element.appendChild(foreignObject);
      (element as SVGElement).style.setProperty('overflow', 'visible');
      return wrapper;
    }

    const elementName = element.tagName.toLowerCase();
    const isEllipseElement = elementName === 'ellipse';
    const isRectElement = elementName === 'rect';

    if (!isEllipseElement && !isRectElement) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', elementName);

    let x: number | string;
    let y: number | string;
    let width: string;
    let height: string;
    let rx: string;
    let ry: string;

    if (isRectElement) {
      const rect = element as SVGRectElement;
      x = rect.getAttribute('x');
      y = rect.getAttribute('y');
      width = rect.getAttribute('width');
      height = rect.getAttribute('height');
      rx = rect.getAttribute('rx');
      ry = rect.getAttribute('ry');
      svgElement.setAttribute('fill', 'transparent');
      svgElement.setAttribute('stroke', 'transparent');
      svgElement.setAttribute('x', '0');
      svgElement.setAttribute('y', '0');
      svgElement.setAttribute('rx', rx);
      svgElement.setAttribute('ry', ry);
    }

    if (isEllipseElement) {
      const cx = element.getAttribute('cx');
      const cy = element.getAttribute('cy');

      rx = element.getAttribute('rx');
      ry = element.getAttribute('ry');
      x = Number(cx) - Number(rx);
      y = Number(cy) - Number(ry);

      const { width: elementWidth, height: elementHeight } = viewport.getBoundingClientRect();

      width = `${elementWidth}px`;
      height = `${elementHeight}px`;

      svgElement.setAttribute('fill', 'transparent');
      svgElement.setAttribute('stroke', 'transparent');
      svgElement.setAttribute('cx', cx);
      svgElement.setAttribute('cy', cy);
      svgElement.setAttribute('rx', rx);
      svgElement.setAttribute('ry', ry);
    }

    svgElement.setAttribute('height', height);
    svgElement.setAttribute('width', width);

    svg.setAttribute('height', height);
    svg.setAttribute('width', width);

    svg.appendChild(svgElement);

    wrapper.appendChild(svg);

    (element as SVGElement).style.setProperty('overflow', 'visible');
    wrapper.setAttribute('data-wrapper-type', `svg-${elementName}`);
    return wrapper;
  }

  /**
   * @function resetPins
   * @description Unselects selected pin and removes temporary pin.
   * @param {KeyboardEvent} event the keyboard event object, this should be 'Escape'.
   * @returns {void}
   * */
  private resetPins = (event?: KeyboardEvent): void => {
    if (event && event?.key !== 'Escape') return;

    this.resetSelectedPin();
    this.resetHoveredWrapper();

    if (!this.temporaryPinCoordinates.elementId) return;

    this.removeAnnotationPin('temporary-pin');
    this.temporaryPinCoordinates = {};
  };

  /**
   * @function annotationSelected
   * @description highlights the selected annotation
   * @param {CustomEvent} event the emitted event object with the uuid of the selected annotation
   * @returns {void}
   */
  private annotationSelected = ({ detail: { uuid, newPin } }: CustomEvent): void => {
    if (!uuid) return;

    if (newPin) {
      const pin = this.pins.get(uuid);
      pin.setAttribute('newPin', '');
    }

    const annotation = this.annotations.find(
      (annotation) => annotation.uuid === this.selectedPin?.id,
    );

    this.resetPins();

    if (annotation?.uuid === uuid) return;

    document.body.dispatchEvent(new CustomEvent('close-temporary-annotation'));

    const pinElement = this.pins.get(uuid);

    if (!pinElement) return;

    pinElement.setAttribute('active', '');

    this.selectedPin = pinElement;

    const newSelectedAnnotation = this.annotations.find((annotation) => annotation.uuid === uuid);
    this.selectedPin.setAttribute(
      'elementId',
      JSON.parse(newSelectedAnnotation.position).elementId,
    );
  };

  /**
   * @function addTemporaryPinToElement
   * @description adds the temporary pin and the temporary pin container to the element with the specified id.
   * @param {string} elementId the id of the element where the temporary pin will be rendered.
   * @param {HTMLElement} pin the temporary pin to be rendered.
   * @returns {void}
   */
  private addTemporaryPinToElement(elementId: string, pin: HTMLElement): void {
    const element = this.elementsWithDataId[elementId];
    if (!element) return;

    const wrapper = this.divWrappers.get(elementId);
    if (!wrapper) return;

    wrapper.appendChild(pin);
  }

  // ------- helper functions -------
  /**
   * @function createPin
   * @description creates a pin element and sets its properties
   * @param {Annotation} annotation the annotation associated to the pin to be rendered
   * @param {number} x the x coordinate of the pin
   * @param {number} y the y coordinate of the pin
   * @returns {HTMLElement} the pin element
   */
  private createPin(annotation: Annotation, x: number, y: number) {
    const pinElement = document.createElement('superviz-comments-annotation-pin');
    pinElement.setAttribute('type', PinMode.SHOW);
    pinElement.setAttribute('annotation', JSON.stringify(annotation));
    pinElement.setAttribute('position', JSON.stringify({ x, y }));
    pinElement.setAttribute('keepPositionRatio', '');
    pinElement.setAttribute('participantsList', JSON.stringify(this.participants));
    pinElement.id = annotation.uuid;

    return pinElement;
  }

  /**
   * @function addCursor
   * @description sets the mouse cursor to a special cursor when hovering over the element with the specified id
   * @param {HTMLElement} wrapper the wrapper of the element
   * @param {string} id the id of the element
   * @returns {void}
   */
  private addCursor(wrapper: HTMLElement | SVGElement, id: string): void {
    let element: HTMLElement | SVGElement = wrapper;

    const isSvgElement = wrapper.getAttribute('data-wrapper-type');
    if (isSvgElement) {
      const elementTagname = isSvgElement.split('-')[1];
      element = this.divWrappers.get(id).querySelector(elementTagname);
    }

    element.style.setProperty(
      'cursor',
      'url("https://production.cdn.superviz.com/static/pin-html.png") 0 100, pointer',
    );
    element.style.setProperty('pointer-events', 'auto');
  }

  /**
   * @function createWrapper
   * @description creates a wrapper for the element with the specified id
   * @param {HTMLElement} element the element to be wrapped
   * @param {string} id the id of the element to be wrapped
   * @returns {HTMLElement} the new wrapper element
   */
  private createWrapper(element: Element, id: string): HTMLElement {
    const wrapperId = `superviz-id-${id}`;

    if (this.divWrappers.get(id)) return;

    const containerRect = element.getBoundingClientRect();

    let containerWrapper = document.createElement('div');
    containerWrapper.setAttribute('data-wrapper-id', id);
    containerWrapper.id = wrapperId;

    containerWrapper.style.position = 'absolute';
    containerWrapper.style.pointerEvents = 'none';
    containerWrapper.style.transform = 'translateX(0) translateY(0) scale(1)';
    containerWrapper.style.cursor = 'default';
    containerWrapper.style.top = `0`;
    containerWrapper.style.left = `0`;
    containerWrapper.style.width = `100%`;
    containerWrapper.style.height = `100%`;
    containerWrapper.style.pointerEvents = 'none';

    const elementBorderRadius = window.getComputedStyle(element).getPropertyValue('border-radius');
    containerWrapper.style.borderRadius = elementBorderRadius;

    if (!this.VOID_ELEMENTS.includes(this.elementsWithDataId[id].tagName.toLowerCase())) {
      this.elementsWithDataId[id].appendChild(containerWrapper);
      this.setPositionNotStatic(this.elementsWithDataId[id]);
      return containerWrapper;
    }

    containerWrapper = this.handleSvgElement(element, containerWrapper) ?? containerWrapper;

    containerWrapper.style.position = 'fixed';
    containerWrapper.style.top = `${containerRect.top}px`;
    containerWrapper.style.left = `${containerRect.left}px`;
    containerWrapper.style.width = `${containerRect.width}px`;
    containerWrapper.style.height = `${containerRect.height}px`;

    let parent = this.elementsWithDataId[id].parentElement;

    if (!parent || (element as SVGElement).viewportElement) parent = document.body;

    this.setPositionNotStatic(parent as HTMLElement);
    parent.appendChild(containerWrapper);

    this.voidElementsWrappers.set(id, containerWrapper);

    if (!this.animateFrame) {
      this.animateFrame = requestAnimationFrame(this.animate);
    }

    return containerWrapper;
  }

  /**
   * @function setPositionNotStatic
   * @description sets the position of the element to relative if it is static
   * @param {HTMLElement} element the element to be checked
   * @returns {void}
   */
  private setPositionNotStatic(element: HTMLElement): void {
    const { position } = window.getComputedStyle(element);
    if (position !== 'static') return;

    element.style.setProperty('position', 'relative');
  }

  // ------- callbacks -------
  /**
   * @function onClick
   * @description handles the click event on the container; mainly, creates or moves the temporary pin
   * @param {MouseEvent} event the mouse event object
   * @returns {void}
   */
  private onClick = (event: MouseEvent): void => {
    if (!this.isActive || event.target === this.pins.get('temporary-pin')) return;

    const target = event.target as HTMLElement;
    const wrapper = event.currentTarget as HTMLElement;

    if (target !== wrapper && this.pins.has(target.id)) return;

    const elementId = wrapper.getAttribute('data-wrapper-id');
    const rect = wrapper.getBoundingClientRect();
    const { x: mouseDownX, y: mouseDownY } = this.mouseDownCoordinates;

    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    const originalX = mouseDownX - rect.x;
    const originalY = mouseDownY - rect.y;

    const distance = Math.hypot(x - originalX, y - originalY);
    if (distance > 10) return;

    const { width, height } = wrapper.getBoundingClientRect();

    const cursorHeight = 32;
    const scale = wrapper.getBoundingClientRect().width / wrapper.offsetWidth || 1;

    // save coordinates as percentages
    x = (x * 100) / width;
    y = ((y - cursorHeight * scale) * 100) / height;

    this.onPinFixedObserver.publish({
      x,
      y,
      type: 'html',
      elementId,
    } as PinCoordinates);

    this.resetSelectedPin();
    this.temporaryPinCoordinates = { ...this.temporaryPinCoordinates, x, y };
    this.renderTemporaryPin(elementId);

    const temporaryPin = this.pins.get('temporary-pin');

    // we don't care about the actual movedTemporaryPin value
    // it only needs to trigger an update
    this.movedTemporaryPin = !this.movedTemporaryPin;
    temporaryPin.setAttribute('movedPosition', String(this.movedTemporaryPin));

    document.body.dispatchEvent(new CustomEvent('unselect-annotation'));
  };

  /**
   * @function onMouseDown
   * @description stores the mouse down coordinates
   * @param {MouseEvent} event - The mouse event object.
   * @returns {void}
   */
  private onMouseDown = ({ x, y }: MouseEvent) => {
    this.mouseDownCoordinates = { x, y };
  };

  /**
   * @function handleMutationObserverChanges
   * @description handles the changes in the value of the specified data attribute of the elements inside the container
   * @param {MutationRecord[]} changes the changes in the value of the specified data attribute of the elements inside the container
   * @returns {void}
   */
  private handleMutationObserverChanges = (changes: MutationRecord[]): void => {
    changes.forEach((change) => {
      const { target, oldValue } = change;
      const dataId = (target as HTMLElement).getAttribute(this.dataAttribute);
      if ((!dataId && !oldValue) || dataId === oldValue) return;

      const oldValueSkipped = this.dataAttributeValueFilters.some((filter) =>
        oldValue.match(filter),
      );

      const attributeRemoved = !dataId && oldValue && !oldValueSkipped;

      if (attributeRemoved) {
        this.removeAnnotationPin('temporary-pin');
        this.clearElement(oldValue);

        if (this.selectedPin?.getAttribute('elementId') === oldValue) {
          document.body.dispatchEvent(new CustomEvent('unselect-annotation'));
          this.selectedPin = null;
        }

        return;
      }

      const skip = this.dataAttributeValueFilters.some((filter) => dataId.match(filter));

      if ((oldValue && this.elementsWithDataId[oldValue]) || skip) {
        this.clearElement(oldValue);
      }

      if (skip) return;

      this.setElementReadyToPin(target as HTMLElement, dataId);
      this.renderAnnotationsPins();
    });
  };

  /**
   * @function onToggleAnnotationSidebar
   * @description Removes temporary pin and unselects selected pin
   * @param {CustomEvent} event the emitted event object with the info about if the annotation sidebar is open or not
   * @returns {void}
   */
  private onToggleAnnotationSidebar = ({ detail }: CustomEvent): void => {
    const { open } = detail;

    if (open) return;

    this.resetSelectedPin();

    if (this.pins.has('temporary-pin')) {
      this.removeAnnotationPin('temporary-pin');
      this.temporaryPinCoordinates.elementId = undefined;
    }
  };

  /**
   * @function onMouseEnter
   * @description sets the outline of the hovered wrapper
   * @param {MouseEvent} event the mouse event object
   * @returns {void}
   */
  private onMouseEnter = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    this.hoveredWrapper = target;

    const isEllipse = target.getAttribute('data-wrapper-type')?.includes('ellipse');

    if (!isEllipse) {
      this.hoveredWrapper.style.setProperty('outline', '1px solid rgb(var(--sv-primary))');
      return;
    }

    const ellipse = target.querySelector('ellipse');
    ellipse.setAttribute('stroke', 'rgb(var(--sv-primary))');
    ellipse.setAttribute('stroke-width', '1');
  };

  /**
   * @function onMouseLeave
   * @description removes the outline of the not-hovered-anymore wrapper
   * @param {MouseEvent} event the mouse event object
   * @returns {void}
   */
  private onMouseLeave = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    this.hoveredWrapper = target;

    const isEllipse = target.getAttribute('data-wrapper-type')?.includes('ellipse');

    if (!isEllipse) {
      this.hoveredWrapper.style.setProperty('outline', '');
      return;
    }

    const ellipse = target.querySelector('ellipse');
    ellipse.removeAttribute('stroke');
    ellipse.removeAttribute('stroke-width');
  };
}
