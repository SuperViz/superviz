import '.';

import { MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import { RealtimeEvent } from '../../common/types/events.types';
import { MEETING_COLORS } from '../../common/types/meeting-colors.types';
import { StoreType } from '../../common/types/stores.types';
import sleep from '../../common/utils/sleep';
import { useStore } from '../../common/utils/use-store';
import { WhoIsOnlineParticipant, WIODropdownOptions } from '../../components/who-is-online/types';
import { useGlobalStore } from '../../services/stores';
import { Following } from '../../services/stores/who-is-online/types';

let element: HTMLElement;

const MOCK_PARTICIPANTS: WhoIsOnlineParticipant[] = [
  {
    name: 'John Zero',
    avatar: {
      imageUrl: 'https://example.com',
      color: MEETING_COLORS.turquoise,
      firstLetter: 'J',
      letterColor: '#fff',
    },
    id: '1',
    activeComponents: ['whoisonline', 'presence'],
    isLocalParticipant: true,
    tooltip: {
      name: 'John Zero (you)',
    },
    controls: [
      {
        label: WIODropdownOptions.GATHER,
      },
      {
        label: WIODropdownOptions.FOLLOW,
      },
      {
        label: WIODropdownOptions.PRIVATE,
      },
    ],
    isPrivate: false,
  },
  {
    name: 'John Uno',
    avatar: {
      imageUrl: '',
      color: MEETING_COLORS.orange,
      firstLetter: 'J',
      letterColor: '#fff',
    },
    id: '2',
    activeComponents: ['whoisonline'],
    isLocalParticipant: false,
    tooltip: {
      name: 'John Uno',
    },
    controls: [
      {
        label: WIODropdownOptions.GOTO,
      },
      {
        label: WIODropdownOptions.LOCAL_FOLLOW,
      },
    ],
    isPrivate: false,
  },
  {
    name: 'John Doe',
    avatar: {
      imageUrl: '',
      color: MEETING_COLORS.brown,
      firstLetter: 'J',
      letterColor: '#26242A',
    },
    id: '3',
    activeComponents: ['whoisonline', 'presence'],
    isLocalParticipant: true,
    tooltip: {
      name: 'John Doe',
    },
    controls: [
      {
        label: WIODropdownOptions.GOTO,
      },
      {
        label: WIODropdownOptions.LOCAL_FOLLOW,
      },
    ],
    isPrivate: false,
  },
];

describe('Who Is Online', () => {
  beforeEach(async () => {
    const { localParticipant } = useGlobalStore();
    localParticipant.value = MOCK_LOCAL_PARTICIPANT;
    const { participants } = useStore(StoreType.WHO_IS_ONLINE);
    participants.publish([]);

    element = document.createElement('superviz-who-is-online');
    element['localParticipantData'] = {
      color: '#fff',
      slotIndex: 2,
    };

    document.body.appendChild(element);
    await sleep();
  });

  afterEach(() => {
    element.remove();
  });

  test('should render a participants with class "who-is-online__participant-list"', async () => {
    const { participants } = useStore(StoreType.WHO_IS_ONLINE);
    participants.publish(MOCK_PARTICIPANTS);
    const participantsDivs = element?.shadowRoot?.querySelector('.who-is-online__participant-list');
    expect(participantsDivs).not.toBeFalsy();
  });

  test('should have default positioning style', () => {
    const participants = element?.shadowRoot?.querySelector('.who-is-online') as HTMLElement;
    expect(participants.getAttribute('style')).toBe(
      'top: 20px; right: 40px; align-items: flex-end;',
    );
  });

  test('should update position style', async () => {
    const participants = element?.shadowRoot?.querySelector('.who-is-online') as HTMLElement;
    element['position'] = 'top: 20px; left: 40px;';

    await sleep();

    expect(participants.getAttribute('style')).toBe(
      'top: 20px; left: 40px; align-items: flex-start;',
    );
  });

  test('should not update position style if does not find participants', async () => {
    const participants = element?.shadowRoot?.querySelector('.who-is-online') as HTMLElement;
    participants.classList.remove('who-is-online');

    element['position'] = 'top: 20px; left: 40px;';

    await sleep();
    expect(participants.classList.contains('superviz-who-is-online')).toBeFalsy();
    expect(participants.getAttribute('style')).toBe(
      'top: 20px; right: 40px; align-items: flex-end;',
    );
  });

  test('should update participants list', async () => {
    const { participants } = useStore(StoreType.WHO_IS_ONLINE);
    let participantsDivs = element?.shadowRoot?.querySelectorAll('.who-is-online__participant');
    expect(participantsDivs?.length).toBe(0);

    participants.publish(MOCK_PARTICIPANTS);

    await sleep();

    participantsDivs = element.shadowRoot?.querySelectorAll('.who-is-online__participant');
    expect(participantsDivs?.length).toBe(3);

    participants.publish(MOCK_PARTICIPANTS.slice(0, 2));
    await sleep();

    participantsDivs = element.shadowRoot?.querySelectorAll('.who-is-online__participant');

    expect(participantsDivs?.length).toBe(2);
  });

  test('should render excess participants dropdown icon', async () => {
    const { participants, extras } = useStore(StoreType.WHO_IS_ONLINE);
    participants.publish(MOCK_PARTICIPANTS);

    await sleep();

    let extraParticipants = element?.shadowRoot?.querySelector('.superviz-who-is-online__excess');

    expect(extraParticipants).toBe(null);

    extras.publish(MOCK_PARTICIPANTS);
    await sleep();

    extraParticipants = element?.shadowRoot?.querySelector('.superviz-who-is-online__excess');

    expect(extraParticipants).toBeTruthy();
  });

  test('should toggle open property', () => {
    expect(element['open']).toBeFalsy();

    element['toggleOpen']();
    expect(element['open']).toBeTruthy();

    element['toggleOpen']();
    expect(element['open']).toBeFalsy();
  });

  test('should update open property when clicking outside', async () => {
    const { participants } = useStore(StoreType.WHO_IS_ONLINE);

    const event = new CustomEvent('clickout', {
      detail: {
        open: false,
      },
    });

    participants.publish([...MOCK_PARTICIPANTS, ...MOCK_PARTICIPANTS]);
    await sleep();
    const dropdown = element.shadowRoot?.querySelector(
      'superviz-who-is-online-dropdown',
    ) as HTMLElement;

    dropdown.dispatchEvent(event);
    expect(element['open']).toBeFalsy();
  });

  test('should correctly display either name letter or image', () => {
    const letter = element['getAvatar'](MOCK_PARTICIPANTS[1].avatar);
    expect(letter.strings[0]).not.toContain('img');

    const participant = {
      ...MOCK_PARTICIPANTS[0],
    };

    const avatar = element['getAvatar'](participant.avatar);
    expect(avatar.strings[0]).toContain('img');
  });

  test('should start and stop following', async () => {
    const { following, participants } = useStore(StoreType.WHO_IS_ONLINE);
    participants.publish(MOCK_PARTICIPANTS);
    await sleep();

    const event1 = new CustomEvent(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, {
      detail: {
        participantId: '1',
        label: WIODropdownOptions.LOCAL_FOLLOW,
        source: 'participants',
      },
    });

    element['dropdownOptionsHandler'](event1);
    await sleep();

    expect(following.value).toBeTruthy();

    const event2 = new CustomEvent(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, {
      detail: {
        label: WIODropdownOptions.LOCAL_UNFOLLOW,
      },
    });

    element['dropdownOptionsHandler'](event2);
    await sleep();

    expect(following.value).toBeFalsy();
  });

  describe('dropdownOptionsHandler', () => {
    let dropdown: HTMLElement;
    const { participants, extras } = useStore(StoreType.WHO_IS_ONLINE);

    beforeEach(async () => {
      participants.publish(MOCK_PARTICIPANTS);
      extras.publish(MOCK_PARTICIPANTS);
      await sleep();

      dropdown = element.shadowRoot?.querySelector(
        'superviz-who-is-online-dropdown',
      ) as HTMLElement;
    });

    test('should emit event when selecting go to option in dropdown', async () => {
      const event = new CustomEvent('selected', {
        detail: { id: 1, label: WIODropdownOptions.GOTO },
      });

      const spy = jest.fn();
      element.addEventListener(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, spy);

      dropdown.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith(event);
    });

    test('should emit event when selecting follow option in dropdown', async () => {
      const { following } = useStore(StoreType.WHO_IS_ONLINE);

      const event = new CustomEvent('selected', {
        detail: {
          participantId: '1',
          label: WIODropdownOptions.LOCAL_FOLLOW,
          source: 'participants',
        },
      });

      const spy = jest.fn();
      element.addEventListener(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, spy);

      expect(following.value).toBeUndefined();

      dropdown.dispatchEvent(event);
      await sleep();

      expect(spy).toHaveBeenCalledWith(event);
      expect(following.value).toBeDefined();
    });

    test('should emit event when selecting unfollow option in dropdown', async () => {
      const event = new CustomEvent('selected', {
        detail: { id: 1, label: WIODropdownOptions.LOCAL_UNFOLLOW },
      });

      const spy = jest.fn();
      element.addEventListener(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, spy);

      element['following'] = { id: 1, slotIndex: 1 };

      dropdown.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith(event);
      expect(element['following']).toBeUndefined();
    });

    test('should emit event when selecting follow me option in dropdown', async () => {
      const event = new CustomEvent('selected', {
        detail: { participantId: '1', label: WIODropdownOptions.FOLLOW, source: 'participants' },
      });

      const spy = jest.fn();
      element.addEventListener(RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT, spy);

      const { following } = useStore(StoreType.WHO_IS_ONLINE);
      following.publish({ color: 'red', id: '1', name: 'John' });
      element['following'] = { participantId: 1, slotIndex: 1 };
      await sleep();

      dropdown.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith(event);
      expect(element['everyoneFollowsMe']).toBe(true);
      expect(element['following']).toBeUndefined();
    });

    test('should emit event when selecting stop follow option in dropdown', async () => {
      const event = new CustomEvent('selected', {
        detail: { id: 1, label: WIODropdownOptions.UNFOLLOW, slotIndex: 1 },
      });

      const spy = jest.fn();
      element.addEventListener(RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT, spy);
      element['everyoneFollowsMe'] = true;

      dropdown.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith(event);
      expect(element['everyoneFollowsMe']).toBe(false);
    });

    test('should emit event when selecting private mode option in dropdown', async () => {
      const event = new CustomEvent('selected', {
        detail: { label: WIODropdownOptions.PRIVATE },
      });

      const spy = jest.fn();
      element.addEventListener(RealtimeEvent.REALTIME_PRIVATE_MODE, spy);

      dropdown.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith(event);
      expect(element['isPrivate']).toBe(true);
    });

    test('should emit event when selecting leave private mode option in dropdown', async () => {
      const event = new CustomEvent('selected', {
        detail: { label: WIODropdownOptions.LEAVE_PRIVATE },
      });

      const spy = jest.fn();
      element.addEventListener(RealtimeEvent.REALTIME_PRIVATE_MODE, spy);

      element['isPrivate'] = true;

      dropdown.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith(event);
      expect(element['isPrivate']).toBe(false);
    });

    test('should emit event when selecting gather option in dropdown', async () => {
      const event = new CustomEvent('selected', {
        detail: { label: WIODropdownOptions.GATHER },
      });

      const spy = jest.fn();
      element.addEventListener(RealtimeEvent.REALTIME_GATHER, spy);

      dropdown.dispatchEvent(event);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelPrivate', () => {
    test('should set isPrivate to undefined and emit event', () => {
      element['isPrivate'] = true;
      const event = new CustomEvent(RealtimeEvent.REALTIME_PRIVATE_MODE, {
        detail: { id: element['localParticipantData'].id },
      });

      element['cancelPrivate'] = jest.fn().mockImplementation(element['cancelPrivate']);

      const spy = jest.fn();
      element.addEventListener(RealtimeEvent.REALTIME_PRIVATE_MODE, spy);

      element['cancelPrivate']();

      expect(element['isPrivate']).toBeUndefined();
      expect(spy).toHaveBeenCalledWith(event);
    });
  });

  describe('toggleShowTooltip', () => {
    test('should toggle showTooltip when called', () => {
      element['showTooltip'] = true;

      element['toggleShowTooltip']();
      expect(element['showTooltip']).toBe(false);

      element['toggleShowTooltip']();
      expect(element['showTooltip']).toBe(true);
    });
  });
});
