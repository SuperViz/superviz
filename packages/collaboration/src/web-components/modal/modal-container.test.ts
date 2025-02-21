import { html } from 'lit';
import '.';

import sleep from '../../common/utils/sleep';

import { ModalOptions } from './types';

const createEl = (options: ModalOptions): HTMLElement => {
  const element: HTMLElement = document.createElement('superviz-modal-container');
  document.body.appendChild(element);
  element['setOptions'](options);
  return element;
};

describe('modal-container', () => {
  afterEach(() => {
    document.body.querySelector('superviz-modal')?.remove();
  });

  test('should render modal container when open is true', async () => {
    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big"
        >Are you sure you want to delete this comment? <br />
        This action cannot be undone</span
      >`,
      confirmLabel: 'DELETE',
      confirm: true,
      cancel: true,
    });

    await sleep(100);

    expect(element).toBeTruthy();
  });

  test('should render title in header', async () => {
    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big"
        >Are you sure you want to delete this comment? <br />
        This action cannot be undone</span
      >`,
      confirmLabel: 'DELETE',
      confirm: true,
      cancel: true,
    });

    await sleep(100);

    const title = element?.shadowRoot?.querySelector('.modal--header .text')?.textContent;

    expect(title).toEqual('DELETE COMMENT');
  });

  test('should render body', async () => {
    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big"
        >Are you sure you want to delete this comment? <br />
        This action cannot be undone</span
      >`,
      confirmLabel: 'DELETE',
      confirm: true,
      cancel: true,
    });

    await sleep(100);

    const body = element?.shadowRoot?.querySelector(
      '.modal--body .modal--body-content',
    )?.textContent;

    expect(body?.trim().replace('  ', ' ').replace('\n', '')).toBe(
      'Are you sure you want to delete this comment?        This action cannot be undone',
    );
  });

  test('should render footer', async () => {
    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big"
        >Are you sure you want to delete this comment? <br />
        This action cannot be undone</span
      >`,
    });

    await sleep(100);

    const footer = element?.shadowRoot?.querySelector('.modal--footer');

    expect(footer).toBeTruthy();
  });

  test('should render confirm button', async () => {
    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big"
        >Are you sure you want to delete this comment? <br />
        This action cannot be undone</span
      >`,
      confirm: true,
    });

    await sleep(100);

    const confirm = element?.shadowRoot?.querySelector('.modal--footer .btn--confirm');

    expect(confirm).toBeTruthy();
  });

  test('should render confirm and cancel button', async () => {
    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big"
        >Are you sure you want to delete this comment? <br />
        This action cannot be undone</span
      >`,
      confirm: true,
      cancel: true,
    });

    await sleep(100);

    const confirm = element?.shadowRoot?.querySelector('.modal--footer .btn--confirm');
    const cancel = element?.shadowRoot?.querySelector('.modal--footer .btn--cancel');

    expect(confirm).toBeTruthy();
    expect(cancel).toBeTruthy();
  });

  test('should render confirm and cancel button with custom label', async () => {
    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big"
        >Are you sure you want to delete this comment? <br />
        This action cannot be undone</span
      >`,
      confirmLabel: 'DELETE',
      cancelLabel: 'CANCEL',
      confirm: true,
      cancel: true,
    });

    await sleep(100);

    const confirm = element?.shadowRoot?.querySelector('.modal--footer .btn--confirm');
    const cancel = element?.shadowRoot?.querySelector('.modal--footer .btn--cancel');

    expect(confirm?.textContent?.trim()).toEqual('DELETE');
    expect(cancel?.textContent?.trim()).toEqual('CANCEL');
  });

  test('should close modal when click on close button', async () => {
    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big"
        >Are you sure you want to delete this comment? <br />
        This action cannot be undone</span
      >`,
      confirm: true,
      cancel: true,
    });

    await sleep(100);

    const close = element?.shadowRoot?.querySelector('.modal--header .close');

    window.document.body.dispatchEvent = jest.fn();

    close?.dispatchEvent(new Event('click'));

    expect(window.document.body.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  test('should close modal when click on cancel button', async () => {
    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big"
        >Are you sure you want to delete this comment? <br />
        This action cannot be undone</span
      >`,
      confirm: true,
      cancel: true,
    });

    await sleep(100);

    const cancel = element?.shadowRoot?.querySelector('.modal--footer .btn--cancel');

    window.document.body.dispatchEvent = jest.fn();

    cancel?.dispatchEvent(new Event('click'));

    expect(window.document.body.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  test('should confirm modal when click on confirm button', async () => {
    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big"
        >Are you sure you want to delete this comment? <br />
        This action cannot be undone</span
      >`,
      confirm: true,
      cancel: true,
    });

    await sleep(100);

    const confirm = element?.shadowRoot?.querySelector('.modal--footer .btn--confirm');

    window.document.body.dispatchEvent = jest.fn();

    confirm?.dispatchEvent(new Event('click'));

    expect(window.document.body.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  test('should render custom footer', async () => {
    const footer = html`<div class="text text-bold">Custom footer</div>`;

    const element = createEl({
      title: 'DELETE COMMENT',
      body: html`<span class="text text-big">Are you sure you want to delete this comment?</span>`,
      footer,
    });

    await sleep(100);

    const footerEl = element?.shadowRoot?.querySelector('.modal--footer');

    expect(footerEl?.textContent?.trim()).toEqual('Custom footer');
  });
});
