// @ts-nocheck
import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';

import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import { StoreType } from '../../../common/types/stores.types';
import { Avatar, Participant } from '../../../components/who-is-online/types';
import { WebComponentsBase } from '../../base';
import importStyle from '../../base/utils/importStyle';
import { dropdownStyle } from '../css';

import { Following, VerticalSide, HorizontalSide } from './types';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, dropdownStyle];

@CreateElement('superviz-who-is-online-dropdown')
export class WhoIsOnlineDropdown extends WebComponentsBaseElement {
  static styles = styles;

  declare open: boolean;
  declare align: HorizontalSide;
  declare position: VerticalSide;
  declare selected: string;
  declare disableDropdown: boolean;
  declare showSeeMoreTooltip: boolean;
  declare showParticipantTooltip: boolean;
  declare localParticipantJoinedPresence: boolean;
  declare dropdownList: HTMLElement;

  private participants: Participant[];
  private animationFrame: number;

  static properties = {
    open: { type: Boolean },
    align: { type: String },
    position: { type: String },
    selected: { type: String },
    disableDropdown: { type: Boolean },
    showSeeMoreTooltip: { type: Boolean },
    showParticipantTooltip: { type: Boolean },
    localParticipantJoinedPresence: { type: Boolean },
    dropdownList: { type: Object },
  };

  constructor() {
    super();
    this.selected = '';
    this.showParticipantTooltip = true;

    const { extras } = this.useStore(StoreType.WHO_IS_ONLINE);
    extras.subscribe((participants) => {
      this.participants = participants;
    });
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    this.shadowRoot.querySelector('.who-is-online__extras-dropdown').scrollTop = 0;
    importStyle.call(this, 'who-is-online');

    this.dropdownList = this.shadowRoot.querySelector('.dropdown-list') as HTMLElement;
    this.dropdownList.style.position = 'fixed';
  }

  protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (!changedProperties.has('open')) return;

    this.emitEvent('toggle-dropdown-state', { open: this.open, font: 'toggle' });

    if (this.open) {
      document.addEventListener('click', this.onClickOutDropdown);
      return;
    }

    document.removeEventListener('click', this.onClickOutDropdown);
  }

  private onClickOutDropdown = (event: Event) => {
    event.stopPropagation();

    if (!this.open) return;

    const elements = event.composedPath();
    const dropdownContent = this.shadowRoot.querySelector('.dropdown-content');
    const dropdownList = this.shadowRoot.querySelector('.dropdown-list');
    const slotDropdown = this.shadowRoot.querySelector('slot[name="dropdown"]') as HTMLSlotElement;
    const dropdownCta = slotDropdown.assignedElements()[0];
    const hasDropdownContent = elements.includes(dropdownContent);
    const hasDropdownList = elements.includes(dropdownList);
    const hasDropdownCta = elements.includes(dropdownCta);

    if (!(hasDropdownContent || hasDropdownList || hasDropdownCta)) {
      this.close();
    }
  };

  private close = () => {
    this.open = false;
    this.selected = '';
    this.emitEvent('clickout', {
      bubbles: false,
      composed: false,
    });
  };

  private selectParticipant = (participantId: string, disableDropdown: boolean) => {
    return () => {
      if (disableDropdown) return;

      this.selected = participantId;
    };
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

  private toggleShowTooltip = ({ detail: { open } }: CustomEvent) => {
    this.showParticipantTooltip = !this.showParticipantTooltip;

    if (!open) {
      this.selected = '';
    }
  };

  private renderParticipants() {
    if (!this.participants) return;

    const numberOfParticipants = this.participants.length - 1;

    return repeat(
      this.participants,
      (participant) => participant.id,
      (participant, index) => {
        const { disableDropdown, id, avatar, controls, tooltip, name } = participant;

        const contentClasses = {
          'who-is-online__extra-participant': true,
          'who-is-online__extra-participant--selected': this.selected === id,
          'disable-dropdown': disableDropdown,
        };

        const iconClasses = {
          'who-is-online__extras__arrow-icon': true,
          'hide-icon': disableDropdown,
        };

        const isLastParticipant = index === numberOfParticipants;

        return html`
        <superviz-dropdown
          options=${JSON.stringify(controls)}
          returnData=${JSON.stringify({ participantId: id, source: 'extras' })}
          tooltipData=${JSON.stringify(tooltip)}
          position="bottom-right"
          classesPrefix="who-is-online__controls"
          parentComponent="who-is-online"
          tooltipPrefix="who-is-online"
          ?disabled=${disableDropdown}
          ?canShowTooltip=${this.showParticipantTooltip}
          ?shiftTooltipLeft=${true}
          ?lastParticipant=${isLastParticipant}
          @toggle-dropdown-state=${this.toggleShowTooltip}
          @selected=${this.close}
        >
        <div 
          class=${classMap(contentClasses)} 
          @click=${this.selectParticipant(id, disableDropdown)} slot="dropdown">
            <div class="who-is-online__participant" style="border-color: 
            ${avatar.color}">
              ${this.getAvatar(avatar)}
            </div>
            <span class="who-is-online__extras__username">${name}</span>
            <superviz-icon 
              class=${classMap(iconClasses)} 
              name="right" 
              color="var(--sv-gray-600)"
              size="sm"
            >
          </superviz-icon>
          </div>
        </div>
      </superviz-dropdown>
      `;
      },
    );
  }

  private toggle() {
    this.open = !this.open;

    if (!this.open) return;
    this.selected = '';
    this.repositionDropdown();
  }

  private get menuClasses() {
    return {
      'who-is-online__extras-dropdown': true,
      'menu--bottom': this.position === VerticalSide.BOTTOM,
      'menu--top': this.position === VerticalSide.TOP,
      'menu-open': this.open,
    };
  }

  private tooltip = () => {
    if (!this.showSeeMoreTooltip) return '';

    return html`<superviz-tooltip
      tooltipData=${JSON.stringify({ name: 'See more' })}
      classesPrefix="who-is-online__tooltip"
      parentComponent="who-is-online"
    ></superviz-tooltip>`;
  };

  private repositionDropdown = () => {
    if (!this.open || !this.parentElement) {
      window.cancelAnimationFrame(this.animationFrame);
      return;
    }

    this.repositionInVerticalDirection();
    this.repositionInHorizontalDirection();

    this.animationFrame = window.requestAnimationFrame(this.repositionDropdown);
  };

  private repositionInVerticalDirection = () => {
    const { bottom, top, height } = this.parentElement.getBoundingClientRect();
    const windowVerticalMidpoint = window.innerHeight / 2;
    const dropdownVerticalMidpoint = top + height / 2;

    if (dropdownVerticalMidpoint > windowVerticalMidpoint) {
      this.dropdownList.style.setProperty('bottom', `${window.innerHeight - top + 8}px`);
      this.dropdownList.style.setProperty('top', '');
      return;
    }

    this.dropdownList.style.setProperty('top', `${bottom + 8}px`);
    this.dropdownList.style.setProperty('bottom', '');
  };

  private repositionInHorizontalDirection = () => {
    const { right, left } = this.parentElement.getBoundingClientRect();
    this.dropdownList.style.setProperty('right', `${window.innerWidth - right}px`);
    this.dropdownList.style.setProperty('left', `${left}px`);
  };

  protected render() {
    return html`
      <div class="dropdown">
        <div class="dropdown-content" @click=${this.toggle}>
          <slot name="dropdown"></slot>
        </div>
        ${this.tooltip()}
      </div>
      <div class="dropdown-list">
        <div class=${classMap(this.menuClasses)}>${this.renderParticipants()}</div>
      </div>
    `;
  }
}
