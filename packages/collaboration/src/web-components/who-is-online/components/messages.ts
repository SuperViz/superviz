import { CSSResultGroup, LitElement, PropertyDeclaration, PropertyValueMap, html } from 'lit';

import { classMap } from 'lit/directives/class-map.js';

import { Participant } from '../../../common/types/participant.types';
import { StoreType } from '../../../common/types/stores.types';
import { Following } from '../../../services/stores/who-is-online/types';
import { WebComponentsBase } from '../../base';
import importStyle from '../../base/utils/importStyle';
import { messagesStyle } from '../css';

import { HorizontalSide, VerticalSide } from './types';
import { MEETING_COLORS } from '../../../common/types/meeting-colors.types';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, messagesStyle];

@CreateElement('superviz-who-is-online-messages')
export class WhoIsOnlineMessages extends WebComponentsBaseElement {
  static styles = styles;

  declare everyoneFollowsMe: boolean;
  declare isPrivate: boolean;
  declare verticalSide: VerticalSide;
  declare horizontalSide: HorizontalSide;

  private following: Following | undefined;
  private participantColor: string;
  private animationFrame: number | undefined;

  static properties = {
    everyoneFollowsMe: { type: Boolean },
    isPrivate: { type: Boolean },
    verticalSide: { type: String },
    horizontalSide: { type: String },
  };

  constructor() {
    super();
    const { localParticipant } = this.useStore(StoreType.GLOBAL);
    localParticipant.subscribe((participant: Participant) => {
      this.participantColor = participant.slot?.color ?? MEETING_COLORS.gray;
    });

    const { following } = this.useStore(StoreType.WHO_IS_ONLINE);
    following.subscribe();
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    super.firstUpdated(_changedProperties);
    importStyle.call(this, 'who-is-online');
  }

  protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(_changedProperties);
    const _ = ['following', 'everyoneFollowsMe', 'isPrivate'];

    if (_.some((property) => _changedProperties.has(property))) {
      this.repositionMessages();
    }
  }

  // Logic to reposition the messages if there is not enough freespace
  /**
   * @function repositionMessages
   * @description Reposition the messages container based on which side there's more free space
   * @returns {void}
   */
  private repositionMessages = () => {
    const { following, everyoneFollowsMe, isPrivate } = this;

    if (following || everyoneFollowsMe || isPrivate) {
      this.repositionInVerticalDirection();
      this.repositionInHorizontalDirection();

      this.animationFrame = window.requestAnimationFrame(this.repositionMessages);
      return;
    }

    window.cancelAnimationFrame(this.animationFrame);
  };

  /**
   * @function repositionInVerticalDirection
   * @description Reposition the messages container based on the vertical side with more free space
   * @returns {void}
   */
  private repositionInVerticalDirection() {
    const verticalMidpoint = window.innerHeight / 2;
    const { top } = this.parentElement.getBoundingClientRect();

    if (top < verticalMidpoint) {
      this.verticalSide = VerticalSide.BOTTOM;
      return;
    }

    this.verticalSide = VerticalSide.TOP;
  }

  /**
   * @function repositionInHorizontalDirection
   * @description Reposition the messages container based on the horizontal side with more free space
   * @returns {void
   * }
   */
  private repositionInHorizontalDirection() {
    const horizontalMidpoint = window.innerWidth / 2;
    const { left } = this.parentElement.getBoundingClientRect();

    if (left < horizontalMidpoint) {
      this.horizontalSide = HorizontalSide.LEFT;
      return;
    }

    this.horizontalSide = HorizontalSide.RIGHT;
  }

  // Callbacks
  /**
   * @function stopFollowing
   * @description Emits an event to stop following a participant
   * @returns {void}
   */
  private stopFollowing() {
    this.emitEvent('stop-following', {});
  }

  /**
   * @function cancelPrivate
   * @description Emits an event to cancel private mode
   * @returns {void}
   */
  private cancelPrivate() {
    this.emitEvent('cancel-private', {});
  }

  /**
   * @function stopEveryoneFollowsMe
   * @description Emits an event to cancel the Everyone Follows Me mode (does not prevent participants from following the user individually)
   * @returns {void}
   */
  private stopEveryoneFollowsMe() {
    this.emitEvent('stop-everyone-follows-me', {});
  }

  // Content to be rendered

  // Regarding the classes of all "*Message()" methods:
  // The classes are used to style the messages, and they should be replicated for consistency should
  // new messages/interactions be added
  // The exception is 1 class unique to each message, so the user can target this message in particular
  private followingMessage() {
    if (!this.following) return '';

    const { name, color } = this.following;

    return html`<div
      class="who-is-online__following-message who-is-online__presence-control-message who-is-online__pcm"
      style="border-color: ${color}"
    >
      <p class="who-is-online__presence-control-message__text who-is-online__pcm__text">
        Following: ${name}
        <span
          class="who-is-online__presence-control-message__cancel-action-button who-is-online__pcm__cancel-action-button"
          @click=${this.stopFollowing}
          >Stop</span
        >
      </p>
    </div>`;
  }

  private everyoneFollowsMeMessage() {
    if (!this.everyoneFollowsMe) return '';

    return html`<div
      class="who-is-online__follow-me-message who-is-online__presence-control-message who-is-online__pcm"
      style="border-color: ${this.participantColor}"
    >
      <p class="who-is-online__presence-control-message__text who-is-online__pcm__text">
        Everyone is following you
        <span
          class="who-is-online__presence-control-message__cancel-action-button who-is-online__pcm__cancel-action-button"
          @click=${this.stopEveryoneFollowsMe}
          >Stop</span
        >
      </p>
    </div>`;
  }

  private privateMessage() {
    if (!this.isPrivate) return '';

    return html`<div
      class="who-is-online__private-mode-message who-is-online__presence-control-message who-is-online__pcm"
      style="border-color: ${this.participantColor}"
    >
      <p class="who-is-online__presence-control-message__text who-is-online__pcm__text">
        You are in Private Mode
        <span
          class="who-is-online__presence-control-message__cancel-action-button who-is-online__pcm__cancel-action-button"
          @click=${this.cancelPrivate}
          >Cancel</span
        >
      </p>
    </div>`;
  }

  protected render() {
    const classList = {
      'who-is-online__controls-messages': true,
      [this.verticalSide]: true,
      [this.horizontalSide]: true,
    };

    return html` <div class=${classMap(classList)}>
      ${this.followingMessage()} ${this.everyoneFollowsMeMessage()} ${this.privateMessage()}
    </div>`;
  }
}
