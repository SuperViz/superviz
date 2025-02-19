import { ParticipantByGroupApi } from '../../common/types/participant.types';
import sleep from '../../common/utils/sleep';
import '.';
import './components/topbar';
import './components/content';
import './components/comment-item';
import './components/comment-input';
import './components/annotation-pin';
import './components/annotation-item';
import './components/delete-comment-modal';
import './components/annotation-resolved';
import './components/annotation-filter';
import './components/float-button';
import './components/mention-list';

let element: HTMLElement;
const MOCK_PARTICIPANTS: ParticipantByGroupApi[] = [
  {
    name: 'John Zero',
    avatar: 'avatar1.png',
    id: '1',
    email: 'john.zero@mail.com',
  },
  {
    name: 'John Uno',
    avatar: 'avatar2.png',
    id: '2',
    email: 'john.uno@mail.com',
  },
  {
    name: 'John Doe',
    avatar: 'avatar3.png',
    id: '3',
    email: 'john.doe@mail.com',
  },
];
describe('comments', () => {
  beforeEach(async () => {
    element = document.createElement('superviz-comments');
    element.setAttribute('comments', JSON.stringify([]));
    document.body.appendChild(element);
    await sleep();
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  test('renders the component', async () => {
    const renderedElement = document.getElementsByTagName('superviz-comments')[0];
    expect(renderedElement).toBeTruthy();
  });

  test('should close superviz comments', async () => {
    const renderedElement = document.getElementsByTagName('superviz-comments')[0];
    const app = renderedElement.shadowRoot!.querySelector('.superviz-comments');

    renderedElement.setAttributeNode(document.createAttribute('open'));
    renderedElement.removeAttribute('open');

    expect(renderedElement.hasAttribute('open')).toBeFalsy();
    expect(app?.classList.contains('hide-at-left')).toBeTruthy();
  });

  test('should open superviz comments', async () => {
    const renderedElement = document.getElementsByTagName('superviz-comments')[0];
    const app = renderedElement.shadowRoot!.getElementById('superviz-comments');

    renderedElement.setAttributeNode(document.createAttribute('open'));

    await sleep();

    expect(renderedElement.hasAttribute('open')).toBeTruthy();
    expect(app?.classList.contains('superviz-comments')).toBe(true);
  });

  test('should update annotations', async () => {
    const annotations = [{ id: '1', x: 0, y: 0, width: 0, height: 0, text: 'test' }];

    element['updateAnnotations'](annotations);

    await sleep();

    expect(element['annotations']).toEqual(annotations);
  });

  test('should set filter', async () => {
    const label = 'test';
    const detail = { filter: { label } };

    element['setFilter']({ detail });

    await sleep();

    expect(element['annotationFilter']).toEqual(label);
  });

  test('should show water mark', async () => {
    const waterMark = true;
    element['waterMarkStatus'](waterMark);

    await sleep();

    expect(element['waterMarkState']).toEqual(waterMark);
  });

  test('should not show water mark', async () => {
    const waterMark = false;
    element['waterMarkStatus'](waterMark);

    await sleep();

    expect(element['waterMarkState']).toEqual(waterMark);
  });

  test('should receive participants List', async () => {
    const participantsList = JSON.stringify([MOCK_PARTICIPANTS]);

    element['participantsListed'](participantsList);

    await sleep();

    expect(element['participantsList']).toEqual(participantsList);
  });
});
