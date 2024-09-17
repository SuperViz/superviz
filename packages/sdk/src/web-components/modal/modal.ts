import { CSSResultGroup, LitElement } from 'lit';

import { WebComponentsBase } from '../base';

import { ModalContainer } from './modal-container';
import { modalStyle } from './styles/index.style';
import { ModalOptions } from './types';
import { CreateElement } from '../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, modalStyle];

@CreateElement('superviz-modal')
export class Modal extends WebComponentsBaseElement {
  static styles = styles;

  private modal: ModalContainer;

  getContainer = () => window.document.querySelector('superviz-modal-container');

  createContainer = (options: ModalOptions) => {
    this.modal = document.createElement('superviz-modal-container') as ModalContainer;
    this.modal.setOptions(options);
  };

  protected firstUpdated(): void {
    window.document.body.addEventListener('superviz-modal--open', this.createModal);
    window.document.body.addEventListener('superviz-modal--close', this.destroyModal);
  }

  private createModal = ({ detail }: CustomEvent) => {
    this.createContainer(detail);

    window.document.body.appendChild(this.modal);
  };

  private destroyModal = () => {
    this.modal = undefined;
    this.getContainer()?.remove();
  };

  disconnectedCallback(): void {
    this.destroyModal();

    window.document.body.removeEventListener('superviz-modal--open', this.createModal);
    window.document.body.removeEventListener('superviz-modal--close', this.destroyModal);
  }
}
