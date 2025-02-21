import { MOCK_ANNOTATION } from '../../../../__mocks__/comments.mock';
import sleep from '../../../common/utils/sleep';

import './annotation-filter';
import { AnnotationFilter } from './types';

let element: HTMLElement;

const createElement = async (annotation = MOCK_ANNOTATION, filter = AnnotationFilter.ALL) => {
  const element = document.createElement('superviz-comments-annotation-filter');
  element.setAttribute('filter', filter);
  document.body.appendChild(element);
  await sleep();
  return element;
};

describe('CommentsAnnotationFilter', () => {
  afterEach(() => {
    document.body.removeChild(element);
  });

  test('renders the filter', async () => {
    element = await createElement();

    expect(element).toBeDefined();
    expect(element['caret']).toBe('down');
  });

  test('should change the caret when the filter is clicked', async () => {
    element = await createElement();

    const filter = element.shadowRoot!.querySelector('.select-content') as HTMLElement;

    expect(element['caret']).toBe('down');

    filter.click();

    expect(element['caret']).toBe('up');
  });

  test('should emit event when the filter is selected', async () => {
    element = await createElement();
    element['emitEvent'] = jest.fn();

    const filter = element.shadowRoot!.querySelector('.select-content') as HTMLElement;

    filter.click();

    const dropdown = element.shadowRoot!.querySelector('superviz-dropdown') as HTMLElement;
    dropdown.dispatchEvent(new CustomEvent('selected', { detail: AnnotationFilter.RESOLVED }));

    const [eventName, eventDetail] = element['emitEvent'].mock.calls[0];

    expect(eventName).toBe('select');
    expect(eventDetail).toStrictEqual({
      filter: AnnotationFilter.RESOLVED,
    });
  });
});
