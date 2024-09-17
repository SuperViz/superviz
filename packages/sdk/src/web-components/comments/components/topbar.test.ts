import './topbar';

const element = document.createElement('superviz-comments-topbar');
document.body.appendChild(element);

describe('CommentsTopbar', () => {
  test('renders the component', async () => {
    const renderedElement = document.getElementsByTagName('superviz-comments-topbar')[0];
    expect(renderedElement).toBeTruthy();
  });

  test('renders the title', async () => {
    const renderedElement = document.getElementsByTagName('superviz-comments-topbar')[0];
    const title = renderedElement.shadowRoot!.querySelector('.text-bold');
    expect(title?.textContent).toEqual('COMMENTS');
  });

  test('dispatches a close event when the close button is clicked', async () => {
    const renderedElement = document.getElementsByTagName('superviz-comments-topbar')[0];
    const closeButton = renderedElement.shadowRoot!.querySelector(
      '.comments__topbar__close-threads',
    );
    const spy = jest.fn();

    renderedElement.addEventListener('close-threads', spy);
    closeButton?.dispatchEvent(new Event('click'));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
