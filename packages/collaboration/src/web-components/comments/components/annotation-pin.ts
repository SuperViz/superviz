import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';

import { classMap } from 'lit/directives/class-map.js';

import { Participant, ParticipantByGroupApi } from '../../../common/types/participant.types';
import { StoreType } from '../../../common/types/stores.types';
import { Annotation, PinCoordinates } from '../../../components/comments/types';
import { WebComponentsBase } from '../../base';
import importStyle from '../../base/utils/importStyle';
import { annotationPinStyles } from '../css';

import { PinMode, HorizontalSide, Sides } from './types';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, annotationPinStyles];

@CreateElement('superviz-comments-annotation-pin')
export class CommentsAnnotationPin extends WebComponentsBaseElement {
  declare type: PinMode;
  declare active: boolean;
  declare annotation: Annotation;
  declare position: Partial<PinCoordinates>;
  declare showInput: boolean;
  declare containerSides: Sides;
  declare horizontalSide: HorizontalSide | undefined;
  declare commentsSide: HorizontalSide;
  declare movedPosition: string;
  declare pinAnnotation: HTMLElement;
  declare localAvatar: string | undefined;
  declare annotationSent: boolean;
  declare localName: string;
  declare keepPositionRatio: boolean;
  declare participantsList: ParticipantByGroupApi[];
  declare firstLoad: boolean;
  declare newPin: boolean;

  private originalPosition: Partial<PinCoordinates>;
  private annotationSides: Sides;
  private inputElement: HTMLTextAreaElement;

  static styles = styles;
  static properties = {
    type: { type: String },
    annotation: { type: Object },
    position: { type: Object },
    active: { type: Boolean },
    showInput: { type: Boolean },
    containerSides: { type: Object },
    horizontalSide: { type: String },
    commentsSide: { type: String },
    movedPosition: { type: String },
    pinAnnotation: { type: Object },
    localAvatar: { type: String },
    annotationSent: { type: Boolean },
    localName: { type: String },
    keepPositionRatio: { type: Boolean },
    participantsList: { type: Object },
    firstLoad: { type: Boolean },
    newPin: { type: Boolean },
  };

  constructor() {
    super();
    this.position = { x: 0, y: 0 };
    setTimeout(() => {
      this.firstLoad = false;
    }, 800);
  }

  protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(_changedProperties);

    if (!_changedProperties.has('movedPosition') || !this.annotationSides) return;
    this.annotationSides = this.pinAnnotation.getBoundingClientRect();
    this.setInputSide();

    if (!this.inputElement) return;
    this.focusInput();
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    super.firstUpdated(_changedProperties);
    importStyle.call(this, ['comments']);

    if (!this.showInput) return;

    this.originalPosition = { ...this.position };
    this.pinAnnotation = this.shadowRoot?.querySelector('.comments__annotation-pin');
    this.annotationSides = this.pinAnnotation.getBoundingClientRect();
    this.setInputSide();
  }

  private focusInput = () => {
    if (!this.inputElement) {
      this.inputElement = this.shadowRoot
        ?.querySelector('superviz-comments-comment-input')
        ?.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
    }

    this.inputElement.focus();
  };

  private setInputSide = () => {
    const inputWidth = 286;
    const gapWidth = 7;
    const extraWidth = inputWidth + gapWidth;

    let commentsWidth = this.commentsSide === 'right' ? 320 : 0;

    const right = this.annotationSides.right + extraWidth;
    const rightLimit = this.containerSides.right - commentsWidth;
    if (right < rightLimit) {
      this.horizontalSide = 'right';
      return;
    }

    commentsWidth = this.commentsSide === 'left' ? 320 : 0;
    const left = this.annotationSides.left - extraWidth;
    const leftLimit = this.containerSides.left + commentsWidth;
    if (left > leftLimit) {
      this.horizontalSide = 'left';
      return;
    }

    this.horizontalSide = leftLimit - left > right - rightLimit ? 'right' : 'left';
  };

  private createComment = ({ detail }: CustomEvent) => {
    this.annotationSent = true;
    document.body.dispatchEvent(
      new CustomEvent('create-annotation', {
        detail: { ...detail, position: { ...this.originalPosition, type: 'canvas' } },
      }),
    );

    this.annotation = null;
  };

  private cancelTemporaryAnnotation = () => {
    this.annotation = null;
  };

  private cancelTemporaryAnnotationEsc = (event: KeyboardEvent) => {
    this.annotation = null;
  };

  connectedCallback(): void {
    super.connectedCallback();

    if (this.type !== PinMode.ADD) return;

    const { localParticipant } = this.useStore(StoreType.GLOBAL);
    localParticipant.subscribe((participant) => {
      this.localAvatar = participant?.avatar?.imageUrl;
      this.localName = participant?.name;
    });

    window.document.body.addEventListener(
      'close-temporary-annotation',
      this.cancelTemporaryAnnotation,
    );

    window.document.body.addEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        this.cancelTemporaryAnnotationEsc(e);
      }
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this.type !== PinMode.ADD) return;

    window.document.body.removeEventListener(
      'close-temporary-annotation',
      this.cancelTemporaryAnnotation,
    );

    window.document.body.removeEventListener('keyup', (e) => {
      if (e.key === 'Escape') {
        this.cancelTemporaryAnnotationEsc(e);
      }
    });
  }

  get userAvatar() {
    return this.annotation?.comments?.at(0)?.participant?.avatar || this.localAvatar;
  }

  get userInitial(): string {
    const name =
      (this.annotation?.comments?.at(0)?.participant?.name ?? this.localName) || 'Anonymous';

    return name[0].toUpperCase();
  }

  private emitClick(): void {
    document.body.dispatchEvent(
      new CustomEvent('select-annotation', {
        detail: { uuid: this.annotation?.uuid },
      }),
    );
  }

  private avatar = () => {
    if (this.type === PinMode.ADD && !this.showInput) {
      return html`<div
        class="comments__annotation-pin__avatar comments__annotation-pin__avatar--add"
      >
        <superviz-icon name="add"></superviz-icon>
      </div>`;
    }

    const avatar = this.userAvatar;
    if (avatar) {
      return html`<div class="comments__annotation-pin__avatar">
        <img src=${avatar} />
      </div>`;
    }

    return html`<div class="comments__annotation-pin__avatar">
      <p class="text text-bold text-big">${this.userInitial}</p>
    </div>`;
  };

  private input = () => {
    if (!this.showInput || this.annotationSent) return;
    return html`<div class="floating-input">
      <superviz-comments-comment-input
        @create-annotation=${this.createComment}
        eventType="create-annotation"
        @comment-input-ready=${this.focusInput}
        participantsList=${JSON.stringify(this.participantsList)}
      >
      </superviz-comments-comment-input>
    </div>`;
  };

  protected render() {
    const classes = {
      'comments__annotation-pin': true,
      preload: this.firstLoad === undefined,
      'comments__annotation-pin--active': this.active,
      'comments__cursor-pointer': this.type === PinMode.ADD && !this.showInput,
      'comments__annotation-pin--add': this.type === PinMode.ADD && this.showInput,
      [this.horizontalSide]: true,
    };

    const wrapperClasses = {
      'comments__annotation-pin-wrapper': true,
      'comments__annotation-pin-wrapper--new': this.newPin,
    };

    const unit = this.keepPositionRatio ? '%' : 'px';
    const style = `top: ${this.position.y}${unit}; left: ${this.position.x}${unit};`;

    if (this.type === PinMode.ADD) {
      return html`
        <div class=${classMap(classes)} style=${style}>${this.avatar()} ${this.input()}</div>
      `;
    }

    return html`<div class=${classMap(wrapperClasses)} style=${style}>
      <div @click=${this.emitClick} class=${classMap(classes)}>${this.avatar()}</div>
    </div> `;
  }
}
