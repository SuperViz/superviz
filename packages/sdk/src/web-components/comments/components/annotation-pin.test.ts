import { MOCK_ANNOTATION } from '../../../../__mocks__/comments.mock';
import { MOCK_LOCAL_PARTICIPANT } from '../../../../__mocks__/participants.mock';
import sleep from '../../../common/utils/sleep';
import { useGlobalStore } from '../../../services/stores';

import type { CommentsAnnotationPin } from './annotation-pin';
import { PinMode } from './types';

import './annotation-pin';
import '../../icon';

interface CreateAnnotationPinOptions {
  type?: PinMode;
  showInput?: boolean;
}

function createAnnotationPin({
  type = PinMode.SHOW,
  showInput = undefined,
}: CreateAnnotationPinOptions): CommentsAnnotationPin {
  const annotationPin = document.createElement(
    'superviz-comments-annotation-pin',
  ) as CommentsAnnotationPin;

  annotationPin.setAttribute('type', type);
  annotationPin.setAttribute('annotation', JSON.stringify(MOCK_ANNOTATION));
  annotationPin.setAttribute(
    'containerSides',
    JSON.stringify({ left: 0, top: 0, right: 1000, bottom: 1000 }),
  );

  if (showInput) annotationPin.setAttribute('showInput', '');
  if (!showInput) annotationPin.removeAttribute('showInput');

  return annotationPin;
}

/**
 * @TODO Add tests for the following:
 * - Clicking on the pin should open the annotation
 * - When user's avatar is not available, the first letter of the user's name should be displayed
 */

describe('annotation-pin', () => {
  beforeEach(() => {
    const { localParticipant } = useGlobalStore();
    localParticipant.value = MOCK_LOCAL_PARTICIPANT;
  });

  afterEach(() => {
    const element = document.getElementsByTagName('superviz-comments-annotation-pin')[0];

    element?.remove();
  });

  test('renders the component with type SHOW', async () => {
    const element = createAnnotationPin({});
    document.body.appendChild(element);

    await sleep();

    const renderedElement = document.getElementsByTagName('superviz-comments-annotation-pin')[0];

    expect(renderedElement).toBeTruthy();
    expect(renderedElement.shadowRoot?.querySelector('.comments__annotation-pin')).toBeTruthy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin--active'),
    ).toBeFalsy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin__avatar'),
    ).toBeTruthy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin__avatar--add'),
    ).toBeFalsy();
  });

  test('renders the component with type ADD', async () => {
    const element = createAnnotationPin({ type: PinMode.ADD });
    document.body.appendChild(element);

    await sleep();

    const renderedElement = document.getElementsByTagName('superviz-comments-annotation-pin')[0];

    expect(renderedElement).toBeTruthy();
    expect(renderedElement.shadowRoot?.querySelector('.comments__annotation-pin')).toBeTruthy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin__avatar'),
    ).toBeTruthy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin__avatar--add'),
    ).toBeTruthy();
  });

  test('renders the component with type SHOW and active', async () => {
    const element = createAnnotationPin({});
    element.setAttribute('active', 'true');
    document.body.appendChild(element);

    await sleep();

    const renderedElement = document.getElementsByTagName('superviz-comments-annotation-pin')[0];

    expect(renderedElement).toBeTruthy();
    expect(renderedElement.shadowRoot?.querySelector('.comments__annotation-pin')).toBeTruthy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin--active'),
    ).toBeTruthy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin__avatar'),
    ).toBeTruthy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin__avatar--add'),
    ).toBeFalsy();
  });

  test('renders the component with type ADD and active', async () => {
    const element = createAnnotationPin({ type: PinMode.ADD });
    element.setAttribute('active', 'true');
    document.body.appendChild(element);

    await sleep();

    const renderedElement = document.getElementsByTagName('superviz-comments-annotation-pin')[0];

    expect(renderedElement).toBeTruthy();
    expect(renderedElement.shadowRoot?.querySelector('.comments__annotation-pin')).toBeTruthy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin--active'),
    ).toBeTruthy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin__avatar'),
    ).toBeTruthy();
    expect(
      renderedElement.shadowRoot?.querySelector('.comments__annotation-pin__avatar--add'),
    ).toBeTruthy();
  });

  test('should emit an event when the pin is clicked', async () => {
    const spy = jest.fn();
    const element = createAnnotationPin({});
    document.body.appendChild(element);

    await sleep();

    document.body.addEventListener('select-annotation', spy);

    const renderedElement = document.getElementsByTagName('superviz-comments-annotation-pin')[0];
    const clickablePin = renderedElement.shadowRoot!.querySelector(
      '.comments__annotation-pin',
    ) as HTMLDivElement;
    clickablePin.click();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      new CustomEvent('select-annotation', {
        detail: { uuid: MOCK_ANNOTATION.uuid },
      }),
    );
  });

  describe('showInput is true', () => {
    test('renders the user avatar with an image', async () => {
      const element = createAnnotationPin({ showInput: true });
      document.body.appendChild(element);

      await sleep();

      const renderedElement = document.getElementsByTagName('superviz-comments-annotation-pin')[0];

      expect(renderedElement).toBeTruthy();
      expect(renderedElement.shadowRoot?.querySelector('.comments__annotation-pin')).toBeTruthy();
      expect(
        renderedElement.shadowRoot?.querySelector('.comments__annotation-pin--active'),
      ).toBeFalsy();
      expect(
        renderedElement.shadowRoot?.querySelector('.comments__annotation-pin__avatar'),
      ).toBeTruthy();
    });

    test('renders the user avatar without an image', async () => {
      MOCK_ANNOTATION.comments.at(0)!.participant.avatar = '';
      const element = createAnnotationPin({ showInput: true });
      MOCK_ANNOTATION.comments.at(0)!.participant.avatar = 'mock_avatar';
      document.body.appendChild(element);

      await sleep();

      const renderedElement = document.getElementsByTagName('superviz-comments-annotation-pin')[0];

      expect(renderedElement).toBeTruthy();
      expect(renderedElement.shadowRoot?.querySelector('.comments__annotation-pin')).toBeTruthy();
      expect(
        renderedElement.shadowRoot?.querySelector('.comments__annotation-pin--active'),
      ).toBeFalsy();
      expect(
        renderedElement.shadowRoot?.querySelector('.comments__annotation-pin__avatar'),
      ).toBeTruthy();
    });

    test('should cancel temporary annotation when Esc is pressed', async () => {
      const element = createAnnotationPin({ showInput: true, type: PinMode.ADD });
      document.body.appendChild(element);

      await sleep();

      element['cancelTemporaryAnnotationEsc'] = jest.fn(element['cancelTemporaryAnnotation']);

      const renderedElement = document.getElementsByTagName('superviz-comments-annotation-pin')[0];
      renderedElement.shadowRoot!.querySelector('div')!.click();

      expect(element['cancelTemporaryAnnotationEsc']).toHaveBeenCalledTimes(0);
      expect(element['annotation']).toBeTruthy();

      const event = new KeyboardEvent('keyup', { key: 'Escape' });
      window.document.body.dispatchEvent(event);

      expect(element['cancelTemporaryAnnotationEsc']).toHaveBeenCalledTimes(1);
      expect(element['annotation']).toBeNull();
    });

    test('should create annotation when input signals to create', async () => {
      const element = createAnnotationPin({ showInput: true, type: PinMode.ADD });
      document.body.appendChild(element);
      element['createComment'] = jest.fn(element['createComment']);
      const spy = jest.fn();

      document.body.addEventListener('create-annotation', spy);
      await sleep();

      const renderedElement = document.getElementsByTagName('superviz-comments-annotation-pin')[0];
      renderedElement.shadowRoot!.querySelector('div')!.click();

      expect(element['annotation']).toBeTruthy();

      const input = renderedElement.shadowRoot!.querySelector('superviz-comments-comment-input')!;
      input.dispatchEvent(new CustomEvent('create-annotation'));

      expect(element['annotation']).toBeNull();
      expect(element['createComment']).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
