import { LitElement } from 'lit';

import { useStore } from '../../common/utils/use-store';
import config from '../../services/config';

import { variableStyle, typography, svHr, iconButtonStyle } from './styles';
import { Constructor, WebComponentsBaseInterface } from './types';

export const WebComponentsBase = <T extends Constructor<LitElement>>(superClass: T) => {
  class WebComponentsBaseClass extends superClass {
    private unsubscribeFrom: Array<(id: unknown) => void> = [];
    protected useStore = useStore.bind(this) as typeof useStore;

    static styles = [
      variableStyle,
      typography,
      svHr,
      iconButtonStyle,
      (superClass as unknown as typeof LitElement).styles ?? [],
    ];

    public connectedCallback() {
      setTimeout(() => {
        const rootStyleElement = document.getElementById('superviz-style');
        const colorsStyleElement = this.createCustomColors();

        const style = document.createElement('style');
        style.innerHTML = rootStyleElement?.innerHTML || '';

        this.shadowRoot?.appendChild(style);

        if (colorsStyleElement) {
          this.shadowRoot?.appendChild(colorsStyleElement);
        }
      });

      super.connectedCallback();
    }

    /**
     * @function disconnectedCallback
     * @description Unsubscribes from all the subjects
     * @returns {void}
     */
    public disconnectedCallback() {
      super.disconnectedCallback();
      this.unsubscribeFrom.forEach((unsubscribe) => unsubscribe(this));
    }

    /**
     * @function createCustomColors
     * @description Creates a custom style tag with the colors from the configuration
     * @returns {HTMLStyleElement} - The style tag with the colors
     */
    private createCustomColors(): HTMLStyleElement {
      if (!config.get('colors')) return;

      const tag = document.createElement('style');
      const readyColors = Object.entries(config.get('colors'))
        .map(([key, value]) => `--${key}: ${value} !important;`)
        .join(' ');

      tag.innerHTML = `
      * {
        ${readyColors}
      }
    `;

      return tag;
    }

    /**
     * @function emitEvent
     * @description Emits a custom event with the given name, detail and optional configuration
     * @param {string} name - The name of the custom even
     * @param {object} detail - The detail of the custom event
     * @param {object} configs - The configuration of the custom event
     * @returns {void}
     */
    protected emitEvent(
      name: string,
      detail: object,
      configs: object = { composed: true, bubbles: true },
    ): void {
      const event = new CustomEvent(name, { detail, ...configs });
      this.dispatchEvent(event);
    }
  }

  return WebComponentsBaseClass as unknown as Constructor<WebComponentsBaseInterface> & T;
};
