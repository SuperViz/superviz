import sleep from '../../../common/utils/sleep';

import './float-button';
import type { CommentsFloatButton } from './float-button';

let element: CommentsFloatButton;

const createElement = (): CommentsFloatButton => {
  const element = document.createElement('superviz-comments-button');
  document.body.appendChild(element);

  return element as CommentsFloatButton;
};

// @TODO - should add mouse event test support

describe('comments-float-button', () => {
  afterEach(() => {
    element?.remove();
  });

  test('should mount the element on top-left corner', async () => {
    element = createElement();

    await sleep();

    const rect = element.shadowRoot?.querySelector('button')?.getBoundingClientRect();

    expect(rect?.top).toBe(20);
    expect(rect?.left).toBe(20);
  });

  test('should emit toggle event when clicked', async () => {
    element = createElement();

    const spy = jest.fn();
    element.addEventListener('toggle', spy);

    await sleep();

    element.shadowRoot?.querySelector('button')?.click();

    expect(spy).toHaveBeenCalled();
  });

  test('should toggle pinActive state', () => {
    element = createElement();
    element['isActive'] = false;

    element['onTogglePinActive']({ detail: { isActive: true } } as CustomEvent);

    expect(element['isActive']).toBe(true);
  });
});
