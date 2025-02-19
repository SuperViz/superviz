import { MOCK_PARTICIPANT_LIST } from '../../../../__mocks__/participants.mock';
import sleep from '../../../common/utils/sleep';

import './mention-list';

describe('CommentsMentionList', () => {
  let element;

  beforeEach(async () => {
    element = document.createElement('superviz-comments-mention-list');
    document.body.appendChild(element);
    await sleep();
  });

  test('renders without participants', async () => {
    await element.updateComplete;
    expect(element.shadowRoot.getElementById('mention-list').style.display).toEqual('none');
  });

  test('renders with participants', async () => {
    element.participants = MOCK_PARTICIPANT_LIST;
    await element.updateComplete;

    expect(element.shadowRoot.getElementById('mention-list').style.display).toEqual('block');
  });

  test('selects a participant and emits event', async () => {
    element.participants = MOCK_PARTICIPANT_LIST;
    await element.updateComplete;

    const mentionItem = element.shadowRoot.querySelector('.mention-item');
    mentionItem.click();

    element['selectParticipant'](MOCK_PARTICIPANT_LIST[0]);
    expect(element.shadowRoot.getElementById('mention-list').style.display).toEqual('none');
  });

  test('renders without participants', async () => {
    await element.updateComplete;
    expect(element.shadowRoot.getElementById('mention-list').style.display).toEqual('none');
  });

  test('renders with participants', async () => {
    element.participants = MOCK_PARTICIPANT_LIST;
    await element.updateComplete;

    expect(element.shadowRoot.getElementById('mention-list').style.display).toEqual('block');
  });

  test('selects a participant and emits event', async () => {
    element.participants = MOCK_PARTICIPANT_LIST;
    await element.updateComplete;

    const mentionItem = element.shadowRoot.querySelector('.mention-item');
    mentionItem.click();

    element['selectParticipant'](MOCK_PARTICIPANT_LIST[0]);
    expect(element.shadowRoot.getElementById('mention-list').style.display).toEqual('none');
  });

  test('should display avatar', async () => {
    element.participants = MOCK_PARTICIPANT_LIST;
    await element.updateComplete;

    const avatar = element.shadowRoot.querySelector('.avatar');
    expect(avatar).toBeTruthy();
  });

  test('should display default avatar', async () => {
    element.participants = [
      {
        ...MOCK_PARTICIPANT_LIST[0],
        avatar: null,
      },
    ];
    await element.updateComplete;

    const defaultAvatar = element.shadowRoot.querySelector('.default-avatar');
    expect(defaultAvatar).toBeTruthy();
  });

  test('should add event listener on wheel', async () => {
    await element.updateComplete;
    element.showMentionList();

    const mentionListElement = element.shadowRoot?.getElementById('mention-list');
    expect(mentionListElement).toBeTruthy();

    expect(mentionListElement?.style.display).toEqual('block');

    const mockHandleZoom = jest.fn();
    element.stopHandleZoom = mockHandleZoom;

    const wheelEvent = new Event('wheel');
    mentionListElement.addEventListener('wheel', element.stopHandleZoom);

    mentionListElement.dispatchEvent(wheelEvent);

    await sleep();

    expect(element.stopHandleZoom).toHaveBeenCalled();
  });

  test('should remove event listener', async () => {
    await element.updateComplete;
    element.showMentionList();

    const mentionListElement = element.shadowRoot?.getElementById('mention-list');
    expect(mentionListElement).toBeTruthy();
    expect(mentionListElement?.style.display).toEqual('block');

    element.hideMentionList();
    expect(mentionListElement?.style.display).toEqual('none');

    const mockHandleZoom = jest.fn();
    element.stopHandleZoom = mockHandleZoom;

    const wheelEvent = new Event('wheel');

    mentionListElement.dispatchEvent(wheelEvent);

    expect(element.stopHandleZoom).not.toHaveBeenCalled();
  });

  test('should set display mention list property to none', () => {
    element.hideMentionList();

    const mentionListElement = element.shadowRoot?.getElementById('mention-list');

    expect(mentionListElement?.style.getPropertyValue('display')).toBe('none');
  });

  test('should display avatar', async () => {
    element.participants = MOCK_PARTICIPANT_LIST;
    await element.updateComplete;

    const avatar = element.shadowRoot.querySelector('.avatar');
    expect(avatar).toBeTruthy();
  });

  test('should display default avatar', async () => {
    element.participants = [
      {
        ...MOCK_PARTICIPANT_LIST[0],
        avatar: null,
      },
    ];
    await element.updateComplete;

    const defaultAvatar = element.shadowRoot.querySelector('.default-avatar');
    expect(defaultAvatar).toBeTruthy();
  });
});
