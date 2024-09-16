import { MOCK_CONFIG } from '../../../__mocks__/config.mock';
import { EVENT_BUS_MOCK } from '../../../__mocks__/event-bus.mock';
import {
  MOCK_ABLY_PARTICIPANT_DATA_2,
  MOCK_LOCAL_PARTICIPANT,
  MOCK_ABLY_PARTICIPANT_DATA_1,
} from '../../../__mocks__/participants.mock';
import { RealtimeEvent, WhoIsOnlineEvent } from '../../common/types/events.types';
import { StoreType } from '../../common/types/stores.types';
import { useStore } from '../../common/utils/use-store';
import { IOC } from '../../services/io';
import { Presence3DManager } from '../../services/presence-3d-manager';
import { Following } from '../../services/stores/who-is-online/types';
import { ComponentNames } from '../types';

import { Avatar, WhoIsOnlineParticipant, TooltipData } from './types';

import { WhoIsOnline } from './index';
import { MEETING_COLORS } from '../../common/types/meeting-colors.types';
import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';

const generateMockParticipant = ({
  id,
  name,
  disableDropdown,
  isPrivate,
}: {
  id: string;
  name: string;
  disableDropdown: boolean;
  isPrivate?: boolean;
}) => {
  const mockParticipant = {
    id,
    data: {
      id,
      name,
      disableDropdown,
      isPrivate,
      avatar: {},
    },
  };

  return mockParticipant;
};

describe('Who Is Online', () => {
  let whoIsOnlineComponent: WhoIsOnline;

  beforeEach(async () => {
    jest.clearAllMocks();

    whoIsOnlineComponent = new WhoIsOnline();

    const { hasJoinedRoom } = whoIsOnlineComponent['useStore'](StoreType.GLOBAL);
    hasJoinedRoom.publish(true);

    useStore(StoreType.GLOBAL).localParticipant.publish(MOCK_LOCAL_PARTICIPANT);

    whoIsOnlineComponent.attach({
      ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
      config: MOCK_CONFIG,
      eventBus: EVENT_BUS_MOCK,
      Presence3DManagerService: Presence3DManager,
      connectionLimit: LIMITS_MOCK.presence.maxParticipants,
      useStore,
    });

    whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE).participants.publish([]);

    whoIsOnlineComponent['localParticipantId'] = MOCK_LOCAL_PARTICIPANT.id;

    whoIsOnlineComponent['color'] = MEETING_COLORS.gray;
  });

  afterEach(() => {
    whoIsOnlineComponent.detach();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  describe('start', () => {
    test('should create a new instance of Who Is Online', () => {
      expect(whoIsOnlineComponent).toBeInstanceOf(WhoIsOnline);
    });

    test('should position component inside div if id is provided', async () => {
      whoIsOnlineComponent['element'].remove();
      whoIsOnlineComponent['breakLayout'] = true;

      const div = document.createElement('div');

      div.id = 'unit-test-div';
      document.body.appendChild(div);
      whoIsOnlineComponent['position'] = 'unit-test-div';
      whoIsOnlineComponent['positionWhoIsOnline']();

      expect(div.parentElement).toBe(document.body);
      expect(whoIsOnlineComponent['element'].parentElement).toBe(div);
      expect(whoIsOnlineComponent['element'].position).toBe('position: relative;');
    });

    test('should position at top-right if no id is provided', async () => {
      expect(whoIsOnlineComponent['element'].parentElement).toBe(document.body);
      expect(whoIsOnlineComponent['element'].position).toBe('top: 20px; right: 40px;');
    });

    test('should position at top-right if invalid id is provided', async () => {
      whoIsOnlineComponent['element'].remove();
      const randomIdNumber = Math.ceil(Math.random() * 100);
      whoIsOnlineComponent['position'] = `random-id${randomIdNumber}`;
      whoIsOnlineComponent['positionWhoIsOnline']();

      expect(whoIsOnlineComponent['element'].parentElement).toBe(document.body);
      expect(whoIsOnlineComponent['element'].position).toBe('top: 20px; right: 40px;');
    });

    test('should allow an object with options in the constructor', () => {
      const whoIsOnlineComponent = new WhoIsOnline({
        position: 'bottom-left',
        styles: '.unit-test-class { color: red; }',
      });

      expect(whoIsOnlineComponent['position']).toBe('bottom-left');
    });

    test('should set default position when passing an object without position', () => {
      const whoIsOnlineComponent = new WhoIsOnline({
        styles: '.unit-test-class { color: red; }',
      });

      expect(whoIsOnlineComponent['position']).toBe('top-right');
    });
  });

  describe('subscribeToRealtimeEvents', () => {
    test('should subscribe to realtime events', () => {
      expect(whoIsOnlineComponent['room'].presence.on).toHaveBeenCalledTimes(4);
      expect(whoIsOnlineComponent['room'].on).toHaveBeenCalledTimes(2);
    });
  });

  describe('unsubscribeFromRealtimeEvents', () => {
    test('should unsubscribe from realtime events', () => {
      whoIsOnlineComponent['unsubscribeFromRealtimeEvents']();

      expect(whoIsOnlineComponent['room'].presence.off).toHaveBeenCalledTimes(3);
      expect(whoIsOnlineComponent['room'].off).toHaveBeenCalledTimes(2);
    });
  });

  describe('onParticipantListUpdate', () => {
    let participants;

    beforeEach(() => {
      participants = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE)['participants'];
      whoIsOnlineComponent['initialized'] = true;
    });

    test('should correctly update participant list', () => {
      let mockParticipant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name',
        disableDropdown: false,
      }) as any;

      whoIsOnlineComponent['onParticipantListUpdate'](mockParticipant);

      expect(participants.value.length).toBe(1);

      mockParticipant = generateMockParticipant({
        id: 'unit-test-id-2',
        name: 'unit-test-name-2',
        disableDropdown: false,
      });
      whoIsOnlineComponent['onParticipantListUpdate'](mockParticipant);

      expect(participants.value.length).toBe(2);
    });

    test('should update participant if participant already in list', () => {
      let mockParticipant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name',
        disableDropdown: false,
      }) as any;

      whoIsOnlineComponent['onParticipantListUpdate'](mockParticipant);

      expect(participants.value[0].name).toBe('unit-test-name');

      mockParticipant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name-2',
        disableDropdown: false,
      }) as any;

      whoIsOnlineComponent['onParticipantListUpdate'](mockParticipant);

      expect(participants.value[0].name).toBe('unit-test-name-2');
    });

    test('should not display private participants', () => {
      let mockParticipant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name',
        disableDropdown: false,
        isPrivate: false,
      }) as any;

      whoIsOnlineComponent['onParticipantListUpdate'](mockParticipant);

      expect(participants.value.length).toBe(1);

      mockParticipant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name',
        disableDropdown: false,
        isPrivate: true,
      }) as any;

      whoIsOnlineComponent['onParticipantListUpdate'](mockParticipant);

      expect(participants.value.length).toBe(0);
    });

    test('should display private local participant', () => {
      let mockParticipant = generateMockParticipant({
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: 'unit-test-name',
        disableDropdown: false,
        isPrivate: false,
      }) as any;

      whoIsOnlineComponent['onParticipantListUpdate'](mockParticipant);

      expect(participants.value.length).toBe(1);

      mockParticipant = generateMockParticipant({
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: 'unit-test-name',
        disableDropdown: false,
        isPrivate: true,
      }) as any;

      whoIsOnlineComponent['onParticipantListUpdate'](mockParticipant);

      expect(participants.value.length).toBe(1);
    });

    test('should do nothing if local id is not set', () => {
      whoIsOnlineComponent['localParticipantId'] = '';

      const mockParticipant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name',
        disableDropdown: false,
      }) as any;

      whoIsOnlineComponent['onParticipantListUpdate'](mockParticipant);

      expect(participants.value.length).toBe(0);
    });

    test('should update participant that is in extras list', () => {
      const mockParticipant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name',
        disableDropdown: false,
      }) as any;

      const { extras } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      extras.publish([mockParticipant]);

      whoIsOnlineComponent['onParticipantListUpdate'](mockParticipant);

      expect(extras.value.length).toBe(1);

      const updatedParticipant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name-2',
        disableDropdown: false,
      }) as any;

      whoIsOnlineComponent['onParticipantListUpdate'](updatedParticipant);

      expect(extras.value.length).toBe(1);
      expect(extras.value[0].name).toBe('unit-test-name-2');
    });
  });

  describe('events', () => {
    beforeEach(() => {
      const participants = [
        generateMockParticipant({
          id: 'unit-test-id',
          name: 'unit-test-name',
          disableDropdown: false,
        }),
        generateMockParticipant({
          id: 'unit-test-id-2',
          name: 'unit-test-name-2',
          disableDropdown: false,
        }),
      ];

      participants.forEach((participant) => {
        whoIsOnlineComponent['onParticipantListUpdate'](participant as any);
      });
      whoIsOnlineComponent['element'].addEventListener = jest.fn();
    });

    test('should publish private to event bus and realtime', () => {
      const event = new CustomEvent(RealtimeEvent.REALTIME_PRIVATE_MODE, {
        detail: { isPrivate: false, id: 'unit-test-id-2' },
      });

      whoIsOnlineComponent['setPrivate'](event);
      const { participants } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);

      expect(whoIsOnlineComponent['eventBus'].publish).toHaveBeenCalledWith(
        RealtimeEvent.REALTIME_PRIVATE_MODE,
        false,
      );

      expect(whoIsOnlineComponent['room'].presence.update).toHaveBeenCalledWith({
        ...participants.value[0],
        isPrivate: false,
      });
    });

    test('should publish local follow to event bus', () => {
      const event = new CustomEvent(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, {
        detail: { id: MOCK_ABLY_PARTICIPANT_DATA_2.id },
      });

      whoIsOnlineComponent['followMousePointer'](event);

      expect(whoIsOnlineComponent['eventBus'].publish).toHaveBeenCalledWith(
        RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT,
        MOCK_ABLY_PARTICIPANT_DATA_2.id,
      );
    });

    test('should publish go-to to event bus', () => {
      const event = new CustomEvent(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, {
        detail: { id: MOCK_ABLY_PARTICIPANT_DATA_2.id },
      });

      whoIsOnlineComponent['goToMousePointer'](event);

      expect(whoIsOnlineComponent['eventBus'].publish).toHaveBeenCalledWith(
        RealtimeEvent.REALTIME_GO_TO_PARTICIPANT,
        MOCK_ABLY_PARTICIPANT_DATA_2.id,
      );
    });
  });

  describe('setFollow', () => {
    beforeEach(() => {
      whoIsOnlineComponent['followMousePointer'] = jest
        .fn()
        .mockImplementation(whoIsOnlineComponent['followMousePointer']);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should publish following data', () => {
      whoIsOnlineComponent['setFollow']({
        presence: { id: MOCK_ABLY_PARTICIPANT_DATA_1.id },
        data: {
          ...MOCK_ABLY_PARTICIPANT_DATA_1,
        },
      });

      const { following } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);

      expect(following.value).toMatchObject(MOCK_ABLY_PARTICIPANT_DATA_1);
    });

    test('should early return if following the local participant', () => {
      const followingData: Following = {
        color: MOCK_ABLY_PARTICIPANT_DATA_2.color,
        id: MOCK_ABLY_PARTICIPANT_DATA_2.id,
        name: MOCK_ABLY_PARTICIPANT_DATA_2.name,
      };
      const { following } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      following.publish(followingData);

      whoIsOnlineComponent['setFollow']({
        presence: { id: MOCK_LOCAL_PARTICIPANT.id },
        ...MOCK_LOCAL_PARTICIPANT,
      });

      expect(whoIsOnlineComponent['followMousePointer']).not.toHaveBeenCalled();
      expect(following.value).toBe(followingData);
    });

    test('should set following to undefined if no id is passed', () => {
      const followingData: Following = {
        color: MOCK_ABLY_PARTICIPANT_DATA_2.color,
        id: MOCK_ABLY_PARTICIPANT_DATA_2.id,
        name: MOCK_ABLY_PARTICIPANT_DATA_2.name,
      };

      const { following } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      following.publish(followingData);

      whoIsOnlineComponent['setFollow']({
        ...MOCK_LOCAL_PARTICIPANT,
        presence: {
          id: 'id',
        },
        clientId: 'ably-id',
        data: '',
      });

      const event = {
        detail: {
          id: '',
        },
      };

      expect(whoIsOnlineComponent['followMousePointer']).toHaveBeenCalledWith(event);
      expect(following.value).toBe('');
    });
  });

  describe('follow', () => {
    test('should publish detail to realtime', () => {
      const event = new CustomEvent(RealtimeEvent.REALTIME_GATHER, {
        detail: {
          ...MOCK_ABLY_PARTICIPANT_DATA_1,
        },
      });

      whoIsOnlineComponent['follow'](event);

      expect(whoIsOnlineComponent['room'].emit).toHaveBeenCalledWith(
        WhoIsOnlineEvent.START_FOLLOW_ME,
        event.detail,
      );
    });
  });

  describe('stopFollowing', () => {
    test('should do nothing if participant leaving is not being followed', () => {
      const { following } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      following.publish({
        color: MOCK_ABLY_PARTICIPANT_DATA_2.color,
        id: MOCK_ABLY_PARTICIPANT_DATA_2.id,
        name: MOCK_ABLY_PARTICIPANT_DATA_2.name,
      });

      whoIsOnlineComponent['stopFollowing'](MOCK_LOCAL_PARTICIPANT);

      expect(following.value).toBeDefined();
      expect(following.value!.id).toBe(MOCK_ABLY_PARTICIPANT_DATA_2.id);
    });

    test('should set following to undefined if following the participant who is leaving', () => {
      const { following } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      following.publish({
        color: MOCK_ABLY_PARTICIPANT_DATA_1.color,
        id: MOCK_ABLY_PARTICIPANT_DATA_1.id,
        name: MOCK_ABLY_PARTICIPANT_DATA_1.name,
      });

      whoIsOnlineComponent['stopFollowing']({
        id: MOCK_ABLY_PARTICIPANT_DATA_1.id,
      });

      expect(following.value).toBe(undefined);
      expect(whoIsOnlineComponent['following']).toBe(undefined);
    });
  });

  describe('gather', () => {
    test('should publish gather informations to realtime', () => {
      const event = new CustomEvent(RealtimeEvent.REALTIME_GATHER, {
        detail: {
          ...MOCK_ABLY_PARTICIPANT_DATA_1,
        },
      });

      whoIsOnlineComponent['gather'](event);

      expect(whoIsOnlineComponent['room'].emit).toHaveBeenCalledWith(
        WhoIsOnlineEvent.GATHER_ALL,
        MOCK_ABLY_PARTICIPANT_DATA_1.id,
      );
    });
  });

  describe('events', () => {
    beforeEach(() => {
      whoIsOnlineComponent['publish'] = jest.fn();
    });

    test('should publish "go to" event when goToMousePointer is called', () => {
      whoIsOnlineComponent['goToMousePointer']({
        detail: { id: 'unit-test-id' },
      } as CustomEvent);

      expect(whoIsOnlineComponent['publish']).toHaveBeenCalledWith(
        WhoIsOnlineEvent.GO_TO_PARTICIPANT,
        'unit-test-id',
      );
    });

    test('should not publish "go to" event if id is equal to local participant id', () => {
      whoIsOnlineComponent['goToMousePointer']({
        detail: { id: MOCK_LOCAL_PARTICIPANT.id },
      } as CustomEvent);

      expect(whoIsOnlineComponent['publish']).not.toHaveBeenCalled();
    });

    test('should publish "follow" event when followMousePointer is called', () => {
      const followingData: Following = {
        color: MOCK_ABLY_PARTICIPANT_DATA_2.color,
        id: MOCK_ABLY_PARTICIPANT_DATA_2.id,
        name: MOCK_ABLY_PARTICIPANT_DATA_2.name,
      };
      const { following } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      following.publish(followingData);

      whoIsOnlineComponent['followMousePointer']({
        detail: { id: 'unit-test-id' },
      } as CustomEvent);

      expect(whoIsOnlineComponent['publish']).toHaveBeenCalledWith(
        WhoIsOnlineEvent.START_FOLLOWING_PARTICIPANT,
        followingData,
      );
    });

    test('should publish "stop following" if follow is called with undefined id', () => {
      const followingData: Following = {
        color: MOCK_ABLY_PARTICIPANT_DATA_2.color,
        id: MOCK_ABLY_PARTICIPANT_DATA_2.id,
        name: MOCK_ABLY_PARTICIPANT_DATA_2.name,
      };
      const { following } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      following.publish(undefined);

      whoIsOnlineComponent['followMousePointer']({
        detail: { id: undefined },
      } as CustomEvent);

      expect(whoIsOnlineComponent['publish']).toHaveBeenCalledWith(
        WhoIsOnlineEvent.STOP_FOLLOWING_PARTICIPANT,
      );
    });

    test('should publish "stop following" event when stopFollowing is called', () => {
      const { following } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      following.publish({
        color: MOCK_ABLY_PARTICIPANT_DATA_2.color,
        id: MOCK_ABLY_PARTICIPANT_DATA_2.id,
        name: MOCK_ABLY_PARTICIPANT_DATA_2.name,
      });

      whoIsOnlineComponent['stopFollowing']({
        id: MOCK_ABLY_PARTICIPANT_DATA_2.id,
      });

      expect(whoIsOnlineComponent['publish']).toHaveBeenCalledWith(
        WhoIsOnlineEvent.STOP_FOLLOWING_PARTICIPANT,
      );
    });

    test('should publish "enter private mode" event when setPrivate is called with isPrivate as true', () => {
      whoIsOnlineComponent['setPrivate']({
        detail: { isPrivate: true, id: 'unit-test-id' },
      } as CustomEvent);

      expect(whoIsOnlineComponent['publish']).toHaveBeenCalledWith(
        WhoIsOnlineEvent.ENTER_PRIVATE_MODE,
      );
    });

    test('should publish "leave private mode" event when setPrivate is called with isPrivate as false', () => {
      whoIsOnlineComponent['setPrivate']({
        detail: { isPrivate: false, id: 'unit-test-id' },
      } as CustomEvent);

      expect(whoIsOnlineComponent['publish']).toHaveBeenCalledWith(
        WhoIsOnlineEvent.LEAVE_PRIVATE_MODE,
      );
    });

    test('should publish "follow me" event when follow is called with defined id', () => {
      const { following } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      const followingData: Following = {
        color: MOCK_ABLY_PARTICIPANT_DATA_2.color,
        id: MOCK_ABLY_PARTICIPANT_DATA_2.id,
        name: MOCK_ABLY_PARTICIPANT_DATA_2.name,
      };

      following.publish(followingData);

      whoIsOnlineComponent['follow']({
        detail: { id: 'unit-test-id' },
      } as CustomEvent);

      expect(whoIsOnlineComponent['publish']).toHaveBeenCalledWith(
        WhoIsOnlineEvent.START_FOLLOW_ME,
        followingData,
      );
    });

    test('should publish "stop follow me" event when follow is called with undefined id', () => {
      const { following } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      following.publish(undefined);

      whoIsOnlineComponent['follow']({
        detail: { id: undefined },
      } as CustomEvent);

      expect(whoIsOnlineComponent['publish']).toHaveBeenCalledWith(WhoIsOnlineEvent.STOP_FOLLOW_ME);
    });
  });

  describe('setStyles', () => {
    test('should append style element with user styles to head', () => {
      const styles = `
        .unit-test-class {
          color: red;
        }`;

      whoIsOnlineComponent['setStyles'](styles);
      const styleElement = document.getElementById('superviz-who-is-online-styles');
      expect(styleElement).toBeTruthy();
    });

    test('should do nothing if no styles are passed', () => {
      whoIsOnlineComponent['setStyles']();
      const styleElement = document.getElementById('superviz-who-is-online-styles');
      expect(styleElement).toBeFalsy();
    });
  });

  describe('followMousePointer', () => {
    test('should highlight participant being followed if they are an extra', () => {
      whoIsOnlineComponent['highlightParticipantBeingFollowed'] = jest.fn();

      whoIsOnlineComponent['followMousePointer']({
        detail: { id: 'test-id', source: 'extras' },
      } as any);

      expect(whoIsOnlineComponent['highlightParticipantBeingFollowed']).toHaveBeenCalled();
    });
  });

  describe('shouldDisableDropdown', () => {
    test('should disable dropdown when joinedPresence is false', () => {
      whoIsOnlineComponent['useStore'] = jest.fn().mockReturnValue({
        joinedPresence: { value: false },
        disablePresenceControls: { value: false },
        disableFollowMe: { value: false },
        disableFollowParticipant: { value: false },
        disableGoToParticipant: { value: false },
        disableGatherAll: { value: false },
        disablePrivateMode: { value: false },
        destroy: jest.fn(),
      });

      expect(
        whoIsOnlineComponent['shouldDisableDropdown']({
          activeComponents: ['PresenceButton'],
          participantId: 'someId',
        }),
      ).toEqual(true);
    });

    test('should disable dropdown when disablePresenceControls is true', () => {
      whoIsOnlineComponent['useStore'] = jest.fn().mockReturnValue({
        joinedPresence: { value: true },
        disablePresenceControls: { value: true },
        disableFollowMe: { value: false },
        disableFollowParticipant: { value: false },
        disableGoToParticipant: { value: false },
        disableGatherAll: { value: false },
        disablePrivateMode: { value: false },
        destroy: jest.fn(),
      });

      expect(
        whoIsOnlineComponent['shouldDisableDropdown']({
          activeComponents: ['PresenceButton'],
          participantId: 'someId',
        }),
      ).toEqual(true);
    });

    test('should disable dropdown for local participant with specific conditions', () => {
      whoIsOnlineComponent['useStore'] = jest.fn().mockReturnValue({
        joinedPresence: { value: true },
        disablePresenceControls: { value: false },
        disableFollowMe: { value: true },
        disablePrivateMode: { value: true },
        disableGatherAll: { value: true },
        disableFollowParticipant: { value: true },
        disableGoToParticipant: { value: true },
        destroy: jest.fn(),
      });

      expect(
        whoIsOnlineComponent['shouldDisableDropdown']({
          activeComponents: ['PresenceButton'],
          participantId: 'localParticipantId',
        }),
      ).toEqual(true);
    });

    test('should not disable dropdown when conditions are not met', () => {
      whoIsOnlineComponent['useStore'] = jest.fn().mockReturnValue({
        joinedPresence: { value: true },
        disablePresenceControls: { value: false },
        disableFollowMe: { value: false },
        disableFollowParticipant: { value: false },
        disableGoToParticipant: { value: false },
        disableGatherAll: { value: false },
        disablePrivateMode: { value: false },
        destroy: jest.fn(),
      });

      expect(
        whoIsOnlineComponent['shouldDisableDropdown']({
          activeComponents: ['presence'],
          participantId: 'someId',
        }),
      ).toEqual(false);
    });

    test('should not disable dropdown when activeComponents do not match', () => {
      whoIsOnlineComponent['useStore'] = jest.fn().mockReturnValue({
        joinedPresence: { value: true },
        disablePresenceControls: { value: false },
        disableFollowMe: { value: false },
        disableFollowParticipant: { value: false },
        disableGoToParticipant: { value: false },
        disableGatherAll: { value: false },
        disablePrivateMode: { value: false },
        destroy: jest.fn(),
      });

      expect(
        whoIsOnlineComponent['shouldDisableDropdown']({
          activeComponents: ['OtherComponent'],
          participantId: 'someId',
        }),
      ).toEqual(true);
    });
  });

  describe('getTooltipData', () => {
    test('should return tooltip data for local participant', () => {
      const tooltipData = whoIsOnlineComponent['getTooltipData']({
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: 'John',
        disableDropdown: false,
      } as any);

      expect(tooltipData).toEqual({
        name: 'John (You)',
      });
    });

    test('should return tooltip data for remote participant with presence enabled', () => {
      const tooltipData = whoIsOnlineComponent['getTooltipData']({
        isLocalParticipant: false,
        name: 'Alice',
        disableDropdown: false,
      } as any);

      expect(tooltipData).toEqual({
        name: 'Alice',
        info: 'Click to follow',
      });
    });

    test('should return tooltip data for remote participant with presence disabled', () => {
      const tooltipData = whoIsOnlineComponent['getTooltipData']({
        isLocalParticipant: false,
        name: 'Bob',
        disableDropdown: true,
      } as any);

      expect(tooltipData).toEqual({
        name: 'Bob',
      });
    });

    test('should return tooltip data for local participant with presence disabled', () => {
      const tooltipData = whoIsOnlineComponent['getTooltipData']({
        isLocalParticipant: true,
        name: 'Jane',
        disableDropdown: true,
        id: MOCK_LOCAL_PARTICIPANT.id,
      } as any);

      expect(tooltipData).toEqual({
        name: 'Jane (You)',
      });
    });
  });

  describe('getAvatar', () => {
    const mockAvatar: Avatar = {
      imageUrl: 'https://example.com/avatar.jpg',
      color: 'white',
      firstLetter: 'L',
      letterColor: 'black',
    };

    test('should return avatar data with image URL', () => {
      const result = whoIsOnlineComponent['getAvatar']({
        avatar: mockAvatar as any,
        name: 'John Doe',
        color: '#007bff',
        letterColor: 'black',
      });

      expect(result).toEqual({
        imageUrl: 'https://example.com/avatar.jpg',
        firstLetter: 'J',
        color: '#007bff',
        letterColor: 'black',
      });
    });

    test('should return avatar data with default first letter', () => {
      const result = whoIsOnlineComponent['getAvatar']({
        avatar: {
          imageUrl: '',
          model3DUrl: '',
        },
        name: 'Alice Smith',
        color: '#dc3545',
        letterColor: 'black',
      });

      expect(result).toEqual({
        imageUrl: '',
        firstLetter: 'A',
        color: '#dc3545',
        letterColor: 'black',
      });
    });

    test('should handle empty name by defaulting to "A"', () => {
      const result = whoIsOnlineComponent['getAvatar']({
        avatar: mockAvatar as any,
        name: 'User name',
        color: '#28a745',
        letterColor: 'black',
      });

      expect(result).toEqual({
        imageUrl: 'https://example.com/avatar.jpg',
        firstLetter: 'U',
        color: '#28a745',
        letterColor: 'black',
      });
    });

    test('should handle undefined name by defaulting to "A"', () => {
      const result = whoIsOnlineComponent['getAvatar']({
        avatar: {
          imageUrl: '',
          model3DUrl: '',
        },
        name: '',
        color: '#ffc107',
        letterColor: 'black',
      });

      expect(result).toEqual({
        imageUrl: '',
        firstLetter: 'A',
        color: '#ffc107',
        letterColor: 'black',
      });
    });
  });

  describe('getControls', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return empty array when presence controls are disabled', () => {
      const { disablePresenceControls } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      disablePresenceControls.publish(true);

      const controls = whoIsOnlineComponent['getControls']({
        id: 'remoteParticipant123',
        disableDropdown: false,
      } as any);

      expect(controls!.length).toBe(0);
    });

    test('should return controls for local participant', () => {
      const { disablePresenceControls } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      disablePresenceControls.publish(false);

      const controls = whoIsOnlineComponent['getControls']({
        id: MOCK_LOCAL_PARTICIPANT.id,
        disableDropdown: false,
      } as any);

      expect(controls).toEqual([
        { label: 'gather all', icon: 'gather' },
        { icon: 'send', label: 'everyone follows me' },
        { icon: 'eye', label: 'private mode' },
      ]);
    });

    test('should return controls for other participants', () => {
      const { disablePresenceControls } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      disablePresenceControls.publish(false);

      const controls = whoIsOnlineComponent['getControls']({
        id: 'remoteParticipant456',
        disableDropdown: false,
      } as any);

      expect(controls).toEqual([
        { icon: 'place', label: 'go to' },
        { label: 'follow', icon: 'send' },
      ]);
    });
  });

  describe('getOtherParticipantsControls', () => {
    test('should return controls without "Go To" option when disableGoToParticipant is true', () => {
      const { disableGoToParticipant, disableFollowParticipant, following } = whoIsOnlineComponent[
        'useStore'
      ](StoreType.WHO_IS_ONLINE);
      disableGoToParticipant.publish(true);
      disableFollowParticipant.publish(false);
      following.publish(undefined);

      const controls = whoIsOnlineComponent['getOtherParticipantsControls']('participant123');

      expect(controls).toEqual([
        {
          label: 'follow',
          icon: 'send',
        },
      ]);
    });

    test('should return controls with "Go To" option when disableGoToParticipant is false', () => {
      const { disableGoToParticipant, disableFollowParticipant, following } = whoIsOnlineComponent[
        'useStore'
      ](StoreType.WHO_IS_ONLINE);
      disableGoToParticipant.publish(false);
      disableFollowParticipant.publish(false);
      following.publish(undefined);

      const controls = whoIsOnlineComponent['getOtherParticipantsControls']('participant123');

      expect(controls).toEqual([
        {
          label: 'go to',
          icon: 'place',
        },
        {
          label: 'follow',
          icon: 'send',
        },
      ]);
    });

    test('should return controls for when following a participant', () => {
      const { disableGoToParticipant, disableFollowParticipant, following } = whoIsOnlineComponent[
        'useStore'
      ](StoreType.WHO_IS_ONLINE);
      disableGoToParticipant.publish(false);
      disableFollowParticipant.publish(false);
      following.publish({ color: 'red', id: 'participant123', name: 'name' });

      const controls = whoIsOnlineComponent['getOtherParticipantsControls']('participant123');

      expect(controls).toEqual([
        {
          label: 'go to',
          icon: 'place',
        },
        {
          label: 'unfollow',
          icon: 'send-off',
        },
      ]);
    });

    test('should return controls when disableFollowParticipant is true', () => {
      const { disableGoToParticipant, disableFollowParticipant, following } = whoIsOnlineComponent[
        'useStore'
      ](StoreType.WHO_IS_ONLINE);
      disableGoToParticipant.publish(false);
      disableFollowParticipant.publish(true);
      following.publish(undefined);

      const controls = whoIsOnlineComponent['getOtherParticipantsControls']('participant123');

      expect(controls).toEqual([
        {
          label: 'go to',
          icon: 'place',
        },
      ]);
    });
  });

  describe('getLocalParticipantControls', () => {
    test('should return controls without "Gather" option when disableGatherAll is true', () => {
      const {
        disableFollowMe,
        disableGatherAll,
        disablePrivateMode,
        everyoneFollowsMe,
        privateMode,
      } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      disableFollowMe.publish(false);
      disableGatherAll.publish(true);
      disablePrivateMode.publish(false);
      everyoneFollowsMe.publish(false);
      privateMode.publish(false);

      const controls = whoIsOnlineComponent['getLocalParticipantControls']();

      expect(controls).toEqual([
        {
          label: 'everyone follows me',
          icon: 'send',
        },
        {
          label: 'private mode',
          icon: 'eye',
        },
      ]);
    });

    test('should return controls with "Unfollow" and "Leave Private" options when everyoneFollowsMe and privateMode are true', () => {
      const {
        disableFollowMe,
        disableGatherAll,
        disablePrivateMode,
        everyoneFollowsMe,
        privateMode,
      } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      disableFollowMe.publish(false);
      disableGatherAll.publish(false);
      disablePrivateMode.publish(false);
      everyoneFollowsMe.publish(true);
      privateMode.publish(true);

      const controls = whoIsOnlineComponent['getLocalParticipantControls']();

      expect(controls).toEqual([
        {
          icon: 'gather',
          label: 'gather all',
        },
        {
          icon: 'send-off',
          label: 'stop followers',
        },
        {
          icon: 'eye_inative',
          label: 'leave private mode',
        },
      ]);
    });

    test('should return controls with "Follow" and "Private" options when all flags are false', () => {
      const {
        disableFollowMe,
        disableGatherAll,
        disablePrivateMode,
        everyoneFollowsMe,
        privateMode,
      } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      disableFollowMe.publish(false);
      disableGatherAll.publish(false);
      disablePrivateMode.publish(false);
      everyoneFollowsMe.publish(false);
      privateMode.publish(false);

      const controls = whoIsOnlineComponent['getLocalParticipantControls']();

      expect(controls).toEqual([
        {
          label: 'gather all',
          icon: 'gather',
        },
        {
          label: 'everyone follows me',
          icon: 'send',
        },
        {
          label: 'private mode',
          icon: 'eye',
        },
      ]);
    });

    test('should return controls without "Follow" option when disableFollowMe is true', () => {
      const {
        disableFollowMe,
        disableGatherAll,
        disablePrivateMode,
        everyoneFollowsMe,
        privateMode,
      } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      disableFollowMe.publish(true);
      disableGatherAll.publish(false);
      disablePrivateMode.publish(false);
      everyoneFollowsMe.publish(false);
      privateMode.publish(false);

      const controls = whoIsOnlineComponent['getLocalParticipantControls']();

      expect(controls).toEqual([
        {
          label: 'gather all',
          icon: 'gather',
        },
        {
          label: 'private mode',
          icon: 'eye',
        },
      ]);
    });
  });

  describe('highlightParticipantBeingFollowed', () => {
    test('should put participant being followed from extras in second position over all', () => {
      const participant1: WhoIsOnlineParticipant = {
        activeComponents: [],
        avatar: {} as Avatar,
        id: 'test id 1',
        isLocalParticipant: false,
        name: 'participant',
        tooltip: {} as TooltipData,
        controls: {} as any,
        disableDropdown: false,
        isPrivate: false,
      };

      const participant2 = { ...participant1, id: 'test id 2' };
      const participant3 = { ...participant1, id: 'test id 3' };
      const participant4 = { ...participant1, id: 'test id 4' };
      const participant5 = { ...participant1, id: 'test id 5' };

      const participantsList: WhoIsOnlineParticipant[] = [
        participant1,
        participant2,
        participant3,
        participant4,
      ];

      const { participants, extras, following } = whoIsOnlineComponent['useStore'](
        StoreType.WHO_IS_ONLINE,
      );

      participants.publish(participantsList);
      extras.publish([participant5]);
      following.publish({
        color: 'red',
        id: 'test id 5',
        name: 'participant 5',
      });

      expect(participants.value[0]).toBe(participant1);
      expect(participants.value[1]).toBe(participant2);
      expect(participants.value[2]).toBe(participant3);
      expect(participants.value[3]).toBe(participant4);
      expect(extras.value[0]).toBe(participant5);

      whoIsOnlineComponent['highlightParticipantBeingFollowed']();

      expect(participants.value[0]).toBe(participant1);
      expect(participants.value[1]).toBe(participant5);
      expect(participants.value[2]).toBe(participant2);
      expect(participants.value[3]).toBe(participant3);
      expect(extras.value[0]).toBe(participant4);
    });
  });

  describe('initializeList', () => {
    let getSpy: jest.SpyInstance;

    beforeEach(() => {
      whoIsOnlineComponent['element'].addEventListener = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should initialize list of participants and extras', () => {
      getSpy = jest.spyOn(whoIsOnlineComponent['room'].presence, 'get');

      const { participants, extras } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      const list = [
        generateMockParticipant({
          id: 'unit-test-id',
          name: 'unit-test-name',
          disableDropdown: false,
        }),
        generateMockParticipant({
          id: 'unit-test-id-2',
          name: 'unit-test-name-2',
          disableDropdown: false,
        }),
      ];

      list.forEach((participant) => {
        whoIsOnlineComponent['onParticipantListUpdate'](participant as any);
      });

      whoIsOnlineComponent['room'].presence.get = jest.fn().mockImplementation((callback) => {
        callback(list);
      });

      whoIsOnlineComponent['initializeList']();

      expect(participants.value.length).toEqual(2);
      expect(extras.value.length).toEqual(0);
    });
  });

  describe('onParticipantLeave', () => {
    test('should remove participant from list of participants', () => {
      const { participants, extras } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      const participant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name',
        disableDropdown: false,
      }) as any;

      participants.publish([participant]);
      whoIsOnlineComponent['onParticipantListUpdate'](participant);

      whoIsOnlineComponent['onParticipantLeave']({ id: 'unit-test-id' });

      expect(participants.value.length).toBe(0);
      expect(extras.value.length).toBe(0);
    });

    test('should remove participant from extras list', () => {
      const { participants, extras } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      const participant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name',
        disableDropdown: false,
      }) as any;

      extras.publish([participant]);
      whoIsOnlineComponent['onParticipantListUpdate'](participant);

      whoIsOnlineComponent['onParticipantLeave']({ id: 'unit-test-id' });

      expect(participants.value.length).toBe(0);
      expect(extras.value.length).toBe(0);
    });

    test('should move participant from extras to participants list', () => {
      const { participants, extras } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      const participant = generateMockParticipant({
        id: 'unit-test-id',
        name: 'unit-test-name',
        disableDropdown: false,
      }) as any;

      const participant2 = generateMockParticipant({
        id: 'unit-test-id-2',
        name: 'unit-test-name-2',
        disableDropdown: false,
      }) as any;

      participants.publish([participant]);
      extras.publish([participant2]);

      whoIsOnlineComponent['onParticipantLeave']({ id: 'unit-test-id' });

      expect(participants.value.length).toBe(1);
      expect(extras.value.length).toBe(0);
    });
  });

  describe('updateParticipant', () => {
    test('should update participant in list of participants', () => {
      const { participants } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      const participant = {
        id: 'unit-test-id',
        name: 'unit-test-name',
      } as any;

      const participant2 = {
        id: 'unit-test-id-2',
        name: 'unit-test-name-2',
      } as any;

      participants.publish([participant, participant2]);

      const updatedParticipant = {
        id: 'unit-test-id',
        name: 'unit-test-name-3',
      };

      whoIsOnlineComponent['updateParticipant'](updatedParticipant as any);

      expect(participants.value.length).toBe(2);
      expect(participants.value[0].name).toBe('unit-test-name-3');
    });

    test('should remove private, non-local participant from list', () => {
      const { participants, extras } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      const participant = {
        id: 'unit-test-id',
        name: 'unit-test-name',
        isPrivate: true,
      } as any;

      const participant2 = {
        id: 'unit-test-id-2',
        name: 'unit-test-name-2',
      } as any;

      participants.publish([participant]);
      extras.publish([participant2]);

      whoIsOnlineComponent['updateParticipant'](participant as any);

      expect(participants.value.length).toBe(1);
      expect(extras.value.length).toBe(0);
    });
  });

  describe('updateExtra', () => {
    test('should update extra in list of extras', () => {
      const { extras } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      const extra = {
        id: 'unit-test-id',
        name: 'unit-test-name',
      } as any;

      const extra2 = {
        id: 'unit-test-id-2',
        name: 'unit-test-name-2',
      } as any;

      extras.publish([extra, extra2]);

      const updatedExtra = {
        id: 'unit-test-id',
        name: 'unit-test-name-3',
      };

      whoIsOnlineComponent['updateExtra'](updatedExtra as any);

      expect(extras.value.length).toBe(2);
      expect(extras.value[0].name).toBe('unit-test-name-3');
    });

    test('should remove private, non-local extra from list', () => {
      const { participants, extras } = whoIsOnlineComponent['useStore'](StoreType.WHO_IS_ONLINE);
      const extra = {
        id: 'unit-test-id',
        name: 'unit-test-name',
        isPrivate: true,
      } as any;

      const extra2 = {
        id: 'unit-test-id-2',
        name: 'unit-test-name-2',
      } as any;

      extras.publish([extra, extra2]);

      whoIsOnlineComponent['updateExtra'](extra as any);

      expect(participants.value.length).toBe(0);
      expect(extras.value.length).toBe(1);
    });
  });

  describe('subscribeToLocalParticipantUpdates', () => {
    test('should update presence', () => {
      const { privateMode, joinedPresence } = whoIsOnlineComponent['useStore'](
        StoreType.WHO_IS_ONLINE,
      );

      whoIsOnlineComponent['room'].presence.update = jest.fn();
      privateMode.publish(false);
      joinedPresence.publish(false);

      const participant = {
        ...MOCK_LOCAL_PARTICIPANT,
        activeComponents: [ComponentNames.PRESENCE],

        slot: {
          color: '#304AFF',
          index: 0,
          colorName: 'color',
          textColor: '#fff',
          timestamp: new Date().getTime(),
        },
      };
      whoIsOnlineComponent['subscribeToLocalParticipantUpdates'](participant);

      expect(joinedPresence.value).toBe(true);
      expect(whoIsOnlineComponent['room'].presence.update).toHaveBeenCalledWith({
        ...whoIsOnlineComponent['getParticipant'](participant),
        isPrivate: false,
      });
    });
  });
});
