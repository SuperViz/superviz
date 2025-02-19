import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';

import { classMap } from 'lit/directives/class-map.js';
import { DateTime } from 'luxon';

import { ParticipantByGroupApi } from '../../../common/types/participant.types';
import { WebComponentsBase } from '../../base';
import importStyle from '../../base/utils/importStyle';
import { commentItemStyle } from '../css';

import { CommentMode, CommentDropdownOptions, AnnotationFilter } from './types';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, commentItemStyle];

@CreateElement('superviz-comments-comment-item')
export class CommentsCommentItem extends WebComponentsBaseElement {
  constructor() {
    super();
    this.resolved = false;
  }

  static styles = styles;

  declare uuid: string;
  declare annotationId?: string;
  declare username: string;
  declare text: string;
  declare resolved: boolean;
  declare createdAt: string;
  declare resolvable: boolean;
  declare mode: CommentMode;
  declare deleteCommentModalOpen: boolean;
  declare primaryComment: boolean;
  declare isSelected: boolean;
  declare annotationFilter: string;
  declare participantsList: ParticipantByGroupApi[];
  declare mentions: ParticipantByGroupApi[];
  declare avatar: string;
  declare class: string;

  static properties = {
    uuid: { type: String },
    annotationId: { type: String },
    avatar: { type: String },
    username: { type: String },
    text: { type: String },
    resolved: { type: Boolean },
    resolvable: { type: Boolean },
    createdAt: { type: String },
    mode: { type: String },
    deleteCommentModalOpen: { type: Boolean },
    primaryComment: { type: Boolean },
    isSelected: { type: Boolean },
    annotationFilter: { type: String },
    participantsList: { type: Object },
    mentions: { type: Array },
    class: { type: String },
  };

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    super.firstUpdated(_changedProperties);
    this.updateComplete.then(() => {
      importStyle.call(this, ['comments']);
    });

    document.body.addEventListener('select-annotation', this.selectAnnotation);
  }

  connectedCallback(): void {
    super.connectedCallback();

    window.document.body.addEventListener('select-annotation', this.selectAnnotation);
    window.document.body.addEventListener('keyup', this.unselectAnnotationEsc);
    window.document.body.addEventListener('unselect-annotation', this.unselectAnnotation);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    window.document.body.removeEventListener('select-annotation', this.selectAnnotation);
    window.document.body.removeEventListener('keyup', this.unselectAnnotationEsc);
    window.document.body.removeEventListener('unselect-annotation', this.unselectAnnotation);
  }

  private unselectAnnotationEsc = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.isSelected = false;
    }
  };

  private unselectAnnotation = () => {
    this.isSelected = false;
  };

  private selectAnnotation = ({ detail }: CustomEvent) => {
    const { uuid } = detail;

    if (this.isSelected) {
      this.isSelected = false;
      return;
    }

    this.isSelected = uuid === this.annotationId;
  };

  private updateComment = ({ detail }: CustomEvent) => {
    const { text, mentions } = detail;
    this.text = text;
    this.closeEditMode();

    this.emitEvent('update-comment', {
      uuid: this.uuid,
      mentions,
      text,
    });
  };

  private resolveAnnotation = (event: Event) => {
    event.stopPropagation();

    this.emitEvent(
      'resolve-annotation',
      {
        type: 'resolve-annotation',
        resolved: !this.resolved,
      },
      { composed: false, bubbles: false },
    );
  };

  private confirmDelete = () => {
    this.deleteCommentModalOpen = false;

    if (this.primaryComment) {
      return this.emitEvent('delete-annotation', {
        uuid: this.annotationId,
      });
    }

    this.emitEvent('delete-comment', {
      annotationId: this.annotationId,
      uuid: this.uuid,
    });
  };

  private closeEditMode = () => {
    this.mode = CommentMode.READONLY;
    this.emitEvent('edit-comment', { editing: false });
  };

  private getAvatar() {
    if (this.avatar) {
      return html` <div class=${this.getClasses('avatar-container')}>
        <img src=${this.avatar} class=${this.getClasses('avatar-image')} />
      </div>`;
    }

    return html`<div class=${this.getClasses('avatar-container')}>
      <p class="text text-bold ${this.getClasses('avatar-letter')}">
        ${this.username[0]?.toUpperCase() || 'A'}
      </p>
    </div>`;
  }

  private getClasses(suffix: string) {
    return `comments__comment-item__${suffix} ${this.class}__${suffix}`;
  }

  protected render() {
    const resolveIcon = this.annotationFilter === AnnotationFilter.ALL ? 'resolve' : 'undo';

    const humanizeDate = (date: string) => {
      return DateTime.fromISO(date).toFormat('yyyy-dd-MM');
    };

    const isResolvable = this.resolvable ? 'comments__comment-item__resolve' : 'hidden';

    const options = [
      {
        label: CommentDropdownOptions.EDIT,
      },
      {
        label: CommentDropdownOptions.DELETE,
      },
    ];

    const dropdownOptionsHandler = ({ detail: { label } }: CustomEvent) => {
      if (label === CommentDropdownOptions.EDIT) {
        this.mode = CommentMode.EDITABLE;
        this.emitEvent('edit-comment', { editing: true });
      }

      if (label === CommentDropdownOptions.DELETE) {
        this.deleteCommentModalOpen = true;
      }
    };

    const textareaHtml = () => {
      const classes = {
        'comments__comment-item--editable': true,
        'hide-edit-input': this.mode !== CommentMode.EDITABLE,
      };

      return html`
        <superviz-comments-comment-input
          class="${classMap(classes)}"
          editable
          mode=${this.mode}
          @click=${(event: Event) => event.stopPropagation()}
          text=${this.text}
          eventType="update-comment"
          participantsList=${JSON.stringify(this.participantsList)}
          mentions=${JSON.stringify(this.mentions)}
          @update-comment=${this.updateComment}
          @close-edit-mode=${this.closeEditMode}
        ></superviz-comments-comment-input>
      `;
    };

    const commentText = () => {
      const textClasses = {
        text: true,
        'text-big': true,
        'sv-gray-700': true,
        'annotation-content': true,
        [this.getClasses('content')]: true,
        editing: this.mode === CommentMode.EDITABLE,
        'line-clamp': !this.isSelected && this.text.length > 120,
      };

      return html` <p id="comment-text" class="${classMap(textClasses)}">${this.text}</p> `;
    };

    const closeModal = () => {
      this.deleteCommentModalOpen = false;
    };

    const commentItemClass = {
      [this.class]: true,
      'comments__comment-item': true,
      reply: !this.primaryComment,
    };

    const contentBodyClasses = {
      'comments__comment-item__content__body': true,
      'editing-annotation': this.mode === CommentMode.EDITABLE,
    };

    return html`
      <div class=${classMap(commentItemClass)}>
        <div class=${this.getClasses('header')}>
          <div class=${this.getClasses('metadata')}>
            ${this.getAvatar()}
            <span class="text text-big text-bold sv-gray-700 ${this.getClasses('username')}">
              ${this.username}
            </span>
            <span class="text text-small sv-gray-500 ${this.getClasses('date')}">
              ${humanizeDate(this.createdAt)}
            </span>
          </div>
          <div class=${this.getClasses('actions')}>
            <button
              @click=${this.resolveAnnotation}
              class="${this.getClasses('icons')} ${this.getClasses(
                'resolve-icon',
              )} icon-button icon-button--clickable icon-button--xsmall ${isResolvable}"
            >
              <!-- TODO: Add undo icon in sm format -->
              <superviz-icon name=${resolveIcon} size="sm"></superviz-icon>
            </button>
            <superviz-dropdown
              options=${JSON.stringify(options)}
              position="bottom-left"
              @selected=${dropdownOptionsHandler}
              @click=${(event: Event) => {
                event.stopPropagation();
              }}
              classesPrefix="comments__dropdown"
              parentComponent="comments"
            >
              <button
                slot="dropdown"
                class="${this.getClasses('icons')} ${this.getClasses(
                  'options-icon',
                )} icon-button icon-button--clickable icon-button--small"
              >
                <superviz-icon name="more" size="sm"></superviz-icon>
              </button>
            </superviz-dropdown>
          </div>
        </div>

        <div class="comments__comment-item__content">
          <div class="${classMap(contentBodyClasses)}">${textareaHtml()} ${commentText()}</div>
        </div>
      </div>
      <superviz-comments-delete-comments-modal
        ?open=${this.deleteCommentModalOpen}
        @close=${closeModal}
        @confirm=${this.confirmDelete}
      >
      </superviz-comments-delete-comments-modal>
    `;
  }
}
