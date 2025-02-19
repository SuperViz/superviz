import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';

import { repeat } from 'lit/directives/repeat.js';

import { ParticipantByGroupApi } from '../../../common/types/participant.types';
import { WebComponentsBase } from '../../base';
import { mentionListStyle } from '../css';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, mentionListStyle];

@CreateElement('superviz-comments-mention-list')
export class CommentsMentionList extends WebComponentsBaseElement {
  constructor() {
    super();
    this.participants = [];
  }

  static styles = styles;

  declare participants: ParticipantByGroupApi[];

  static properties = {
    participants: { type: Object },
  };

  protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (_changedProperties.has('participants') && this.participants.length > 0) {
      this.showMentionList();
      return;
    }

    this.hideMentionList();
  }

  showMentionList = () => {
    const mentionList = this.shadowRoot?.getElementById('mention-list');
    mentionList?.style.setProperty('display', 'block');
    mentionList?.style.setProperty('margin-top', '1px');
    mentionList.addEventListener('wheel', this.stopHandleZoom);
  };

  hideMentionList = () => {
    const mentionList = this.shadowRoot?.getElementById('mention-list');
    mentionList.removeEventListener('wheel', this.stopHandleZoom);
    mentionList?.style.setProperty('display', 'none');
  };

  private selectParticipant = (participant) => {
    this.emitEvent('participant-selected', participant, {
      bubbles: false,
      composed: false,
    });

    this.hideMentionList();
  };

  private stopHandleZoom = (event) => {
    const menu = this.shadowRoot?.getElementById('mention-list');
    menu.scrollTop += event.deltaY;
    event.preventDefault();
  };

  private getAvatar(participant: ParticipantByGroupApi) {
    if (participant.avatar) {
      return html`<img class="avatar" src=${participant.avatar} />`;
    }

    return html`<div class="default-avatar">
      <p class="text text-bold">${participant.name[0]?.toUpperCase() || 'A'}</p>
    </div>`;
  }

  protected render() {
    const mentionItem = (participant) => html`
      <div class="mention-item" @click=${() => this.selectParticipant(participant)}>
        ${this.getAvatar(participant)}
        <div class="avatar-type">${participant.name}</div>
      </div>
    `;

    return html`
      <div id="mention-list">
        ${repeat(
          this.participants,
          (participant: ParticipantByGroupApi) => participant.id,
          (participant) => html` ${mentionItem(participant)} `,
        )}
      </div>
    `;
  }
}
