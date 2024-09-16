import { CSSResultGroup, html, LitElement, PropertyValueMap } from 'lit';

import sleep from '../../common/utils/sleep';

import importStyle from './utils/importStyle';

import { WebComponentsBase } from './index';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles || []];

class TestElement extends WebComponentsBaseElement {
  static styles = styles;

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    super.firstUpdated(_changedProperties);
    importStyle.call(this, 'test');
  }

  render() {
    return html`
      <div id="bold-and-gray-200" class="text text-bold sv-gray-200">Hello, world!</div>
      <div id="big-and-gray-600" class="text text-big sv-gray-600">Hello, world!</div>
      <div id="normal" class="text">Hello, world!</div>
    `;
  }
}

customElements.define('test-element', TestElement);

const createElement = (): Element => {
  const element = document.createElement('test-element');
  document.body.appendChild(element);
  const style = document.createElement('style');
  style.innerText = 'h6 { color: purple; }';

  style.id = 'superviz-test-styles';
  document.head.appendChild(style);
  return element;
};

describe('WebComponentsBase', () => {
  test('should have correctly added styles', async () => {
    const element = createElement();

    await sleep(0);

    const normalStyle = getComputedStyle(element.shadowRoot!.querySelector('#normal')!);
    const boldAndGray200 = getComputedStyle(
      element.shadowRoot!.querySelector('#bold-and-gray-200')!,
    );
    const bigAndGray600 = getComputedStyle(element.shadowRoot!.querySelector('#big-and-gray-600')!);

    expect(normalStyle.color).toBe('rgb(0, 0, 0)');
    expect(normalStyle.fontSize).toBe('12px');
    expect(normalStyle.fontWeight).toBe('400');
    expect(normalStyle.fontFamily).toBe('Roboto');

    expect(boldAndGray200.color).toBe('rgb(233, 229, 239)');
    expect(boldAndGray200.fontSize).toBe('12px');
    expect(boldAndGray200.fontWeight).toBe('700');
    expect(boldAndGray200.fontFamily).toBe('Roboto');

    expect(bigAndGray600.color).toBe('rgb(87, 83, 95)');
    expect(bigAndGray600.fontSize).toBe('14px');
    expect(bigAndGray600.fontWeight).toBe('400');
    expect(bigAndGray600.fontFamily).toBe('Roboto');
  });

  test('should inject styles from the superviz style tag', async () => {
    const element = createElement();

    await sleep();

    expect(element.shadowRoot?.querySelector('style')?.innerHTML).toContain(
      '@import"https://unpkg.com/@superviz/sv-icons@0.8.7/css/style.css";',
    );
  });

  test('should inject styles from the superviz style tag', async () => {
    const element = createElement();

    await sleep();

    expect(element.shadowRoot?.adoptedStyleSheets[4].cssRules.item(0)?.cssText).toBe(
      'h6 { color: purple; }',
    );
  });
});
