import * as Socket from '@superviz/socket-client';
import { isEqual } from 'lodash';
import { Subscription, fromEvent, throttleTime } from 'rxjs';

import { RealtimeEvent } from '../../../common/types/events.types';
import { MEETING_COLORS } from '../../../common/types/meeting-colors.types';
import { Participant } from '../../../common/types/participant.types';
import { StoreType } from '../../../common/types/stores.types';
import { Logger } from '../../../common/utils';
import { BaseComponent } from '../../base';
import { ComponentNames } from '../../types';
import {
  Camera,
  ParticipantMouse,
  PresenceMouseProps,
  SVGElements,
  Transform,
  VoidElements,
} from '../types';

export class PointersHTML extends BaseComponent {
  public name: ComponentNames;
  protected logger: Logger;

  // Realtime data
  private presences: Map<string, ParticipantMouse> = new Map();
  private localParticipant: Participant;

  // Elements
  private container: HTMLElement | SVGElement;
  private wrapper: HTMLElement;

  private mouses: Map<string, HTMLElement> = new Map();

  // General data about states/the application
  private userBeingFollowedId: string;
  private animationFrame: number;
  private isPrivate: boolean;
  private containerTagname: string;
  private transformation: Transform = { translate: { x: 0, y: 0 }, scale: 1 };
  private camera: Camera;
  private pointerMoveObserver: Subscription;

  // callbacks
  private goToPresenceCallback: PresenceMouseProps['callbacks']['onGoToPresence'];

  /**
   * @function constructor
   * @param {string} containerId The id of the container element, inside of which may be rendered
   * @param {object} options The options object, used to customize the behavior of the component
   * @param {string} options.onGoToPresence The callback function to be called when the user, through presence controls like that of the Who Is Online component, is set to go to a participant's position
   */
  constructor(containerId: string, options?: PresenceMouseProps) {
    super();

    this.container = document.getElementById(containerId);
    this.logger = new Logger(`@superviz/sdk/${ComponentNames.PRESENCE}`);

    if (!this.container) {
      const message = `Element with id ${containerId} not found`;
      this.logger.log(message);
      throw new Error(message);
    }

    this.camera = {
      x: 0,
      y: 0,
      scale: 1,
      screen: {
        width: this.container.clientWidth,
        height: this.container.clientHeight,
      },
    };

    this.name = ComponentNames.PRESENCE;
    this.containerTagname = this.container.tagName.toUpperCase();
    this.goToPresenceCallback = options?.callbacks?.onGoToPresence;
  }

  // ---------- SETUP ----------

  /**
   * @function start
   * @description start presence-mouse component
   * @returns {void}
   */
  protected start(): void {
    this.logger.log('presence-mouse component @ start');

    const { localParticipant } = this.useStore(StoreType.GLOBAL);
    localParticipant.subscribe();

    this.renderWrapper();
    this.addListeners();
    this.subscribeToRealtimeEvents();

    this.eventBus.subscribe(RealtimeEvent.REALTIME_PRIVATE_MODE, this.setParticipantPrivate);
    this.animationFrame = requestAnimationFrame(this.animate);
    this.eventBus.subscribe(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, this.goToMouse);
    this.eventBus.subscribe(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, this.followMouse);
  }

  /**
   * @function destroy
   * @description destroy presence-mouse component
   * @returns {void}
   */
  protected destroy(): void {
    cancelAnimationFrame(this.animationFrame);

    this.logger.log('presence-mouse component @ destroy');

    this.removeListeners();
    this.wrapper.remove();

    this.presences.clear();
    this.presences = undefined;

    this.container = undefined;
    this.wrapper = undefined;

    this.unsubscribeFromRealtimeEvents();

    this.eventBus.unsubscribe(RealtimeEvent.REALTIME_PRIVATE_MODE, this.setParticipantPrivate);
    this.eventBus.unsubscribe(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, this.goToMouse);
    this.eventBus.unsubscribe(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, this.followMouse);
    this.logger = undefined;
  }

  /**
   * @function subscribeToRealtimeEvents
   * @description subscribe to realtime events
   * @returns {void}
   */
  private subscribeToRealtimeEvents(): void {
    this.logger.log('presence-mouse component @ subscribe to realtime events');
    this.room.presence.on<ParticipantMouse>(
      Socket.PresenceEvents.JOINED_ROOM,
      this.onPresenceJoinedRoom,
    );
    this.room.presence.on<ParticipantMouse>(Socket.PresenceEvents.LEAVE, this.onPresenceLeftRoom);
    this.room.presence.on<ParticipantMouse>(Socket.PresenceEvents.UPDATE, this.onPresenceUpdate);
  }

  /**
   * @function unsubscribeFromRealtimeEvents
   * @description subscribe to realtime events
   * @returns {void}
   */
  private unsubscribeFromRealtimeEvents(): void {
    this.logger.log('presence-mouse component @ unsubscribe from realtime events');
    this.room.presence.off(Socket.PresenceEvents.JOINED_ROOM);
    this.room.presence.off(Socket.PresenceEvents.LEAVE);
    this.room.presence.off(Socket.PresenceEvents.UPDATE);
  }

  /**
   * @function addListeners
   * @description adds the mousemove and mouseout listeners to the wrapper with the specified id
   * @returns {void}
   */
  private addListeners(): void {
    this.pointerMoveObserver = fromEvent(this.container, 'pointermove')
      .pipe(throttleTime(30))
      .subscribe(this.onMyParticipantMouseMove);
    this.container.addEventListener('pointerleave', this.onMyParticipantMouseLeave);
  }

  /**
   * @function removeListeners
   * @description removes the mousemove and mouseout listeners from the container
   * @returns {void}
   */
  private removeListeners(): void {
    this.pointerMoveObserver?.unsubscribe();
    this.container.removeEventListener('pointerleave', this.onMyParticipantMouseLeave);
  }

  // ---------- CALLBACKS ----------
  /**
   * @function onMyParticipantMouseMove
   * @description event to update my participant mouse position to others participants
   * @returns {void}
   */
  private onMyParticipantMouseMove = (event: MouseEvent): void => {
    if (this.isPrivate) return;
    const container = event.currentTarget as HTMLDivElement;

    const { left, top } = container.getBoundingClientRect();

    const x = (event.x - left - this.transformation.translate.x) / this.transformation.scale;
    const y = (event.y - top - this.transformation.translate.y) / this.transformation.scale;

    this.room.presence.update<ParticipantMouse>({
      ...this.localParticipant,
      x,
      y,
      visible: true,
      camera: this.camera,
    });
  };

  /**
   * @function onMyParticipantMouseLeave
   * @returns {void}
   */
  private onMyParticipantMouseLeave = (event: MouseEvent): void => {
    if (typeof window === 'undefined') return;

    const { left, top, right, bottom } = this.container.getBoundingClientRect();
    const isInsideContainer =
      event.x > left && event.y > top && event.x < right && event.y < bottom;
    const isInsideScreen =
      event.x > 0 && event.y > 0 && event.x < window.innerWidth && event.y < window.innerHeight;
    if (isInsideContainer && isInsideScreen) return;

    this.room.presence.update({ visible: false });
  };

  /**
   * @function goToMouse
   * @description scrolls the screen to the mouse pointer or calls the user callback to do so
   * @param id - the id of the mouse pointer
   * @returns
   */
  private goToMouse = (id: string): void => {
    const pointer = this.mouses.get(id);
    const presence = this.presences.get(id);

    if (!presence) return;

    if (this.goToPresenceCallback) {
      const scaleFactorX = this.camera.screen.width / presence.camera.screen.width;
      const scaleFactorY = this.camera.screen.height / presence.camera.screen.height;

      const translatedX = presence.camera.x * scaleFactorX;
      const translatedY = presence.camera.y * scaleFactorY;

      const screenScaleX = presence.camera.scale * scaleFactorX;
      const screenScaleY = presence.camera.scale * scaleFactorY;

      this.goToPresenceCallback({
        x: translatedX,
        y: translatedY,
        scaleX: screenScaleX,
        scaleY: screenScaleY,
      });

      return;
    }

    if (!pointer) return;

    pointer.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  };

  /**
   * @function followMouse
   * @description handler for follow mouse event
   * @param id
   */
  private followMouse = (id: string) => {
    this.userBeingFollowedId = id;
    this.goToMouse(id);
  };

  /**
   * @function setParticipantPrivate
   * @description perform animation in presence mouse
   * @returns {void}
   */
  private setParticipantPrivate = (isPrivate: boolean): void => {
    this.isPrivate = isPrivate;
    this.room.presence.update({ visible: !isPrivate });
  };

  /**
   * @function onPresenceJoinedRoom
   * @description handler for presence joined room event
   * @param {PresenceEvent} presence
   * @returns {void}
   */
  private onPresenceJoinedRoom = (presence: Socket.PresenceEvent): void => {
    if (presence.id !== this.localParticipant.id) return;

    this.room.presence.update(this.localParticipant);
  };

  /**
   * @function onPresenceLeftRoom
   * @description handler for presence left room event
   * @param {PresenceEvent} presence
   * @returns {void}
   */
  private onPresenceLeftRoom = (presence: Socket.PresenceEvent<ParticipantMouse>): void => {
    this.removePresenceMouseParticipant(presence.id);
  };

  /**
   * @function onPresenceUpdate
   * @description handler for presence update event
   * @param {PresenceEvent} presence
   * @returns {void}
   */
  private onPresenceUpdate = (presence: Socket.PresenceEvent<ParticipantMouse>): void => {
    if (presence.id === this.localParticipant.id) return;
    const participant = presence.data;

    const followingAnotherParticipant =
      this.userBeingFollowedId &&
      participant.id !== this.userBeingFollowedId &&
      this.presences.has(participant.id);

    // When the user is following a participant, every other mouse pointer is removed
    if (followingAnotherParticipant) {
      this.removePresenceMouseParticipant(participant.id);
      return;
    }

    this.presences.set(participant.id, participant);
    this.animate();
    this.updateParticipantsMouses();
  };

  // ---------- HELPERS ----------
  /**
   * @function setPositionNotStatic
   * @description sets the position of the element to relative if it is static
   * @param {HTMLElement} element the element to be checked
   * @returns {void}
   */
  private setPositionNotStatic(): void {
    const { position } = window.getComputedStyle(this.container);
    if (position !== 'static') return;

    this.container.style.setProperty('position', 'relative');
  }

  /**
   * @function createMouseElement
   * @description create mouse element
   * @param mouse - participant mouse
   * @returns {HTMLDivElement}
   */
  private createMouseElement(participant: ParticipantMouse): HTMLDivElement {
    if (!this.wrapper) return;

    const mouseFollower = document.createElement('div');
    mouseFollower.setAttribute('id', `mouse-${participant.id}`);
    mouseFollower.setAttribute('class', 'mouse-follower');
    const pointerMouse = document.createElement('div');
    pointerMouse.setAttribute('class', 'pointer-mouse');

    const mouseUserName = document.createElement('div');
    mouseUserName.setAttribute('class', 'mouse-user-name');
    mouseUserName.innerHTML = participant.name;

    mouseFollower.appendChild(pointerMouse);
    mouseFollower.appendChild(mouseUserName);

    mouseFollower.style.left = '0px';
    mouseFollower.style.top = '0px';

    this.wrapper.appendChild(mouseFollower);
    this.mouses.set(participant.id, mouseFollower);
    return mouseFollower;
  }

  /**
   * @function updateSVGPosition
   * @description - Updates the position of the wrapper of a <svg> element
   * @param {SVGElement} element - The svg element
   * @returns {void}
   */
  private updateSVGPosition() {
    const parentRect = this.container.parentElement.getBoundingClientRect();
    const elementRect = this.container.getBoundingClientRect();
    const left = elementRect.left - parentRect.left;
    const top = elementRect.top - parentRect.top;

    const { width, height } = this.container.getBoundingClientRect();

    this.wrapper.style.setProperty('width', `${width}px`);
    this.wrapper.style.setProperty('height', `${height}px`);
    this.wrapper.style.setProperty('top', `${top}px`);
    this.wrapper.style.setProperty('left', `${left}px`);
  }

  /**
   * @function createSVGWrapper
   * @description - Creates a wrapper for an svg element
   * @param {SVGElement} svg - The svg element
   * @param {string} id - The data attribute value of the svg element
   */
  private createSVGWrapper(): void {
    const wrapper = document.createElement('div');

    const parentRect = this.container.parentElement.getBoundingClientRect();
    const elementRect = this.container.getBoundingClientRect();
    const left = elementRect.left - parentRect.left;
    const top = elementRect.top - parentRect.top;

    const { width, height } = this.container.getBoundingClientRect();

    wrapper.style.position = 'fixed';
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.top = `${top}px`;
    wrapper.style.left = `${left}px`;
    wrapper.style.overflow = 'visible';
    wrapper.style.pointerEvents = 'none';
    wrapper.id = 'superviz-svg-wrapper';

    this.container.parentElement.appendChild(wrapper);
    this.wrapper = wrapper;
  }

  /**
   * @function createRectWrapper
   * @description - Creates a wrapper for a rect element
   * @param {SVGElement} rect - The rect element
   * @param {string} id - The data attribute value of the rect element
   */
  private createRectWrapper(): void {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const wrapper = document.createElement('div');

    const width = this.container.getAttribute('width');
    const height = this.container.getAttribute('height');
    const rx = this.container.getAttribute('rx');
    const ry = this.container.getAttribute('ry');

    svgElement.setAttribute('fill', 'transparent');
    svgElement.setAttribute('stroke', 'transparent');
    svgElement.setAttribute('x', '0');
    svgElement.setAttribute('y', '0');
    svgElement.setAttribute('rx', rx);
    svgElement.setAttribute('ry', ry);
    svgElement.setAttribute('height', height);
    svgElement.setAttribute('width', width);

    svg.setAttribute('height', height);
    svg.setAttribute('width', width);
    svg.appendChild(svgElement);

    wrapper.appendChild(svg);

    const viewportRect = this.container.getBoundingClientRect();

    wrapper.style.position = 'fixed';
    wrapper.style.top = `${viewportRect.top}px`;
    wrapper.style.left = `${viewportRect.left}px`;
    wrapper.style.width = `${viewportRect.width}px`;
    wrapper.style.height = `${viewportRect.height}px`;
    wrapper.style.overflow = 'visible';
    wrapper.style.pointerEvents = 'none';
    wrapper.id = 'superviz-rect-wrapper';

    // here we get the topmost svg element, in case there are nested svgs
    let externalViewport = (this.container as SVGElement).viewportElement;
    while (externalViewport.viewportElement) {
      externalViewport = externalViewport.viewportElement;
    }

    externalViewport.parentElement.appendChild(wrapper);
    this.wrapper = wrapper;
  }

  /**
   * @function createEllipseWrapper
   * @description - Creates a wrapper for an ellipse element
   * @returns {void}
   */
  private createEllipseWrapper(): void {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    const wrapper = document.createElement('div');

    const cx = this.container.getAttribute('cx');
    const cy = this.container.getAttribute('cy');
    const rx = this.container.getAttribute('rx');
    const ry = this.container.getAttribute('ry');
    const x = Number(cx) - Number(rx);
    const y = Number(cy) - Number(ry);
    const width = String(2 * Number(cx));
    const height = String(2 * Number(cy));

    svgElement.setAttribute('fill', 'transparent');
    svgElement.setAttribute('stroke', 'transparent');
    svgElement.setAttribute('x', '0');
    svgElement.setAttribute('y', '0');
    svgElement.setAttribute('rx', rx);
    svgElement.setAttribute('ry', ry);
    svgElement.setAttribute('cx', `${Number(cx) - x}`);
    svgElement.setAttribute('cy', `${Number(cy) - y}`);
    svgElement.setAttribute('height', height);
    svgElement.setAttribute('width', width);

    svg.setAttribute('height', height);
    svg.setAttribute('width', width);
    svg.appendChild(svgElement);

    wrapper.appendChild(svg);

    const viewportRect = this.container.getBoundingClientRect();

    wrapper.style.position = 'fixed';
    wrapper.style.top = `${viewportRect.top}px`;
    wrapper.style.left = `${viewportRect.left}px`;
    wrapper.style.width = `${viewportRect.width}px`;
    wrapper.style.height = `${viewportRect.height}px`;
    wrapper.style.overflow = 'visible';
    wrapper.style.pointerEvents = 'none';
    wrapper.id = 'superviz-ellipse-wrapper';

    // here we get the topmost svg element, in case there are nested svgs
    let externalViewport = (this.container as SVGElement).viewportElement;
    while (externalViewport.viewportElement) {
      externalViewport = externalViewport.viewportElement;
    }

    externalViewport.parentElement.appendChild(wrapper);

    this.wrapper = wrapper;
  }

  // ---------- REGULAR METHODS ----------
  /**
   * @function transform
   * @description stores that information about which transformations should the pointers go through
   * @param {Transform} transformation Which transformations to apply
   */
  public transform(transformation: Transform) {
    this.transformation = transformation;
    this.camera = {
      x: transformation.translate.x,
      y: transformation.translate.y,
      scale: transformation.scale,
      screen: {
        width: this.wrapper?.clientWidth || 1,
        height: this.wrapper?.clientHeight || 1,
      },
    };

    this.updateParticipantsMouses(true);
  }

  /**
   * @function animate
   * @description perform animation in presence mouse
   * @returns {void}
   */
  private animate = (): void => {
    if (VoidElements[this.containerTagname]) {
      this.updateVoidElementWrapper();
    }

    if (SVGElements[this.containerTagname]) {
      this.updateSVGElementWrapper();
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private updateParticipantsMouses = (haltFollow?: boolean): void => {
    this.presences.forEach((mouse) => {
      if (mouse.id === this.localParticipant.id) return;

      if (!mouse?.visible) {
        this.removePresenceMouseParticipant(mouse.id);
        return;
      }

      this.renderPresenceMouses(mouse);
    });

    if (haltFollow) return;

    const isFollowingSomeone = this.presences.has(this.userBeingFollowedId);
    if (isFollowingSomeone) {
      this.goToMouse(this.userBeingFollowedId);
    }
  };

  /**
   * @function updateVoidElementWrapper
   * @description - Updates the position of each wrapper for void elements
   * @returns {void}
   */
  private updateVoidElementWrapper(): void {
    const elementRect = this.container.getBoundingClientRect();
    const wrapperRect = this.wrapper.getBoundingClientRect();

    const container = this.container as HTMLElement;

    if (isEqual(elementRect, wrapperRect)) return;
    const left = container.offsetLeft;
    const top = container.offsetTop;
    this.wrapper.style.setProperty('width', `${elementRect.width}px`);
    this.wrapper.style.setProperty('height', `${elementRect.height}px`);
    this.wrapper.style.setProperty('top', `${top}px`);
    this.wrapper.style.setProperty('left', `${left}px`);
    this.wrapper.id = 'superviz-void-wrapper';
  }

  /**
   * @function updateSVGElementWrapper
   * @description - Updates the position of each wrapper for void elements
   * @returns {void}
   */
  private updateSVGElementWrapper(): void {
    const {
      left: cLeft,
      top: cTop,
      width: cWidth,
      height: cHeight,
    } = this.container.getBoundingClientRect();

    const {
      left: wLeft,
      top: wTop,
      width: wWidth,
      height: wHeight,
    } = this.wrapper.getBoundingClientRect();

    if (cLeft === wLeft && cTop === wTop && cWidth === wWidth && cHeight === wHeight) return;

    if (this.containerTagname.toLowerCase() === SVGElements.SVG) {
      this.updateSVGPosition();
      return;
    }

    this.wrapper.style.setProperty('width', `${cWidth}px`);
    this.wrapper.style.setProperty('height', `${cHeight}px`);
    this.wrapper.style.setProperty('top', `${cTop}px`);
    this.wrapper.style.setProperty('left', `${cLeft}px`);
  }

  /**
   * @function renderWrapper
   * @description prepares, creates and renders a wrapper for the specified element
   * @returns {void}
   */
  private renderWrapper(): void {
    if (this.wrapper) return;

    if (VoidElements[this.containerTagname]) {
      this.renderVoidElementWrapper();
      return;
    }

    if (SVGElements[this.containerTagname]) {
      this.renderSVGElementWrapper();
      return;
    }

    this.renderElementWrapper();
  }

  /**
   * @function removePresenceMouseParticipant
   * @description handler remove external participant mouse
   * @param {string} participantId - external participant id
   * @returns {void}
   * */
  private removePresenceMouseParticipant(participantId: string): void {
    const userMouseIdExist = document.getElementById(`mouse-${participantId}`);
    if (userMouseIdExist) {
      userMouseIdExist.remove();
      this.presences.delete(participantId);
      this.mouses.delete(participantId);
    }
  }

  /**
   * @function renderPresenceMouses
   * @description add presence mouses to screen
   * @param {ParticipantMouse} mouse - presence mouse change data
   * @returns {void}
   * */
  private renderPresenceMouses = (participant: ParticipantMouse): void => {
    if (participant.id === this.localParticipant.id) return;

    let mouseFollower = document.getElementById(`mouse-${participant.id}`);

    if (!mouseFollower) {
      mouseFollower = this.createMouseElement(participant);
    }

    if (!mouseFollower) return;

    const mouseUser = mouseFollower.getElementsByClassName('mouse-user-name')[0] as HTMLDivElement;
    const pointerUser = mouseFollower.getElementsByClassName('pointer-mouse')[0] as HTMLDivElement;

    if (pointerUser) {
      pointerUser.style.backgroundImage = `url(https://production.cdn.superviz.com/static/mouse-pointers/${participant.slot?.colorName}.svg)`;
    }

    if (mouseUser) {
      mouseUser.style.color = participant.slot?.textColor ?? MEETING_COLORS.gray;
      mouseUser.style.backgroundColor = participant.slot?.color ?? '#fff';
      mouseUser.innerHTML = participant.name;
    }

    const { x, y } = participant;
    const {
      translate: { x: baseX, y: baseY },
      scale,
    } = this.transformation;

    mouseFollower.style.left = `${baseX + x * scale}px`;
    mouseFollower.style.top = `${baseY + y * scale}px`;
  };

  /**
   * @function renderElementWrapper
   * @description - Creates wrapper for regular, non-void and non-svg related elements
   * @param {HTMLElement} element - The element to be wrapped
   * @param {string} id - The id of the element
   * @returns {void}
   */
  private renderElementWrapper(): void {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.overflow = 'visible';
    wrapper.style.pointerEvents = 'none';
    this.setPositionNotStatic();
    this.container.appendChild(wrapper);
    this.wrapper = wrapper;
  }

  /**
   * @function renderVoidElementWrapper
   * @description - Creates wrapper for void elements
   * @param {HTMLElement} element - The element to be wrapped
   * @param {string} id - The id of the element
   * @returns {void}
   */
  private renderVoidElementWrapper = (): void => {
    const wrapper = document.createElement('div');
    const { width, height, left, top } = this.container.getBoundingClientRect();

    wrapper.style.position = 'absolute';
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.top = `${top}px`;
    wrapper.style.left = `${left}px`;
    wrapper.style.overflow = 'visible';
    wrapper.style.pointerEvents = 'none';

    this.container.parentElement.appendChild(wrapper);
    this.wrapper = wrapper;
  };

  /**
   * @function renderSVGElementWrapper
   * @description - Handles the creation of wrappers for svg elements
   * @param {SVGElement} element - The svg element (be it an ellipse or a rect)
   * @param {string} id - The data attribute value of the svg element
   * @returns {void}
   */
  private renderSVGElementWrapper = (): void => {
    const tag = this.containerTagname.toLowerCase();

    if (tag === SVGElements.SVG) {
      this.createSVGWrapper();
      return;
    }

    if (tag === SVGElements.RECT) {
      this.createRectWrapper();
      return;
    }

    if (tag === SVGElements.ELLIPSE) {
      this.createEllipseWrapper();
    }
  };
}
