import '.';

import sleep from '../../common/utils/sleep';

const createEl = (): HTMLElement => {
  const element: HTMLElement = document.createElement('superviz-modal');
  document.body.appendChild(element);
  return element;
};

describe('modal', () => {
  afterEach(() => {
    document.body.querySelector('superviz-modal')?.remove();
  });

  test('should render modal container when open is true', async () => {
    createEl();
    await sleep(100);

    document.body.dispatchEvent(
      new CustomEvent('superviz-modal--open', {
        detail: {},
      }),
    );

    await sleep(100);

    const container = document.body.querySelector('superviz-modal-container');

    expect(container).toBeTruthy();
  });

  test('should destroy modal when open is false', async () => {
    const element = createEl();

    await sleep(100);

    document.body.dispatchEvent(
      new CustomEvent('superviz-modal--open', {
        detail: {},
      }),
    );

    await sleep(100);

    document.body.dispatchEvent(new CustomEvent('superviz-modal--close'));

    await sleep(500);

    expect(element['modal']).toBeFalsy();
  });

  test('should destroy modal when disconnected', async () => {
    const element = createEl();
    await sleep(100);

    document.body.dispatchEvent(
      new CustomEvent('superviz-modal--open', {
        detail: {},
      }),
    );

    await sleep(100);

    document.body.removeEventListener = jest.fn();

    element.remove();

    await sleep(500);

    expect(element!['modal']).toBeFalsy();

    expect(document.body.removeEventListener).toBeCalledTimes(2);
  });

  test('should render modal', async () => {
    const element = createEl();

    document.body.addEventListener = jest.fn();

    await sleep(100);

    expect(element).toBeTruthy();

    expect(document.body.addEventListener).toBeCalledTimes(2);
  });
});
