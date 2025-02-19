import sleep from '../../../common/utils/sleep';
let element: HTMLElement;

import './annotation-resolved';

const createElement = async (timeToHide = 1000) => {
  const element = document.createElement('superviz-comments-annotation-resolved');

  element.setAttribute('timeToHide', timeToHide.toString());

  document.body.appendChild(element);
  await sleep(100);
  return element;
};

describe('AnnotationResolved', () => {
  afterEach(() => {
    document.body.removeChild(element);
  });

  test('should render', async () => {
    element = await createElement();

    expect(element!.shadowRoot!.querySelector('annotation-resolved')).toBeDefined();
  });

  test('when timeToHide is 0, should not render', async () => {
    element = await createElement();
    element['timeToHide'] = 0;

    await sleep(1);

    expect(element!.shadowRoot!.querySelector('annotation-resolved')).toBeNull();
  });

  test('when elapsed time is 10 seconds, should not render', async () => {
    element = await createElement(1000);

    await sleep(1001);

    expect(element!.shadowRoot?.querySelector('comments__annotation-resolved')).toBeNull();
  });

  test('when click undone, cancel should be true and dispatch event undo-resolve', async () => {
    element = await createElement(1000);
    expect(element!.shadowRoot?.querySelector('.comments__annotation-resolved')).not.toBeNull();
    element['emitEvent'] = jest.fn();

    const undoneBtn = element!.shadowRoot!.querySelector('#undone') as HTMLElement;
    undoneBtn.click();

    expect(element['isCanceled']).toBe(true);

    const [eventName1, eventData1, eventOptions1] = element['emitEvent'].mock.calls[0];
    const [eventName2, eventData2, eventOptions2] = element['emitEvent'].mock.calls[1];

    expect(eventName1).toBe('hide');
    expect(eventData1).toEqual({});
    expect(eventOptions1).toEqual({ bubbles: false, composed: false });

    expect(eventName2).toBe('undo-resolve');
    expect(eventData2).toEqual({ type: 'undo-resolve', resolved: false });
    expect(eventOptions2).toEqual({ bubbles: false, composed: false });
  });
});
