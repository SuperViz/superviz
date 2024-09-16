import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';

import { classMap } from 'lit/directives/class-map.js';

import { WebComponentsBase } from '../../base';
import importStyle from '../../base/utils/importStyle';
import { floatButtonStyle } from '../css';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, floatButtonStyle];

@CreateElement('superviz-comments-button')
export class CommentsFloatButton extends WebComponentsBaseElement {
  static styles = styles;
  declare isHidden: boolean;
  declare positionStyles: string;
  declare commentsPosition: string;
  private shouldHide: boolean;
  declare isActive: boolean;
  declare mouseHovering: boolean;

  static properties = {
    positionStyles: { type: String },
    isHidden: { type: Boolean },
    commentsPosition: { type: String },
    isActive: { type: Boolean },
    mouseHovering: { type: Boolean },
  };

  constructor() {
    super();
    this.isHidden = true;
    this.positionStyles = 'top: 20px; left: 20px;';
    this.shouldHide = false;
    this.commentsPosition = 'left';
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    super.firstUpdated(_changedProperties);
    this.updateComplete.then(() => {
      importStyle.call(this, ['comments']);
    });

    this.mouseHovering = false;

    const button = this.shadowRoot.querySelector('.comments__floating-button');
    button.addEventListener('mouseenter', () => {
      setTimeout(() => button.classList.add('comments-floating-button-hovered'), 300);
      this.mouseHovering = true;
    });

    button.addEventListener('mouseleave', () => {
      button.classList.remove('comments-floating-button-hovered');
      this.mouseHovering = false;
    });
  }

  private toggle() {
    this.emitEvent('toggle', {});
  }

  private onTogglePinActive = ({ detail: { isActive } }: CustomEvent) => {
    this.isActive = isActive;
  };

  connectedCallback(): void {
    super.connectedCallback();

    window.document.body.addEventListener('toggle-annotation-sidebar', () => {
      this.isHidden = !this.isHidden;
    });
    window.document.body.addEventListener('toggle-pin-active', this.onTogglePinActive);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    window.document.body.removeEventListener('toggle-annotation-sidebar', () => {
      this.isHidden = !this.isHidden;
    });
    window.document.body.removeEventListener('toggle-pin-active', this.onTogglePinActive);
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    this.updateComplete.then(() => {
      const floatButton = this.shadowRoot.querySelector('.comments__floating-button');
      if (!floatButton) return;

      floatButton.setAttribute('style', this.positionStyles);
    });
  }

  private calculateIfShouldHide() {
    const sidebar = document
      .getElementsByTagName('superviz-comments')[0]
      ?.shadowRoot.querySelector('.superviz-comments');

    const floatButton = this.shadowRoot.querySelector('.comments__floating-button');

    if (!sidebar || !floatButton) return;

    const {
      left: sbLeft,
      right: sbRight,
      top: sbTop,
      bottom: sbBottom,
    } = sidebar.getBoundingClientRect();
    const {
      left: fbLeft,
      right: fbRight,
      top: fbTop,
      bottom: fbBottom,
    } = floatButton.getBoundingClientRect();

    const sidebarHidesTop = sbBottom > fbTop && fbBottom > sbTop;
    const sidebarHidesBottom = sbTop < fbBottom && fbTop < sbBottom;
    const sidebarHidesLeft = sbRight > fbLeft && fbRight > sbLeft;
    const sidebarHidesRight = sbLeft < fbRight && fbLeft < sbRight;

    this.shouldHide =
      (sidebarHidesBottom || sidebarHidesTop) && (sidebarHidesLeft || sidebarHidesRight);
  }

  protected render() {
    this.calculateIfShouldHide();

    const floatButtonClasses = {
      'comments__floating-button': true,
      'hide-button': !this.isHidden && this.shouldHide,
      'is-active': this.isActive,
      'is-inactive': !this.isActive,
    };

    const textBoxClasses = {
      'comments__floating-button-text-box': true,
      'comments__floating-button-text-box--hovered': this.mouseHovering,
    };

    const textClasses = {
      text: true,
      'text-big': true,
      'text-bold': true,
      'not-hovered': !this.mouseHovering,
      'comments__floating-button__text': true,
      textActive: this.isActive,
      textInactive: !this.isActive,
    };

    return html` <button @click=${this.toggle} class="${classMap(floatButtonClasses)}">
      <div class="comments__floating-button__icon">
        <superviz-icon
          size="sm"
          name="comment"
          color=${this.mouseHovering || this.isActive ? 'white' : 'black'}
        ></superviz-icon>
        <svg class="cross" width="8px" height="8px" viewBox="0 0 8 8">
          <rect class="cross-bar-1" x="0" y="3" width="8px" height="2px" />
          <rect class="cross-bar-2" x="0" y="3" width="8px" height="2px" />
        </svg>
      </div>
      <div class=${classMap(textBoxClasses)}>
        <p class="${classMap(textClasses)} comment">Comment</p>
        <p class="${classMap(textClasses)} cancel">Cancel</p>
      </div>
    </button>`;
  }
}
