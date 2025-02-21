import { MOCK_ANNOTATION } from '../../../../__mocks__/comments.mock';
import sleep from '../../../common/utils/sleep';

import './annotation-item';
import { AnnotationFilter } from './types';

let element: HTMLElement;

const createElement = async (annotation = MOCK_ANNOTATION, filter = AnnotationFilter.ALL) => {
  const element = document.createElement('superviz-comments-annotation-item');
  element.setAttribute('annotation', JSON.stringify(annotation));
  element.setAttribute('annotationFilter', filter);
  element.setAttribute('participantsList', JSON.stringify([]));
  document.body.appendChild(element);
  await sleep();
  return element;
};

describe('CommentsAnnotationItem', () => {
  afterEach(() => {
    document.body.removeChild(element);
  });

  test('renders the annotation', async () => {
    element = await createElement(MOCK_ANNOTATION);

    expect(element).toBeDefined();
  });

  test('expands the comments when the annotation is selected', async () => {
    element = await createElement(MOCK_ANNOTATION);
    const annotationItem = element.shadowRoot!.querySelector('.comments__thread') as HTMLElement;
    const commentsContainer = element.shadowRoot!.querySelector(
      '.comments-container',
    ) as HTMLElement;

    expect(annotationItem.classList.contains('.comments__thread--selected')).toBe(false);
    expect(commentsContainer.classList.contains('show')).toBe(false);
    expect(commentsContainer.classList.contains('.comments__thread--expand')).toBe(false);

    annotationItem!.addEventListener('select-annotation', () => {
      element.setAttribute('selected', MOCK_ANNOTATION.uuid);
    });

    annotationItem.click();

    annotationItem!.dispatchEvent(
      new CustomEvent('select-annotation', { detail: { resolved: 'true' } }),
    );

    await sleep();

    const expectedAnnotation = element.shadowRoot!.querySelector(
      '.comments__thread',
    ) as HTMLElement;
    const expectedCommentsContainer = element.shadowRoot!.querySelector(
      '.comments-container',
    ) as HTMLElement;

    expect(expectedAnnotation.classList.contains('comments__thread--selected')).toBe(true);
    expect(expectedCommentsContainer.classList.contains('comment-item--expand')).toBe(true);
    expect(expectedCommentsContainer.classList.contains('hidden')).toBe(false);
  });

  test('should create a new comment in annotation', async () => {
    element = await createElement(MOCK_ANNOTATION);
    element['dispatchEvent'] = jest.fn();
    const commentInput = element.shadowRoot!.querySelector(
      'superviz-comments-comment-input',
    ) as HTMLElement;

    commentInput!.dispatchEvent(
      new CustomEvent('create-comment', {
        detail: {
          text: 'new comment',
        },
      }),
    );

    await sleep();

    expect(element['dispatchEvent']).toHaveBeenCalledWith(
      new CustomEvent('create-comment', {
        detail: {
          text: 'new comment',
          uuid: MOCK_ANNOTATION.uuid,
        },
      }),
    );
  });

  test('should resolve annotation', async () => {
    element = await createElement(MOCK_ANNOTATION);
    const commentItem = element.shadowRoot!.querySelector(
      'superviz-comments-comment-item',
    ) as HTMLElement;

    commentItem!.dispatchEvent(
      new CustomEvent('resolve-annotation', {
        detail: {
          type: 'resolve-annotation',
          resolved: true,
        },
      }),
    );

    await sleep();

    expect(element['shouldShowUndoResolved']).toBe(true);
  });

  test('when the annotation is resolved, the comment is hidden', async () => {
    element = await createElement({
      ...MOCK_ANNOTATION,
      resolved: true,
    });

    const annotationHidden = element!.shadowRoot!.querySelector('.hidden');

    expect(annotationHidden).toBeDefined();
  });

  test('when annotation resolved emit event hide, shouldShowUndoResolved should be false', async () => {
    element = await createElement(MOCK_ANNOTATION);

    element.setAttributeNode(document.createAttribute('shouldShowUndoResolved'));

    await sleep();

    const annotationItem = element.shadowRoot!.querySelector(
      'superviz-comments-annotation-resolved',
    ) as HTMLElement;
    annotationItem!.dispatchEvent(new CustomEvent('hide', {}));

    await sleep();

    expect(element['shouldShowUndoResolved']).toBe(false);
  });
});
