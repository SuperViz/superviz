import { PresenceEvent, PresenceEvents } from '@superviz/socket-client';

import { RealtimeEvent, WhoIsOnlineEvent } from '../../common/types/events.types';
import { Participant, Avatar } from '../../common/types/participant.types';
import { StoreType } from '../../common/types/stores.types';
import { Logger } from '../../common/utils';
import { Following } from '../../services/stores/who-is-online/types';
import { DropdownOption } from '../../web-components/dropdown/types';
import type { WhoIsOnline as WhoIsOnlineElement } from '../../web-components/who-is-online';
import { BaseComponent } from '../base';
import { ComponentNames } from '../types';

import {
  WhoIsOnlinePosition,
  Position,
  WhoIsOnlineParticipant,
  WhoIsOnlineOptions,
  TooltipData,
  WIODropdownOptions,
} from './types';

export class WhoIsOnline extends BaseComponent {
  public name: ComponentNames;
  protected logger: Logger;
  private element: WhoIsOnlineElement;
  private position: WhoIsOnlinePosition;
  private following: Following;
  private localParticipantId: string;
  private initialized: boolean;

  constructor(options?: WhoIsOnlinePosition | WhoIsOnlineOptions) {
    super();

    this.name = ComponentNames.WHO_IS_ONLINE;
    this.logger = new Logger('@superviz/sdk/who-is-online-component');

    const {
      disablePresenceControls,
      disableGoToParticipant,
      disableFollowParticipant,
      disablePrivateMode,
      disableGatherAll,
      disableFollowMe,
      following,
    } = this.useStore(StoreType.WHO_IS_ONLINE);

    following.subscribe();

    if (typeof options !== 'object') {
      this.position = options ?? Position.TOP_RIGHT;
      return;
    }

    if (typeof options === 'object') {
      this.position = options.position ?? Position.TOP_RIGHT;
      this.setStyles(options.styles);

      disablePresenceControls.publish(options.disablePresenceControls);
      disableGoToParticipant.publish(options.disableGoToParticipant);
      disableFollowParticipant.publish(options.disableFollowParticipant);
      disablePrivateMode.publish(options.disablePrivateMode);
      disableGatherAll.publish(options.disableGatherAll);
      disableFollowMe.publish(options.disableFollowMe);
    }
  }

  // #region Start/Destroy/Events

  /**
   * @function start
   * @description Initializes the Who Is Online component
   * @returns {void}
   */
  protected start(): void {
    const { localParticipant } = this.useStore(StoreType.GLOBAL);
    this.localParticipantId = localParticipant.value.id;

    this.subscribeToRealtimeEvents();
    this.positionWhoIsOnline();
    this.addListeners();
  }

  /**
   * @function destroy
   * @description Destroys the Who Is Online component
   * @returns {void}
   */
  protected destroy(): void {
    this.unsubscribeFromRealtimeEvents();
    this.removeListeners();
    this.element.remove();
    this.element = null;
    this.initialized = false;

    const { destroy } = this.useStore(StoreType.WHO_IS_ONLINE);
    destroy();
  }

  /**
   * @function addListeners
   * @description adds event listeners to the who is online element.
   * @returns {void}
   */
  private addListeners(): void {
    this.element.addEventListener(
      RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT,
      this.followMousePointer,
    );
    this.element.addEventListener(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, this.goToMousePointer);
    this.element.addEventListener(RealtimeEvent.REALTIME_PRIVATE_MODE, this.setPrivate);
    this.element.addEventListener(RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT, this.follow);
    this.element.addEventListener(RealtimeEvent.REALTIME_GATHER, this.gather);
  }

  /**
   * @function removeListeners
   * @description adds event listeners from the who is online element.
   * @returns {void}
   */
  private removeListeners(): void {
    this.element.removeEventListener(
      RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT,
      this.followMousePointer,
    );
    this.element.removeEventListener(
      RealtimeEvent.REALTIME_GO_TO_PARTICIPANT,
      this.goToMousePointer,
    );
    this.element.removeEventListener(RealtimeEvent.REALTIME_PRIVATE_MODE, this.setPrivate);
    this.element.removeEventListener(RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT, this.follow);
    this.element.removeEventListener(RealtimeEvent.REALTIME_GATHER, this.gather);
  }

  /**
   * @function subscribeToRealtimeEvents
   * @description Subscribes to realtime events
   * @returns {void}
   */
  private subscribeToRealtimeEvents(): void {
    this.room.presence.on<WhoIsOnlineParticipant>(
      PresenceEvents.UPDATE,
      this.onParticipantListUpdate,
    );
    this.room.presence.on(PresenceEvents.LEAVE, this.onParticipantLeave);
    this.room.presence.on(PresenceEvents.LEAVE, this.stopFollowing);
    this.room.presence.on(PresenceEvents.JOINED_ROOM, this.onJoinedRoom);
    this.room.on(WhoIsOnlineEvent.GATHER_ALL, this.goToMousePointer);
    this.room.on(WhoIsOnlineEvent.START_FOLLOW_ME, this.setFollow);
  }

  /**
   * @function unsubscribeToRealtimeEvents
   * @description Unsubscribes to realtime events
   * @returns {void}
   */
  private unsubscribeFromRealtimeEvents(): void {
    this.room.presence.off(PresenceEvents.UPDATE);
    this.room.presence.off(PresenceEvents.LEAVE);
    this.room.presence.off(PresenceEvents.JOINED_ROOM);
    this.room.off(WhoIsOnlineEvent.GATHER_ALL, this.goToMousePointer);
    this.room.off(WhoIsOnlineEvent.START_FOLLOW_ME, this.setFollow);
  }

  // #region Participants List Logic
  /**
   * @function initializeList
   * @description Initializes the participants list with participants already in the room
   * @returns {void}
   */
  private initializeList() {
    const { participants, extras } = this.useStore(StoreType.WHO_IS_ONLINE);

    this.room.presence.get((list) => {
      const dataList = list
        .filter((participant) => participant.data['id'])
        .map(({ data }: { data: any }) => {
          let avatar = data.avatar;

          if (!avatar) {
            avatar = this.getAvatar({
              avatar: data.avatar,
              color: data.slot.color,
              name: data.name,
              letterColor: data.slot.textColor,
            });
          }

          const tooltip = this.getTooltipData(data);
          const controls = this.getControls(data);

          return {
            ...data,
            tooltip,
            controls,
            avatar,
            isLocalParticipant: data.id === this.localParticipantId,
          };
        }) as WhoIsOnlineParticipant[];

      if (!dataList.length) return;

      const localParticipantIndex = dataList.findIndex((participant) => {
        return participant.id === this.localParticipantId;
      });

      const localParticipant = dataList.splice(localParticipantIndex, 1)[0] as any;
      const otherParticipants = dataList.splice(0, 3) as any;

      participants.publish([localParticipant, ...otherParticipants]);
      extras.publish(dataList);
    });
  }

  /**
   * @function onParticipantListUpdate
   * @description Receives data about participants in the room who were not loaded
   * when the component was initialized
   * @param {PresenceEvent<WhoIsOnlineParticipant>} event
   * @returns {void}
   */
  private onParticipantListUpdate = (event: PresenceEvent<WhoIsOnlineParticipant>): void => {
    if (this.localParticipantId === undefined || this.localParticipantId === '') return;

    if (!this.initialized) {
      this.initialized = true;
      this.initializeList();
      return;
    }

    const participant: WhoIsOnlineParticipant = {
      ...event.data,
      tooltip: this.getTooltipData(event.data),
      controls: this.getControls(event.data),
    };

    const { participants, extras } = this.useStore(StoreType.WHO_IS_ONLINE);

    const isInParticipantsList = participants.value.some(({ id }) => id === event.data.id);
    if (isInParticipantsList) {
      this.updateParticipant(participant);
      return;
    }

    const isInExtrasList = extras.value.some(({ id }) => id === event.data.id);
    if (isInExtrasList) {
      this.updateExtra(participant);
      return;
    }

    const fitsParticipantList = participants.value.length < 4;
    if (fitsParticipantList) {
      participants.publish([...participants.value, participant]);
      return;
    }

    extras.publish([...extras.value, participant]);
  };

  /**
   * @function onParticipantLeave
   * @description Removes a participant from the participants list when they leave the room
   * @param {PresenceEvent} event
   * @returns {void}
   */
  private onParticipantLeave = (event) => {
    const { participants, extras } = this.useStore(StoreType.WHO_IS_ONLINE);

    const participantIndex = participants.value.findIndex(
      (participant) => participant.id === event.id,
    );

    if (participantIndex === -1) {
      const newExtrasList = extras.value.filter((participant) => participant.id !== event.id);
      extras.publish(newExtrasList);
      return;
    }

    const newParticipantsList = participants.value.filter(
      (participant) => participant.id !== event.id,
    );

    if (extras.value.length) {
      newParticipantsList.push(extras.value[0]);
      const newExtrasList = extras.value.slice(1);
      extras.publish(newExtrasList);
    }

    participants.publish(newParticipantsList);
  };

  /**
   * @function updateParticipant
   * @description Update a regular participant with their newly sent data
   * @param {WhoIsOnlineParticipant} participant The participant with new data
   * @returns {void}
   */
  private updateParticipant = (participant: WhoIsOnlineParticipant): void => {
    const { participants, extras } = this.useStore(StoreType.WHO_IS_ONLINE);

    if (participant.isPrivate && participant.id !== this.localParticipantId) {
      const list = participants.value.filter(({ id }) => id !== participant.id);
      const firstExtra = extras.value.splice(0, 1);

      participants.publish([...list, ...firstExtra]);
      extras.publish([...extras.value]);
      return;
    }

    const newParticipantsList = participants.value.map((p) => {
      if (p.id === participant.id) {
        return participant;
      }

      return p;
    });

    participants.publish(newParticipantsList);
  };

  /**
   * @function updateExtra
   * @description Update an extra participant (one that is only visible by
   * opening the dropdown) with their newly sent data
   * @param {WhoIsOnlineParticipant} participant The participant with new data
   * @returns {void}
   */
  private updateExtra = (participant: WhoIsOnlineParticipant): void => {
    const { extras } = this.useStore(StoreType.WHO_IS_ONLINE);

    if (participant.isPrivate && participant.id !== this.localParticipantId) {
      const list = extras.value.filter(({ id }) => id !== participant.id);

      extras.publish(list);
      return;
    }

    const newExtrasList = extras.value.map((p) => {
      if (p.id === participant.id) {
        return participant;
      }

      return p;
    });

    extras.publish(newExtrasList);
  };

  /**
   * @function subscribeToLocalParticipantUpdates
   * @description Subscribes to updates in the local participant and updates
   * the presence accordingly
   * @param {Participant} participant The local participant
   * @returns {void}
   */
  private subscribeToLocalParticipantUpdates = (participant: Participant): void => {
    if (!participant.slot) return;

    this.localParticipantId = participant.id;

    const { privateMode, joinedPresence } = this.useStore(StoreType.WHO_IS_ONLINE);

    const isInPresence = this.isInPresence(participant.activeComponents);
    joinedPresence.publish(isInPresence);

    const newLocalParticipant = this.getParticipant(participant);

    this.room.presence.update({ ...newLocalParticipant, isPrivate: privateMode.value });
  };

  // #region Presence Controls
  /**
   * @function goToMousePointer
   * @description Publishes the go to event to the event bus
   * @param {CustomEvent | PresenceEvent} event
   * @returns {void}
   */
  private goToMousePointer = (data) => {
    const id = data.presence?.id ?? data.detail?.id;
    if (id === this.localParticipantId) return;

    this.eventBus.publish(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, id);
    this.publish(WhoIsOnlineEvent.GO_TO_PARTICIPANT, id);
  };

  /**
   * @function followMousePointer
   * @description Publishes the follow event to the event bus
   * @param {CustomEvent} event
   * @returns {void}
   */
  private followMousePointer = ({ detail }: CustomEvent) => {
    this.eventBus.publish(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, detail.id);

    if (this.following) {
      this.publish(WhoIsOnlineEvent.START_FOLLOWING_PARTICIPANT, this.following);
    }

    if (!this.following) {
      this.publish(WhoIsOnlineEvent.STOP_FOLLOWING_PARTICIPANT);
    }

    if (detail.source === 'extras') {
      this.highlightParticipantBeingFollowed();
    }

    this.updateParticipantsControls(detail.id);
  };

  /**
   * @function setPrivate
   * @description Publishes the private event to realtime and the event bus
   * @param {CustomEvent} event
   * @returns {void}
   */
  private setPrivate = ({ detail: { isPrivate, id } }: CustomEvent) => {
    const { privateMode, participants } = this.useStore(StoreType.WHO_IS_ONLINE);
    const participant = participants.value.find((participant) => participant.id === id);

    privateMode.publish(isPrivate);
    this.eventBus.publish(RealtimeEvent.REALTIME_PRIVATE_MODE, isPrivate);
    this.room.presence.update({ ...participant, isPrivate });

    if (isPrivate) {
      this.publish(WhoIsOnlineEvent.ENTER_PRIVATE_MODE);
    }

    if (!isPrivate) {
      this.publish(WhoIsOnlineEvent.LEAVE_PRIVATE_MODE);
    }
  };

  /**
   * @function setFollow
   * @description Sets participant being followed after someone used Everyone Follows Me
   * @param followingData
   * @returns
   */
  private setFollow = (followingData) => {
    const { id } = followingData.presence;
    if (id === this.localParticipantId) return;

    const { data } = followingData;
    const { following } = this.useStore(StoreType.WHO_IS_ONLINE);

    following.publish(data);
    this.followMousePointer({ detail: { id: data } } as CustomEvent);
  };

  private follow = ({ detail }: CustomEvent) => {
    const { everyoneFollowsMe } = this.useStore(StoreType.WHO_IS_ONLINE);
    everyoneFollowsMe.publish(!!detail?.id);
    this.room.emit(WhoIsOnlineEvent.START_FOLLOW_ME, detail);

    if (this.following) {
      this.publish(WhoIsOnlineEvent.START_FOLLOW_ME, this.following);
    }

    if (!this.following) {
      this.publish(WhoIsOnlineEvent.STOP_FOLLOW_ME);
    }

    this.updateParticipantsControls(detail?.id);
  };

  /**
   * @function stopFollowing
   * @description Stops following a participant
   * @param {PresenceEvent} event The message sent from room
   * (in case of being called as a callback)
   * @returns
   */
  private stopFollowing = (event: PresenceEvent) => {
    if (event.id !== this.following?.id) return;

    const { following } = this.useStore(StoreType.WHO_IS_ONLINE);
    following.publish(undefined);

    this.eventBus.publish(RealtimeEvent.REALTIME_LOCAL_FOLLOW_PARTICIPANT, undefined);
    this.publish(WhoIsOnlineEvent.STOP_FOLLOWING_PARTICIPANT);
  };

  /**
   * @function gather
   * @description Propagates the gather all event in the room
   * @param {CustomEvent} data The custom event object containing data about
   * the participant calling for the gather all
   */
  private gather = (data: CustomEvent) => {
    this.room.emit(WhoIsOnlineEvent.GATHER_ALL, data.detail.id);
    this.publish(WhoIsOnlineEvent.GATHER_ALL, data.detail.id);
  };

  // #region Helpers
  /**
   * @function setStyles
   * @param {string} styles - The user custom styles to be added to the who is online
   * @returns {void}
   */
  private setStyles(styles: string = '') {
    if (!styles) return;

    const tag = document.createElement('style');
    tag.textContent = styles;
    tag.id = 'superviz-who-is-online-styles';

    document.head.appendChild(tag);
  }

  /**
   * @function positionWhoIsOnline
   * @description Positions the Who Is Online component on the screen
   * @returns {void}
   */
  private positionWhoIsOnline(): void {
    this.element = document.createElement('superviz-who-is-online') as WhoIsOnlineElement;
    const isUsingDefaultPosition = Object.values(Position).includes(
      this.position.toLowerCase() as Position,
    );

    if (isUsingDefaultPosition) {
      document.body.appendChild(this.element);
      const [vertical, horizontal] = this.position.split('-');
      this.element.position = `${vertical}: 20px; ${horizontal}: 40px;`;
      return;
    }

    const container = document.getElementById(this.position);

    if (!container) {
      this.element.position = 'top: 20px; right: 40px;';
      document.body.appendChild(this.element);
      return;
    }

    container.appendChild(this.element);
    this.element.position = 'position: relative;';
  }

  /**
   * @function getParticipant
   * @description Processes the data from a participant to something usable in
   * the Who Is Online component
   * @param {Participant} participant The participant that will be processed
   * @returns {WhoIsOnlineParticipant} The data that will be used in the Who Is Online component
   */
  private getParticipant(participant: Participant): WhoIsOnlineParticipant {
    const {
      avatar: avatarLinks,
      activeComponents,
      id,
      name,
      slot: { color, textColor },
    } = participant;
    const disableDropdown = this.shouldDisableDropdown({ activeComponents, participantId: id });

    const avatar = this.getAvatar({ avatar: avatarLinks, color, name, letterColor: textColor });
    return {
      id,
      name,
      avatar,
      disableDropdown,
      activeComponents,
      isPrivate: false,
    };
  }

  /**
   * @function shouldDisableDropdown
   * @description Decides whether the dropdown with presence controls should be
   * available in a given participant, varying whether they have a presence control enabled or not
   * @param {activeComponents: string[] | undefined; participantId: string;}
   * data Info regarding the participant that will be used to decide if their
   * avatar will be clickable
   * @returns {boolean} True or false depending if should disable the participant dropdown or not
   */
  private shouldDisableDropdown({
    activeComponents,
    participantId,
  }: {
    activeComponents: string[] | undefined;
    participantId: string;
  }) {
    const {
      joinedPresence: { value: joinedPresence },
      disablePresenceControls: { value: disablePresenceControls },
      disableFollowMe: { value: disableFollowMe },
      disableFollowParticipant: { value: disableFollowParticipant },
      disableGoToParticipant: { value: disableGoToParticipant },
      disableGatherAll: { value: disableGatherAll },
      disablePrivateMode: { value: disablePrivateMode },
    } = this.useStore(StoreType.WHO_IS_ONLINE);

    if (
      joinedPresence === false ||
      disablePresenceControls === true ||
      (participantId === this.localParticipantId &&
        disableFollowMe &&
        disablePrivateMode &&
        disableGatherAll) ||
      (participantId !== this.localParticipantId &&
        disableFollowParticipant &&
        disableGoToParticipant)
    ) {
      return true;
    }

    return !activeComponents?.some((component) => component.toLowerCase().includes('presence'));
  }

  /**
   * @function getTooltipData
   * @description Processes the participant info and discovers how the tooltip
   * message should looking when hovering over their avatars
   * @param {isLocalParticipant: boolean; name: string; presenceEnabled: boolean }
   * data Relevant info about the participant that will be used to decide
   * @returns {TooltipData} What the participant tooltip will look like
   */
  private getTooltipData(data: WhoIsOnlineParticipant): TooltipData {
    const { name, disableDropdown, id } = data;
    const isLocalParticipant = id === this.localParticipantId;

    const tooltip: TooltipData = {
      name,
    };

    if (isLocalParticipant) {
      tooltip.name += ' (You)';
    }

    if (!disableDropdown && !isLocalParticipant) {
      tooltip.info = 'Click to follow';
    }

    return tooltip;
  }

  /**
   * @function getAvatar
   * @description Processes the info of the participant's avatar
   * @param { avatar: Avatar; name: string; color: string; letterColor: string } data Information
   * about the participant that will take part in their avatar somehow
   * @returns {Avatar} Information used to decide how to construct the participant's avatar html
   */
  private getAvatar({
    avatar,
    color,
    name,
    letterColor,
  }: {
    avatar: Avatar;
    name: string;
    color: string;
    letterColor: string;
  }) {
    const imageUrl = avatar?.imageUrl;
    const firstLetter = name?.at(0)?.toUpperCase() ?? 'A';

    return { imageUrl, firstLetter, color, letterColor };
  }

  /**
   * @function getControls
   * @description Decides which presence controls the user should see when opening a participant
   * dropdown
   * @param { participantId: string; presenceEnabled: boolean } data Relevant info about the
   * participant that will be used to decide
   * @returns {DropdownOption[]} The presence controls enabled for a given participant
   */
  private getControls(data: WhoIsOnlineParticipant): DropdownOption[] | undefined {
    const { disablePresenceControls } = this.useStore(StoreType.WHO_IS_ONLINE);
    const { disableDropdown, id } = data;

    if (disablePresenceControls.value || disableDropdown) return [];

    if (id === this.localParticipantId) {
      return this.getLocalParticipantControls();
    }

    return this.getOtherParticipantsControls(id);
  }

  /**
   * @function getOtherParticipantsControls
   * @description Decides which presence controls the user should see when opening the dropdown of
   * a participant that is not the local participant
   * @param {string} participantId Which participant is being analyzed
   * @returns {DropdownOption[]} The presence controls enabled for the participant
   */
  private getOtherParticipantsControls(participantId: string): DropdownOption[] {
    const { disableGoToParticipant, disableFollowParticipant, following } = this.useStore(
      StoreType.WHO_IS_ONLINE,
    );

    const controls: DropdownOption[] = [];

    if (!disableGoToParticipant.value) {
      controls.push({ label: WIODropdownOptions['GOTO'], icon: 'place' });
    }

    if (!disableFollowParticipant.value) {
      const isBeingFollowed = following.value?.id === participantId;
      const label = isBeingFollowed
        ? WIODropdownOptions['LOCAL_UNFOLLOW']
        : WIODropdownOptions['LOCAL_FOLLOW'];
      const icon = isBeingFollowed ? 'send-off' : 'send';
      controls.push({ label, icon });
    }

    return controls;
  }

  /**
   * @function getLocalParticipantControls
   * @description Decides which presence controls the user should see when opening the dropdown
   * of the local participant
   * @returns {DropdownOption[]} The presence controls enabled for the local participant
   */
  private getLocalParticipantControls(): DropdownOption[] {
    const {
      disableFollowMe: { value: disableFollowMe },
      disableGatherAll: { value: disableGatherAll },
      disablePrivateMode: { value: disablePrivateMode },
      everyoneFollowsMe: { value: everyoneFollowsMe },
      privateMode: { value: privateMode },
    } = this.useStore(StoreType.WHO_IS_ONLINE);

    const controls: DropdownOption[] = [];

    if (!disableGatherAll) {
      controls.push({ label: WIODropdownOptions['GATHER'], icon: 'gather' });
    }

    if (!disableFollowMe) {
      const icon = everyoneFollowsMe ? 'send-off' : 'send';
      const label = everyoneFollowsMe
        ? WIODropdownOptions['UNFOLLOW']
        : WIODropdownOptions['FOLLOW'];

      controls.push({ label, icon });
    }

    if (!disablePrivateMode) {
      const icon = privateMode ? 'eye_inative' : 'eye';
      const label = privateMode
        ? WIODropdownOptions['LEAVE_PRIVATE']
        : WIODropdownOptions['PRIVATE'];

      controls.push({ label, icon });
    }

    return controls;
  }

  /**
   * @function updateParticipantsControls
   * @description Updated what the presence controls of a single participant should look like
   * now that something about them was updated
   * @param {string | undefined} participantId The participant that suffered some update
   * @returns {void} The participants that did not fit the main list and will be inserted in
   * the extras participants list
   */
  private updateParticipantsControls(participantId: string | undefined): void {
    const { participants } = this.useStore(StoreType.WHO_IS_ONLINE);

    const newParticipantsList = participants.value.map((participant) => {
      if (participantId && participant.id !== participantId) return participant;

      const { id } = participant;
      const controls = this.getControls(participant);

      return {
        ...participant,
        controls,
      };
    });

    participants.publish(newParticipantsList);
  }

  /**
   * @function highlightParticipantBeingFollowed
   * @description Brings a participant that is in the list of extra participants to the front,
   * in the second place of the list of main participants, so they are visible while being followed
   * @returns {void}
   */
  private highlightParticipantBeingFollowed(): void {
    const {
      extras,
      participants,
      following: { value: following },
    } = this.useStore(StoreType.WHO_IS_ONLINE);

    const firstParticipant = participants.value[0];

    const participantId = extras.value.findIndex((participant) => participant.id === following.id);
    const participant = extras.value.splice(participantId, 1)[0];

    participants.value.unshift(firstParticipant);
    participants.value[1] = participant;
    const lastParticipant = participants.value.pop();

    extras.value.push(lastParticipant);
    extras.publish(extras.value);
    participants.publish(participants.value);
  }

  /**
   * @function isInPresence
   * @description Checks if the participant is in presence
   * @param {ComponentNames[]} activeComponents
   * @returns {boolean}
   */
  private isInPresence(activeComponents: ComponentNames[]): boolean {
    return activeComponents?.some((component) => component.includes('presence'));
  }

  private onJoinedRoom = (event: PresenceEvent<Participant>) => {
    if (event.id !== this.localParticipantId) return;

    const { localParticipant } = this.useStore(StoreType.GLOBAL);
    localParticipant.subscribe(this.subscribeToLocalParticipantUpdates);
  };
}
