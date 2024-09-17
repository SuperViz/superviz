import * as Socket from '@superviz/socket-client';
import { throttle } from 'lodash';

import { RealtimeEvent } from '../../../common/types/events.types';
import { Participant } from '../../../common/types/participant.types';
import { StoreType } from '../../../common/types/stores.types';
import { Logger } from '../../../common/utils';
import { BaseComponent } from '../../base';
import { ComponentNames } from '../../types';
import { Camera, ParticipantMouse, PresenceMouseProps, Transform } from '../types';
import { MEETING_COLORS } from '../../../common/types/meeting-colors.types';

export class PointersCanvas extends BaseComponent {
  public name: ComponentNames;
  protected logger: Logger;
  private canvas: HTMLCanvasElement;
  private divWrapper: HTMLElement;
  private presences: Map<string, ParticipantMouse>;
  private animateFrame: number;
  private goToMouseCallback: PresenceMouseProps['callbacks']['onGoToPresence'];
  private following: string;
  private isPrivate: boolean;
  private localParticipant: Participant;
  private camera: Camera = {
    x: 0,
    y: 0,
    screen: {
      width: 0,
      height: 0,
    },
    scale: 1,
  };

  constructor(canvasId: string, options?: PresenceMouseProps) {
    super();
    this.name = ComponentNames.PRESENCE;
    this.logger = new Logger(`@superviz/sdk/${ComponentNames.PRESENCE}`);
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.presences = new Map();

    if (!this.canvas) {
      const message = `Canvas with id ${canvasId} not found`;
      this.logger.log(message);
      throw new Error(message);
    }

    this.divWrapper = this.renderDivWrapper();
    this.animateFrame = requestAnimationFrame(this.animate);

    this.goToMouseCallback = options?.callbacks?.onGoToPresence;

    const { localParticipant } = this.useStore(StoreType.GLOBAL);
    localParticipant.subscribe();
    this.getCamera();
  }

  /**
   * @function start
   * @description start presence-mouse component
   * @returns {void}
   */
  protected start(): void {
    this.logger.log('presence-mouse component @ start');

    this.canvas.addEventListener('mousemove', this.onMyParticipantMouseMove);
    this.canvas.addEventListener('mouseout', this.onMyParticipantMouseOut);
    this.eventBus.subscribe(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, this.goToMouse);
    this.eventBus.subscribe(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, this.followMouse);
    this.eventBus.subscribe(RealtimeEvent.REALTIME_PRIVATE_MODE, this.setParticipantPrivate);
    this.subscribeToRealtimeEvents();
  }

  /**
   * @function destroy
   * @description destroy presence-mouse component
   * @returns {void}
   */
  protected destroy(): void {
    this.logger.log('presence-mouse component @ destroy');
    this.eventBus.unsubscribe(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, this.goToMouse);
    this.eventBus.unsubscribe(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, this.followMouse);
    this.eventBus.unsubscribe(RealtimeEvent.REALTIME_PRIVATE_MODE, this.setParticipantPrivate);
    this.unsubscribeFromRealtimeEvents();

    cancelAnimationFrame(this.animateFrame);
    this.canvas.removeEventListener('mousemove', this.onMyParticipantMouseMove);
    this.canvas.removeEventListener('mouseout', this.onMyParticipantMouseOut);
    this.divWrapper.remove();
  }

  /**
   * @function subscribeToRealtimeEvents
   * @description subscribe to realtime events
   * @returns {void}
   */
  private subscribeToRealtimeEvents = (): void => {
    this.logger.log('presence-mouse component @ subscribe to realtime events');
    this.room.presence.on<ParticipantMouse>(
      Socket.PresenceEvents.JOINED_ROOM,
      this.onPresenceJoinedRoom,
    );
    this.room.presence.on<ParticipantMouse>(Socket.PresenceEvents.LEAVE, this.onPresenceLeftRoom);
    this.room.presence.on<ParticipantMouse>(Socket.PresenceEvents.UPDATE, this.onPresenceUpdate);
  };

  /**
   * @function unsubscribeFromRealtimeEvents
   * @description subscribe to realtime events
   * @returns {void}
   */
  private unsubscribeFromRealtimeEvents = (): void => {
    this.logger.log('presence-mouse component @ unsubscribe from realtime events');
    this.room.presence.off(Socket.PresenceEvents.JOINED_ROOM);
    this.room.presence.off(Socket.PresenceEvents.LEAVE);
    this.room.presence.off(Socket.PresenceEvents.UPDATE);
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
    if (this.following && this.presences.get(this.following)) {
      this.goToMouse(this.following);
    }

    if (presence.id === this.localParticipant.id) return;
    const participant = presence.data;

    if (this.following && participant.id !== this.following && this.presences.has(participant.id)) {
      this.removePresenceMouseParticipant(participant.id);
      return;
    }

    this.presences.set(participant.id, participant);
  };

  /**
   * @function animate
   * @description perform animation in presence mouse
   * @returns {void}
   */
  private animate = (): void => {
    this.getCamera();
    this.renderDivWrapper();
    this.updateParticipantsMouses();

    requestAnimationFrame(this.animate);
  };

  /**
   * @function goToMouse
   * @description - translate the canvas to the participant position
   * @param    id - participant id
   */
  private goToMouse = (id: string): void => {
    const mouse = this.presences.get(id);

    if (!mouse?.camera) return;

    const translatedX = mouse.camera.x;
    const translatedY = mouse.camera.y;
    const screenScaleX = this.divWrapper.clientHeight / mouse.camera.screen.height;
    const scaleToAllowVisibilityX = Math.min(screenScaleX, 1);
    const screenScaleY = this.divWrapper.clientWidth / mouse.camera.screen.width;
    const scaleToAllowVisibilityY = Math.min(screenScaleY, 1);

    if (this.goToMouseCallback)
      this.goToMouseCallback({
        x: translatedX,
        y: translatedY,
        scaleX: scaleToAllowVisibilityX,
        scaleY: scaleToAllowVisibilityY,
      });
  };

  /** Presence Mouse Events */

  /**
   * @function onMyParticipantMouseMove
   * @description event to update my participant mouse position to others participants
   * @returns {void}
   */
  private onMyParticipantMouseMove = throttle((event: MouseEvent): void => {
    const context = this.canvas.getContext('2d');
    const rect = this.canvas.getBoundingClientRect();
    const x = event.x - rect.left;
    const y = event.y - rect.top;

    const transform = context?.getTransform();
    const invertedMatrix = transform.inverse();
    const transformedPoint = new DOMPoint(x, y).matrixTransform(invertedMatrix);

    const coordinates = {
      x: transformedPoint.x,
      y: transformedPoint.y,
    };

    this.room.presence.update({
      ...this.localParticipant,
      ...coordinates,
      visible: !this.isPrivate,
      camera: this.camera,
    });
  }, 30);

  private onMyParticipantMouseOut = (event: MouseEvent): void => {
    const { x, y, width, height } = this.canvas.getBoundingClientRect();

    if (event.x > 0 && event.y > 0 && event.x < x + width && event.y < y + height) return;

    this.room.presence.update({ visible: false });
  };

  /**
   * @function renderDivWrapper
   * @description Creates a div wrapper for the pins.
   * @returns {HTMLElement} The newly created div wrapper.
   * */
  private renderDivWrapper(): HTMLElement {
    const canvasRect = this.canvas.getBoundingClientRect();
    let divWrapper = document.getElementById('superviz-presence-mouse-wrapper');

    if (!divWrapper) {
      divWrapper = document.createElement('div');
      divWrapper.id = 'superviz-presence-mouse-wrapper';
      this.canvas.parentElement.style.position = 'relative';
      this.canvas.parentElement.appendChild(divWrapper);
    }

    divWrapper.style.position = 'fixed';
    divWrapper.style.top = `${canvasRect.top}px`;
    divWrapper.style.left = `${canvasRect.left}px`;
    divWrapper.style.width = `${canvasRect.width}px`;
    divWrapper.style.height = `${canvasRect.height}px`;
    divWrapper.style.pointerEvents = 'none';
    divWrapper.style.overflow = 'hidden';
    divWrapper.style.zIndex = '2';

    return divWrapper;
  }

  private updateParticipantsMouses = (): void => {
    this.presences.forEach((mouse) => {
      if (!mouse?.visible || (this.following && this.following !== mouse.id)) {
        this.removePresenceMouseParticipant(mouse.id);
        return;
      }

      this.renderPresenceMouses(mouse);
    });
  };

  /**
   * @function getCamera
   * @description - retrieves the camera information from the canvas context's transform.
   * The camera information includes the current translation (x, y) and scale.
   */
  private getCamera = () => {
    const context = this.canvas?.getContext('2d');
    const transform = context?.getTransform();

    const currentTranslateX = transform?.e;
    const currentTranslateY = transform?.f;
    const currentScale = transform?.a;

    this.camera = {
      screen: {
        width: this.divWrapper.clientHeight,
        height: this.divWrapper.clientWidth,
      },
      x: currentTranslateX,
      y: currentTranslateY,
      scale: currentScale,
    };
  };

  /**
   * @function renderPresenceMouses
   * @description add presence mouses to screen
   * @param {ParticipantMouse} mouse - presence mouse change data
   * @returns {void}
   * */
  private renderPresenceMouses = (mouse: ParticipantMouse): void => {
    const userMouseIdExist = document.getElementById(`mouse-${mouse.id}`);
    let mouseFollower = userMouseIdExist;
    if (!mouseFollower) {
      mouseFollower = this.createMouseElement(mouse);
    }

    const divMouseUser = document.getElementById(`mouse-${mouse.id}`);
    const divPointer = document.getElementById(`mouse-${mouse.id}`);

    if (!divMouseUser || !divPointer) return;

    const mouseUser = divMouseUser.getElementsByClassName('mouse-user-name')[0] as HTMLDivElement;
    const pointerUser = divPointer.getElementsByClassName('pointer-mouse')[0] as HTMLDivElement;

    if (pointerUser) {
      pointerUser.style.backgroundImage = `url(https://production.cdn.superviz.com/static/mouse-pointers/${mouse.slot?.colorName}.svg)`;
    }

    if (mouseUser) {
      mouseUser.style.color = mouse.slot?.textColor ?? '#fff';
      mouseUser.style.backgroundColor = mouse.slot?.color ?? MEETING_COLORS.gray;
      mouseUser.innerHTML = mouse.name;
    }

    const { x: savedX, y: savedY } = mouse;
    const context = this.canvas.getContext('2d');
    const transform = context?.getTransform();

    const currentTranslateX = transform?.e;
    const currentTranslateY = transform?.f;
    const currentScaleWidth = transform.a;
    const currentScaleHeight = transform.d;

    const x = savedX * currentScaleWidth + currentTranslateX;
    const y = savedY * currentScaleHeight + currentTranslateY;

    const isVisible =
      this.divWrapper.clientWidth > x && this.divWrapper.clientHeight > y && mouse.visible;

    mouseFollower.style.opacity = isVisible ? '1' : '0';
    mouseFollower.style.left = `${x}px`;
    mouseFollower.style.top = `${y}px`;
  };

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
    }
  }

  /**
   * @function createMouseElement
   * @param mouse - participant mouse
   * @returns {HTMLDivElement}
   */
  private createMouseElement(mouse: ParticipantMouse): HTMLDivElement {
    const mouseFollower = document.createElement('div');
    mouseFollower.setAttribute('id', `mouse-${mouse.id}`);
    mouseFollower.setAttribute('class', 'mouse-follower');

    const pointerMouse = document.createElement('div');
    pointerMouse.setAttribute('class', 'pointer-mouse');

    const mouseUserName = document.createElement('div');
    mouseUserName.setAttribute('class', 'mouse-user-name');
    mouseUserName.innerHTML = mouse.name;

    mouseFollower.appendChild(pointerMouse);
    mouseFollower.appendChild(mouseUserName);

    mouseFollower.style.left = '0px';
    mouseFollower.style.top = '0px';

    this.divWrapper.appendChild(mouseFollower);

    return mouseFollower;
  }

  private followMouse = (id: string) => {
    this.following = id;
    this.goToMouse(id);
  };

  /**
   * @function transform
   * @description stores that information about which transformations should the pointers go through
   * @param {Transform} transformation Which transformations to apply
   */
  public transform(transformation: Transform) {
    console.warn('[SuperViz] - transform method not available when container is a canvas element.');
  }
}
