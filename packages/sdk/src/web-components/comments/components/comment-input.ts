import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';

import { classMap } from 'lit/directives/class-map.js';

import { ParticipantByGroupApi } from '../../../common/types/participant.types';
import { AnnotationPositionInfo, CommentMention } from '../../../components/comments/types';
import { WebComponentsBase } from '../../base';
import importStyle from '../../base/utils/importStyle';
import { commentInputStyle } from '../css';
import { AutoCompleteHandler } from '../utils/autocomplete-handler';
import mentionHandler from '../utils/mention-handler';

import { CommentMode } from './types';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, commentInputStyle];

@CreateElement('superviz-comments-comment-input')
export class CommentsCommentInput extends WebComponentsBaseElement {
  declare eventType: string;
  declare text: string;
  declare btnActive: boolean;
  declare editable: boolean;
  declare commentsInput: HTMLTextAreaElement;
  declare placeholder: string;
  declare mentionList: ParticipantByGroupApi[];
  declare mentions: CommentMention[];
  declare participantsList: ParticipantByGroupApi[];
  declare hideInput: boolean;
  declare mode: CommentMode;

  private pinCoordinates: AnnotationPositionInfo | null = null;

  private autoCompleteHandler: AutoCompleteHandler = new AutoCompleteHandler();

  constructor() {
    super();
    this.btnActive = false;
    this.text = '';
    this.mentionList = [];
    this.mentions = [];
    this.mode = CommentMode.READONLY;
  }

  static styles = styles;

  static properties = {
    eventType: { type: String },
    text: { type: String },
    btnActive: { type: Boolean },
    editable: { type: Boolean },
    placeholder: { type: String },
    mentions: { type: Array },
    mentionList: { type: Object },
    participantsList: { type: Object },
    hideInput: { type: Boolean },
    mode: { type: String },
  };

  private addAtSymbolInCaretPosition = () => {
    const input = this.shadowRoot!.querySelector(
      '.comments__input__textarea',
    ) as HTMLTextAreaElement;
    const newInputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(newInputEvent, 'data', {
      value: '@',
      writable: true,
    });

    input.dispatchEvent(newInputEvent);
  };

  private getCommentInput = () => {
    return this.shadowRoot!.querySelector('.comments__input__textarea') as HTMLTextAreaElement;
  };

  private get commentInput() {
    return this.shadowRoot!.querySelector('.comments__input__textarea') as HTMLTextAreaElement;
  }

  private get mentionButton() {
    return this.shadowRoot!.querySelector('.mention-button') as HTMLButtonElement;
  }

  private get sendBtn() {
    return this.shadowRoot!.querySelector('.comments__input__send-button') as HTMLButtonElement;
  }

  private get optionsContainer() {
    return this.shadowRoot!.querySelector('.comments__input__options') as HTMLTextAreaElement;
  }

  private get horizontalRule() {
    return this.shadowRoot!.querySelector('.sv-hr') as HTMLDivElement;
  }

  private get closeButton() {
    return this.shadowRoot!.querySelector('.comments__input__close-button') as HTMLButtonElement;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (!['create-annotation', 'create-comment'].includes(this.eventType)) return;

    this.addEventListener('keyup', this.sendEnter);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (!['create-annotation', 'create-comment'].includes(this.eventType)) return;
    const textarea = this.getCommentInput();

    this.removeEventListener('keyup', this.sendEnter);
    textarea.removeEventListener('keydown', this.sendEnter);
    textarea.removeEventListener('click', this.focusInput);
    textarea.addEventListener('input', this.handleInput);
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    this.updateComplete.then(() => {
      this.emitEvent('comment-input-ready', {}, { composed: false, bubbles: false });

      const commentTextarea = this.getCommentInput();

      if (commentTextarea) {
        commentTextarea.addEventListener('input', this.handleInput);
        commentTextarea.addEventListener('click', this.focusInput);
        commentTextarea.addEventListener('keydown', this.sendEnter);
      }

      if (this.text.length > 0) {
        const mentions = this.participantsList.map(({ id, name }) => ({ userId: id, name }));
        this.mentions = this.autoCompleteHandler.getMentions(this.text, mentions);
        this.autoCompleteHandler.setMentions(this.mentions);
      }

      if (this.editable) {
        this.focusInput();
      }

      importStyle.call(this, ['comments']);
    });
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('mode') && this.mode === CommentMode.EDITABLE) {
      this.focusInput();
      this.updateHeight();
      this.sendBtn.disabled = false;
      this.btnActive = true;
    }

    if (changedProperties.has('text') && this.text.length > 0) {
      const commentsInput = this.commentInput;
      commentsInput.value = this.text;
      this.updateHeight();
    }

    if (changedProperties.has('btnActive')) {
      this.sendBtn.disabled = !this.btnActive;
    }
  }

  private userMentionedByTextInput = (mentions) => {
    this.mentionList = [];
    const mentioned = {
      detail: {
        ...mentions[0],
      },
    };
    this.insertMention(mentioned);
  };

  private buttonAtSymbol = () => {
    let caretIndex = this.autoCompleteHandler.getSelectionStart();
    const getValue = this.autoCompleteHandler.getValue();

    this.autoCompleteHandler.setValue(
      `${getValue.slice(0, caretIndex)}@${getValue.slice(caretIndex, getValue.length)}`,
    );

    caretIndex += 1;
    const keyData = this.autoCompleteHandler.getLastKeyBeforeCaret(caretIndex);
    const keyIndex = keyData?.keyIndex ?? -1;
    const searchText = this.autoCompleteHandler.searchMention(caretIndex, keyIndex);
    const position = {
      start: keyIndex + 1,
      end: caretIndex,
    };
    return { searchText, position };
  };

  private focusInput = () => {
    this.getCommentInput().focus();
  };

  private handleInput = (e: InputEvent) => {
    if (this.commentInput?.value.length === 0) this.btnActive = false;
    else this.btnActive = true;

    this.autoCompleteHandler.setInput(e);
    const caretIndex = this.autoCompleteHandler.getSelectionStart();
    const keyData = this.autoCompleteHandler.getLastKeyBeforeCaret(caretIndex);
    const keyIndex = keyData?.keyIndex ?? -1;

    if (caretIndex === -1) return;

    let searchText = this.autoCompleteHandler.searchMention(caretIndex, keyIndex);
    let position = this.autoCompleteHandler.getSelectionPosition();

    const isButtonAtSymbol = e.data === '@' && keyIndex === -1;
    const isButtonAtSymbolAndNotStartedMention = e.data === '@' && caretIndex - 1 !== keyIndex;

    if (isButtonAtSymbol || isButtonAtSymbolAndNotStartedMention) {
      const data = this.buttonAtSymbol();
      searchText = data.searchText;
      position = data.position;
    }

    if (searchText === null) {
      this.mentionList = [];
      return;
    }

    const { action, mentions, findDigitParticipant } = mentionHandler.matchParticipant(
      searchText,
      position,
      this.participantsList,
    );

    if (findDigitParticipant) {
      this.userMentionedByTextInput(mentions);
      return;
    }

    if (action === 'show') {
      this.mentionList = mentions;
    }

    if (action === 'hide') {
      this.mentionList = [];
    }
  };

  private insertMention = (event) => {
    const { id, name, avatar, email, position } = event.detail;

    this.autoCompleteHandler.insertMention(position.start, position.end, {
      id,
      name,
      avatar,
      email,
    });
    this.mentionList = [];
    this.updateHeight();
  };

  private updateHeight() {
    const commentsInput = this.commentInput;

    commentsInput.style.height = '40px';

    let textareaHeight = commentsInput.scrollHeight + 14;

    if (textareaHeight === 47) {
      textareaHeight = 40;
    }

    commentsInput.style.height = `${textareaHeight}px`;

    this.sendBtn.disabled = !(commentsInput.value.length > 0);
  }

  private sendEnter = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') {
      e.stopImmediatePropagation();
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }

    if (e.key !== 'Enter' || e.shiftKey || this.mentionList?.length > 0) return;

    const input = this.commentInput;
    const text = input.value.trim();

    if (!text) return;
    const mentions = this.autoCompleteHandler.getMentions(text);

    this.emitEvent(
      this.eventType,
      {
        text,
        mentions,
        position: this.pinCoordinates,
      },
      {
        composed: false,
        bubbles: false,
      },
    );

    input.value = '';
    this.sendBtn.disabled = true;
    this.updateHeight();
  };

  private send(e: Event) {
    e.preventDefault();
    if (this.mentionList?.length > 0) return;

    const input = this.commentInput;
    const text = input.value;
    const mentions = this.autoCompleteHandler.getMentions(text);

    this.emitEvent(
      this.eventType,
      {
        text,
        mentions,
        position: this.pinCoordinates,
      },
      {
        composed: false,
        bubbles: false,
      },
    );

    input.value = '';
    this.sendBtn.disabled = true;
    this.updateHeight();
  }

  private closeEditMode = () => {
    this.emitEvent('close-edit-mode', {}, { composed: false, bubbles: false });
    this.hideInput = true;
  };

  private onTextareaFocus = () => {
    const options = this.optionsContainer;
    const rule = this.horizontalRule;
    const textarea = this.commentInput;
    options.classList.add('active-textarea');
    rule.classList.add('comments__input__divisor');
    textarea.classList.add('active-textarea');
  };

  private onTextareaLoseFocus = (e) => {
    const target = e.explicitOriginalTarget?.parentNode?.host;

    const mentionBtn = this.mentionButton;
    if (mentionBtn === e.explicitOriginalTarget || mentionBtn === e.relatedTarget) return;

    // explicitOriginalTarget is for Firefox
    // relatedTarget is for Chrome
    if (
      this.closeButton.contains(target) ||
      this.closeButton.contains(e.explicitOriginalTarget) ||
      this.closeButton.contains(e.relatedTarget)
    ) {
      this.cancelComment();
      return;
    }

    if (!this.shadowRoot.contains(e.target)) {
      return;
    }

    const options = this.optionsContainer;
    const rule = this.horizontalRule;
    const textarea = this.commentInput;

    if (!textarea.value.length) {
      options.classList.remove('active-textarea');
      rule.classList.remove('comments__input__divisor');
      textarea.classList.remove('active-textarea');
    }
  };

  private cancelComment = () => {
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
  };

  private commentInputEditableOptions = () => {
    if (!this.editable) return;

    return html`
      <button
        id="close"
        @click=${this.closeEditMode}
        class="icon-button icon-button--medium icon-button--clickable comments__input__button comments__input__close-button"
      >
        <superviz-icon name="close" size="sm"></superviz-icon>
      </button>
      <button
        id="confirm"
        class="icon-button icon-button--medium icon-button--clickable icon-button--no-hover comments__input__button comments__input__send-button"
        disabled
        @click=${this.send}
      >
        <superviz-icon
          color=${this.sendBtn?.disabled || !this.sendBtn ? 'black' : 'white'}
          name="check"
          size="sm"
        ></superviz-icon>
      </button>
    `;
  };

  private commentInputOptions = () => {
    if (this.editable) return;

    return html`
      <button
        class="icon-button icon-button--medium icon-button--clickable comments__input__button comments__input__close-button align-send-btn"
        @click=${this.cancelComment}
      >
        <superviz-icon name="close" size="sm"></superviz-icon>
      </button>
      <button
        class="comments__input__button comments__input__send-button align-send-btn"
        disabled
        @click=${this.send}
      >
        <superviz-icon
          color=${this.sendBtn?.disabled || !this.sendBtn ? 'black' : 'white'}
          name="line-arrow-right"
          size="sm"
        ></superviz-icon>
      </button>
    `;
  };

  protected render() {
    const textAreaClasses = {
      comments__input__textarea: true,
      'fixed-width': this.eventType === 'create-annotation',
    };

    const commentsInputClasses = {
      comments__input: true,
      'comments__input--editable': this.editable,
      'hide-input': this.hideInput,
    };

    return html`
      <div class="${classMap(commentsInputClasses)}">
        <textarea
          id="comments__input__textarea"
          class=${classMap(textAreaClasses)}
          placeholder=${this.placeholder ?? 'Add comment...'}
          @input=${this.updateHeight}
          @focus=${this.onTextareaFocus}
          @blur=${this.onTextareaLoseFocus}
          spellcheck="false"
        ></textarea>
        <superviz-comments-mention-list
          .participants=${this.mentionList}
          @participant-selected=${this.insertMention}
        ></superviz-comments-mention-list>
        <div class="sv-hr"></div>
        <div class="comments__input__options">
          <button
            @click=${this.addAtSymbolInCaretPosition}
            class="mention-button icon-button icon-button--medium icon-button--clickable"
          >
            <superviz-icon name="mention" size="sm"></superviz-icon>
          </button>
          <div class="comment-input-options">
            ${this.commentInputOptions()} ${this.commentInputEditableOptions()}
          </div>
        </div>
      </div>
    `;
  }
}
