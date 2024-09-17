import { CSSResultGroup, LitElement, html } from 'lit';

import { WebComponentsBase } from '../../base';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles];

@CreateElement('superviz-comments-delete-comments-modal')
export class DeleteCommentModal extends WebComponentsBaseElement {
  static styles = styles;

  static properties = {
    open: { type: Boolean },
    useSlot: { type: Boolean },
  };

  declare open: boolean;
  declare useSlot: boolean;

  protected firstUpdated(): void {
    window.document.body.addEventListener('superviz-modal--close', () => {
      if (!this.open) return;
      this.emitEvent(
        'close',
        {},
        {
          bubbles: false,
          composed: false,
        },
      );
    });

    window.document.body.addEventListener('superviz-modal--confirm', () => {
      if (!this.open) return;
      this.emitEvent(
        'confirm',
        {},
        {
          bubbles: false,
          composed: false,
        },
      );
      this.emitEventCloseModal();
    });
  }

  protected updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('open')) {
      if (this.open) setTimeout(() => this.emitEventOpenModal());
      if (!this.open) setTimeout(() => this.emitEventCloseModal());
    }
  }

  private emitEventOpenModal = () => {
    window.document.body.dispatchEvent(
      new CustomEvent('superviz-modal--open', {
        detail: {
          title: 'DELETE COMMENT',
          body: html`<span class="text text-big sv-gray-600"
            >Are you sure you want to delete this comment? <br />
            This action cannot be undone</span
          >`,
          confirmLabel: 'DELETE',
          confirm: true,
          cancel: true,
        },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private emitEventCloseModal() {
    if (!this.open) return;
    window.document.body.dispatchEvent(
      new CustomEvent('superviz-modal--close', {
        detail: {
          open: true,
        },
        bubbles: true,
        composed: true,
      }),
    );

    this.emitEvent(
      'close',
      {},
      {
        bubbles: false,
        composed: false,
      },
    );
  }

  private toggle = () => {
    this.open = !this.open;
  };

  protected render() {
    const slot = () => {
      if (!this.useSlot) return;
      return html`<slot name="modal-handler" @click=${this.toggle}></slot>`;
    };

    const modal = () => {
      if (!this.open) return;

      return html` <superviz-modal></superviz-modal> `;
    };

    return html` ${slot()} ${modal()} `;
  }
}
