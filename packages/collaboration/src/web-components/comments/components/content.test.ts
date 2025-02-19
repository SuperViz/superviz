import { MOCK_ANNOTATION } from '../../../../__mocks__/comments.mock';
import sleep from '../../../common/utils/sleep';
import './content';

import { AnnotationFilter } from './types';

let element: HTMLElement;

const createElement = async (annotations = [MOCK_ANNOTATION], filter = AnnotationFilter.ALL) => {
  element = document.createElement('superviz-comments-content');
  element.setAttribute('annotations', JSON.stringify(annotations));
  element.setAttribute('annotationFilter', filter);
  document.body.appendChild(element);
  await element['updateComplete'];
  await sleep(100);
  return element;
};

describe('CommentsContent', () => {
  afterEach(() => {
    document.body.removeChild(element);
  });

  test('renders the component', async () => {
    element = await createElement();
    expect(element).toBeTruthy();
  });

  test('should select annotation', async () => {
    element = await createElement();

    await sleep();

    const annotationItem = element.shadowRoot!.querySelectorAll(
      'superviz-comments-annotation-item',
    )[0];

    document.body?.dispatchEvent(
      new CustomEvent('select-annotation', {
        detail: {
          uuid: 'any_uuid',
        },
      }),
    );

    await sleep();

    expect(annotationItem?.getAttribute('selected')).toBe('any_uuid');
    expect(element['selectedAnnotation']).toBe('any_uuid');
  });

  test('if has no comments, should display only annotation pin', async () => {
    element = await createElement([
      {
        ...MOCK_ANNOTATION,
        comments: [],
      },
    ]);

    await sleep();

    const annotationItem = element.shadowRoot?.querySelector('superviz-comments-annotation-item');
    expect(annotationItem).toBeFalsy();
  });
});
