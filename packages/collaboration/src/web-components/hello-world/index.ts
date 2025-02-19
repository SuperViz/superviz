import { LitElement, css, html } from 'lit';
import { CreateElement } from '../global/decorators/create-element.decorator';

@CreateElement('superviz-hello-world')
export class HelloWorld extends LitElement {
  declare name: string;

  static properties = {
    name: { type: String },
  };

  static styles = css`
    div {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: black;
      color: white;
    }
  `;

  protected render() {
    return html` <div>Hello from SuperViz, ${this.name}</div> `;
  }
}
