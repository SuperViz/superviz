import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';

import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import { RealtimeEvent } from '../../common/types/events.types';
import { StoreType } from '../../common/types/stores.types';
import {
  Avatar,
  WhoIsOnlineParticipant,
  WIODropdownOptions,
} from '../../components/who-is-online/types';
import { Following } from '../../services/stores/who-is-online/types';
import { WebComponentsBase } from '../base';
import importStyle from '../base/utils/importStyle';

import type { LocalParticipantData } from './components/types';
import { whoIsOnlineStyle } from './css/index';
import { CreateElement } from '../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, whoIsOnlineStyle];

@CreateElement('superviz-who-is-online')
export class WhoIsOnline extends WebComponentsBaseElement {
  static styles = styles;
  declare position: string;
  declare open: boolean;
  declare isPrivate: boolean;
  declare everyoneFollowsMe: boolean;
  declare showTooltip: boolean;

  private following: Following | undefined;
  private localParticipantData: LocalParticipantData;
  private amountOfExtras: number;
  private disableDropdown: boolean;
  private participants: WhoIsOnlineParticipant[];

  static properties = {
    position: { type: String },
    open: { type: Boolean },
    localParticipantColor: { type: String },
    isPrivate: { type: Boolean },
    everyoneFollowsMe: { type: Boolean },
    showTooltip: { type: Boolean },
  };

  constructor() {
    super();
    this.position = 'top: 20px; right: 40px;';
    this.showTooltip = true;
    this.open = false;

    const { localParticipant } = this.useStore(StoreType.GLOBAL);
    const { participants, following, extras, disablePresenceControls } = this.useStore(
      StoreType.WHO_IS_ONLINE,
    );

    participants.subscribe((participants) => {
      this.participants = participants;
    });
    following.subscribe();
    disablePresenceControls.subscribe();

    extras.subscribe((participants) => {
      this.amountOfExtras = participants.length;
    });

    localParticipant.subscribe((value) => {
      const joinedPresence = value.activeComponents?.some((component) =>
        component.toLowerCase().includes('presence'),
      );

      this.localParticipantData = {
        id: value.id,
        joinedPresence: value.activeComponents?.some((component) =>
          component.toLowerCase().includes('presence'),
        ),
      };

      this.disableDropdown = !joinedPresence;
    });
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    super.firstUpdated(_changedProperties);
    importStyle.call(this, 'who-is-online');
  }

  private toggleOpen() {
    this.open = !this.open;
  }

  private onClickOutDropdown = ({ detail }: CustomEvent) => {
    this.open = detail.open;
  };

  private dropdownPosition(index: number) {
    if (this.participants.length === 1) return 'bottom-center';

    if (index === 0) return 'bottom-right';

    const thereAreExtraParticipants = this.participants.length > 4;
    const isTheLastParticipantOfList = index + 1 === this.participants.length;

    if (thereAreExtraParticipants || !isTheLastParticipantOfList) {
      return 'bottom-center';
    }

    return 'bottom-left';
  }

  private renderExtras() {
    if (!this.amountOfExtras) return;

    const classes = {
      'who-is-online__participant': true,
      excess_participants: true,
      'excess_participants--open': this.open,
    };

    return html`
      <superviz-who-is-online-dropdown
        @selected=${this.dropdownOptionsHandler}
        @clickout=${this.onClickOutDropdown}
        ?disableDropdown=${this.disableDropdown}
        ?showSeeMoreTooltip=${this.showTooltip}
        @toggle=${this.toggleOpen}
        @toggle-dropdown-state=${this.toggleShowTooltip}
        ?localParticipantJoinedPresence=${this.localParticipantData?.joinedPresence}
        classesPrefix="who-is-online__controls"
        parentComponent="who-is-online"
        tooltipPrefix="who-is-online"
      >
        <div class=${classMap(classes)} slot="dropdown">
          <div class="superviz-who-is-online__excess who-is-online__extras">
            +${this.amountOfExtras}
          </div>
        </div>
      </superviz-who-is-online-dropdown>
    `;
  }

  private toggleShowTooltip = () => {
    this.showTooltip = !this.showTooltip;
  };

  private getAvatar({ color, imageUrl, firstLetter, letterColor }: Avatar) {
    if (imageUrl) {
      return html` <img
        class="who-is-online__participant__avatar"
        style="background-color: ${color}"
        src=${imageUrl}
      />`;
    }

    return html`<div
      class="who-is-online__participant__avatar"
      style="background-color: ${color}; color: ${letterColor}"
    >
      ${firstLetter}
    </div>`;
  }

  private cancelPrivate() {
    this.isPrivate = undefined;
    this.emitEvent(RealtimeEvent.REALTIME_PRIVATE_MODE, { id: this.localParticipantData.id });
  }

  private renderParticipants() {
    if (!this.participants.length) return html``;

    return html`
      ${repeat(
        this.participants,
        (participant) => participant.id,
        (participant, index) => {
          const { avatar, id, name, tooltip, controls, disableDropdown, isLocalParticipant } =
            participant;
          const position = this.dropdownPosition(index);

          const participantIsFollowed = this.following?.id === id;
          const classList = {
            'who-is-online__participant': true,
            'disable-dropdown': disableDropdown,
            followed: participantIsFollowed || (this.everyoneFollowsMe && isLocalParticipant),
            private: isLocalParticipant && this.isPrivate,
          };

          return html`
            <superviz-dropdown
              options=${JSON.stringify(controls)}
              returnData=${JSON.stringify({ participantId: id, source: 'participants' })}
              position=${position}
              name=${name}
              tooltipData=${JSON.stringify(tooltip)}
              classesPrefix="who-is-online__controls"
              parentComponent="who-is-online"
              tooltipPrefix="who-is-online"
              ?disabled=${disableDropdown}
              ?canShowTooltip=${this.showTooltip}
              @selected=${this.dropdownOptionsHandler}
              @toggle-dropdown-state=${this.toggleShowTooltip}
            >
              <div
                slot="dropdown"
                class=${classMap(classList)}
                style="border-color: ${avatar.color}"
              >
                ${this.getAvatar(avatar)}
              </div>
            </superviz-dropdown>
          `;
        },
      )}
    `;
  }

  // ----- handle presence controls options -----
  private dropdownOptionsHandler = ({ detail: { label, participantId, source } }: CustomEvent) => {
    switch (label) {
      case WIODropdownOptions.GOTO:
        this.handleGoTo(participantId);
        break;
      case WIODropdownOptions.LOCAL_FOLLOW:
        this.handleLocalFollow(participantId, source);
        break;
      case WIODropdownOptions.LOCAL_UNFOLLOW:
        this.handleLocalUnfollow();
        break;
      case WIODropdownOptions.PRIVATE:
        this.handlePrivate(participantId);
        break;
      case WIODropdownOptions.LEAVE_PRIVATE:
        this.handleCancelPrivate(participantId);
        break;
      case WIODropdownOptions.FOLLOW:
        this.handleFollow(participantId, source);
        break;
      case WIODropdownOptions.UNFOLLOW:
        this.handleStopFollow();
        break;
      case WIODropdownOptions.GATHER:
        this.handleGatherAll(participantId);
        break;
      default:
        break;
    }
  };

  private handleGoTo(participantId: string) {
    this.emitEvent(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, { id: participantId });
  }

  private handleLocalFollow(participantId: string, source: 'participants' | 'extras') {
    const { following } = this.useStore(StoreType.WHO_IS_ONLINE);
    const participants = this.useStore(StoreType.WHO_IS_ONLINE)[source].value;

    const {
      id,
      name,
      avatar: { color },
    } = participants.find(({ id }) => id === participantId) as WhoIsOnlineParticipant;

    if (this.everyoneFollowsMe) {
      this.handleStopFollow();
    }
    following.publish({ name, id, color });
    this.emitEvent(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, { id, source });
  }

  private handleLocalUnfollow() {
    const { following } = this.useStore(StoreType.WHO_IS_ONLINE);
    following.publish(undefined);
    this.emitEvent(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, { id: undefined });
  }

  private handlePrivate(id: string) {
    if (this.everyoneFollowsMe) {
      this.handleStopFollow();
    }

    this.emitEvent(RealtimeEvent.REALTIME_PRIVATE_MODE, { id, isPrivate: true });
    this.isPrivate = true;
  }

  private handleCancelPrivate(id: string) {
    this.emitEvent(RealtimeEvent.REALTIME_PRIVATE_MODE, { id, isPrivate: false });
    this.isPrivate = false;
  }

  private handleFollow(participantId: string, source: 'participants' | 'extras') {
    if (this.isPrivate) {
      this.cancelPrivate();
    }

    const participants = this.useStore(StoreType.WHO_IS_ONLINE)[source].value;

    const {
      id,
      name,
      avatar: { color },
    } = participants.find(({ id }) => id === participantId);

    this.everyoneFollowsMe = true;

    const { following } = this.useStore(StoreType.WHO_IS_ONLINE);
    following.publish(undefined);

    this.emitEvent(RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT, {
      id,
      name,
      color,
    });
  }

  private handleStopFollow() {
    this.everyoneFollowsMe = false;
    this.emitEvent(RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT, undefined);
  }

  private handleGatherAll(id: string) {
    if (this.isPrivate) {
      this.cancelPrivate();
    }

    this.emitEvent(RealtimeEvent.REALTIME_GATHER, { id });
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    this.updateComplete.then(() => {
      const element = this.shadowRoot.querySelector('.who-is-online');
      if (!element) return;

      const side = this.position.includes('left') ? 'flex-start' : 'flex-end';
      const style = `${this.position} align-items: ${side};`;
      element.setAttribute('style', style);
    });
  }

  protected render() {
    return html`<div class="who-is-online who-is-online">
      <div class="who-is-online__participant-list">
        ${this.renderParticipants()} ${this.renderExtras()}
      </div>
      <superviz-who-is-online-messages
        ?everyoneFollowsMe=${this.everyoneFollowsMe}
        ?isPrivate=${this.isPrivate}
        @stop-following=${this.handleLocalUnfollow}
        @cancel-private=${this.cancelPrivate}
        @stop-everyone-follows-me=${this.handleStopFollow}
      ></superviz-who-is-online-messages>
    </div> `;
  }
}
