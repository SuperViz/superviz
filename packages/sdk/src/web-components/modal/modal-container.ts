import { CSSResultGroup, LitElement, html } from 'lit';

import { WebComponentsBase } from '../base';

import { modalStyle } from './styles/index.style';
import { ModalOptions } from './types';
import { CreateElement } from '../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, modalStyle];

@CreateElement('superviz-modal-container')
export class ModalContainer extends WebComponentsBaseElement {
  static styles = styles;

  private options: ModalOptions;

  setOptions(options: ModalOptions) {
    this.options = options;
  }

  private closeModal = () => {
    window.document.body.dispatchEvent(
      new CustomEvent('superviz-modal--close', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  private confirmModal = () => {
    window.document.body.dispatchEvent(
      new CustomEvent('superviz-modal--confirm', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  protected render() {
    const header = () => {
      return html`
        <div class="modal--header">
          <span class="text text-bold sv-gray-600">${this.options.title}</span>
          <div class="close" @click=${this.closeModal}>
            <superviz-icon name="close" size="md"></superviz-icon>
          </div>
        </div>
      `;
    };

    const body = () => {
      return html`
        <div class="modal--body">
          <div class="modal--body-content">${this.options.body}</div>
        </div>
      `;
    };

    const footer = () => {
      if (this.options.footer) {
        return html` <div class="modal--footer">${this.options.footer}</div> `;
      }

      const confirmLabel = this.options.confirmLabel || 'OK';
      const cancelLabel = this.options.cancelLabel || 'Cancel';

      if (this.options.confirm && this.options.cancel) {
        return html`
          <div class="modal--footer">
            <button class="text text-bold btn btn--cancel" @click=${this.closeModal}>
              ${cancelLabel}
            </button>
            <button class="text text-bold btn btn--confirm" @click=${this.confirmModal}>
              ${confirmLabel}
            </button>
          </div>
        `;
      }

      return html`
        <div class="modal--footer">
          <button class="text text-bold btn btn--confirm" @click=${this.confirmModal}>
            ${confirmLabel}
          </button>
        </div>
      `;
    };

    return html`
      <div class="modal--overlay"></div>
      <div class="modal--container">
        <div class="modal">${header()} ${body()} ${footer()}</div>
      </div>
    `;
  }
}
