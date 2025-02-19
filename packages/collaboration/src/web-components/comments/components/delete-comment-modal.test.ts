import sleep from '../../../common/utils/sleep';

import './delete-comment-modal';

const createEl = async (open = false) => {
  const element = document.createElement('superviz-comments-delete-comments-modal');
  document.body.appendChild(element);

  if (open) {
    element.setAttributeNode(document.createAttribute('open'));
  }

  await element['updateComplete'];

  return element;
};

const element = () => document.getElementsByTagName('superviz-comments-delete-comments-modal')[0];
const modal = () => element().shadowRoot!.querySelector('superviz-modal') as HTMLElement;

describe('delete-comment-modal', () => {
  afterEach(() => {
    document.body.querySelector('superviz-comments-delete-comments-modal')?.remove();
  });

  test('should render', async () => {
    const element = await createEl();
    const modal = element.shadowRoot!.querySelector('superviz-modal') as HTMLElement;

    expect(element).toBeTruthy();
    expect(modal).toBeFalsy();
  });

  test('should open modal', async () => {
    const element = await createEl();

    expect(element['open']).toBeFalsy();

    element.setAttributeNode(document.createAttribute('open'));

    await element['updateComplete'];

    expect(element['open']).toBeTruthy();

    expect(modal()).toBeTruthy();
  });

  test('should close modal', async () => {
    const element = await createEl(true);

    expect(element['open']).toBeTruthy();

    element.removeAttribute('open');

    await element['updateComplete'];

    expect(element['open']).toBeFalsy();

    expect(modal()).toBeFalsy();
  });

  test('should emit event close modal', async () => {
    const element = await createEl(true);

    const spy = jest.fn();
    element.addEventListener('close', spy);
    window.document.body.dispatchEvent(
      new CustomEvent('superviz-modal--close', { composed: true, bubbles: true }),
    );

    await element['updateComplete'];

    expect(spy).toHaveBeenCalled();
  });

  test('should emit event confirm', async () => {
    const element = await createEl(true);

    const spy = jest.fn();
    element.addEventListener('confirm', spy);
    window.document.body.dispatchEvent(
      new CustomEvent('superviz-modal--confirm', { composed: true, bubbles: true }),
    );

    await element['updateComplete'];

    expect(spy).toHaveBeenCalled();
  });

  test('should render slot when useSlot is true', async () => {
    const element = await createEl();

    element.setAttributeNode(document.createAttribute('useSlot'));

    const slot = document.createElement('slot');
    slot.setAttribute('name', 'modal-handler');
    element.appendChild(slot);

    await element['updateComplete'];

    expect(slot).toBeTruthy();
  });

  test('should close modal when click in slot', async () => {
    const renderedElement = await createEl(true);
    renderedElement.setAttributeNode(document.createAttribute('useSlot'));
    const slot = document.createElement('div');
    slot.setAttribute('slot', 'modal-handler');
    renderedElement.appendChild(slot);

    await renderedElement['updateComplete'];

    slot.click();

    await renderedElement['updateComplete'];

    expect(renderedElement['open']).toBeFalsy();
  });
});
