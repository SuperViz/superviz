import '.';
import sleep from '../../common/utils/sleep';

const element = document.createElement('superviz-hello-world');
document.body.appendChild(element);

describe('hello-world', () => {
  test('should have a div with text', async () => {
    const renderedElement = document.getElementsByTagName('superviz-hello-world')[0];

    renderedElement.setAttribute('name', 'John');

    await sleep();

    expect(renderedElement.shadowRoot?.querySelector('div')?.textContent).toEqual(
      'Hello from SuperViz, John',
    );
  });
});
