import { CSSResultGroup, LitElement, css, html } from 'lit';

import { WebComponentsBase } from '../base';

import { IconSizes } from './types';
import { CreateElement } from '../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles];

@CreateElement('superviz-icon')
export class Icon extends WebComponentsBaseElement {
  declare name: string;
  declare size: string;
  declare color: 'white' | 'black';
  declare suffix: string;

  constructor() {
    super();

    this.name = '';
    this.size = 'md';
  }

  static properties = {
    name: { type: String },
    size: { type: String },
    color: { type: String },
    suffix: { type: String },
  };

  private get iconSize(): string {
    return IconSizes[this.size];
  }

  static styles = [
    styles,
    css`
      div {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: black;
        color: white;
      }

      i,
      i.black {
        color: rgba(var(--sv-gray-600));
      }

      i.white {
        color: white;
      }
    `,
  ];

  protected render() {
    this.color ||= 'black';

    return html`
      <i
        class="sv-icon sv-icon-${this.name}_${this.suffix ?? this.size} ${this.color}"
        style="font-size: ${this.iconSize}px"
      ></i>
    `;
  }
}
