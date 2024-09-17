import * as Socket from '@superviz/socket-client';

import {
  NAME_IS_WHITE_TEXT,
  MEETING_COLORS,
  MEETING_COLORS_KEYS,
} from '../../common/types/meeting-colors.types';
import { Participant, ParticipantType, Slot } from '../../common/types/participant.types';
import { Store, StoreType } from '../../common/types/stores.types';
import { useStore } from '../../common/utils/use-store';
import { ComponentNames } from '../../components/types';

export class SlotService {
  private isAssigningSlot = false;

  public slot: Slot = {
    index: null,
    color: MEETING_COLORS.gray,
    textColor: '#fff',
    colorName: 'gray',
    timestamp: Date.now(),
  };

  constructor(
    private room: Socket.Room,
    private useStore: <T extends StoreType>(name: T) => Store<T>,
  ) {
    this.room = room;

    this.room.presence.on(Socket.PresenceEvents.UPDATE, this.onPresenceUpdate);
  }

  /**
   * @function assignSlot
   * @description Assigns a slot to the participant
   * @returns void
   */
  public async assignSlot(): Promise<Slot> {
    if (this.isAssigningSlot) return this.slot;

    this.isAssigningSlot = true;
    let slots = Array.from({ length: 50 }, (_, i) => i);
    let slot = Math.floor(Math.random() * 50);
    const { localParticipant, participants } = useStore(StoreType.GLOBAL);

    try {
      await new Promise((resolve, reject) => {
        this.room.presence.get((presences) => {
          if (!presences || !presences.length) resolve(true);

          if (presences.length >= 50) {
            slots = [];
            reject(new Error('[SuperViz] - No more slots available'));
            return;
          }

          presences.forEach((presence: Socket.PresenceEvent<Participant>) => {
            if (presence.id === localParticipant.value.id) return;

            slots = slots.filter((s) => s !== presence.data?.slot?.index);
          });

          resolve(true);
        });
      });

      const isUsing = !slots.includes(slot);

      if (isUsing) {
        slot = slots.shift();
      }

      const color = Object.keys(MEETING_COLORS)[slot];

      const slotData = {
        index: slot,
        color: MEETING_COLORS[color],
        textColor: NAME_IS_WHITE_TEXT.includes(color) ? '#fff' : '#000',
        colorName: color,
        timestamp: Date.now(),
      };

      this.slot = slotData;

      localParticipant.publish({
        ...localParticipant.value,
        slot: slotData,
      });

      participants.publish({
        ...participants.value,
        [localParticipant.value.id]: {
          ...participants.value[localParticipant.value.id],
          slot: slotData,
        },
      });

      this.room.presence.update({ slot: slotData });

      this.isAssigningSlot = false;
      return slotData;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /**
   * @function setDefaultSlot
   * @description Removes the slot from the participant
   * @returns void
   */
  public setDefaultSlot() {
    const { localParticipant, participants } = useStore(StoreType.GLOBAL);

    const slot: Slot = {
      index: null,
      color: MEETING_COLORS.gray,
      textColor: '#fff',
      colorName: 'gray',
      timestamp: Date.now(),
    };

    this.slot = slot;

    localParticipant.publish({
      ...localParticipant.value,
      slot: slot,
    });

    participants.publish({
      ...participants.value,
      [localParticipant.value.id]: {
        ...participants.value[localParticipant.value.id],
        slot,
      },
    });

    this.room.presence.update({ slot });
  }

  private onPresenceUpdate = async (event: Socket.PresenceEvent<Participant>) => {
    const { localParticipant } = this.useStore(StoreType.GLOBAL);

    if (event.id === localParticipant.value.id) {
      const slot = await this.validateSlotType(event.data);

      localParticipant.publish({
        ...localParticipant.value,
        slot: slot,
      });

      return;
    }

    if (event.data.slot?.index === null || this.slot.index === null) return;

    if (event.data.slot?.index === this.slot?.index) {
      const slotData = await this.assignSlot();

      localParticipant.publish({
        ...localParticipant.value,
        slot: slotData,
      });

      console.debug(
        `[SuperViz] - Slot reassigned to ${localParticipant.value.id}, slot: ${slotData.colorName}`,
      );
    }
  };

  public participantNeedsSlot = (participant: Participant): boolean => {
    const COMPONENTS_THAT_NEED_SLOT = [
      ComponentNames.FORM_ELEMENTS,
      ComponentNames.WHO_IS_ONLINE,
      ComponentNames.PRESENCE,
      ComponentNames.PRESENCE_AUTODESK,
      ComponentNames.PRESENCE_MATTERPORT,
      ComponentNames.PRESENCE_THREEJS,
    ];

    const componentsNeedSlot = COMPONENTS_THAT_NEED_SLOT.some((component) => {
      return participant?.activeComponents?.includes(component);
    });

    const videoNeedSlot =
      participant?.activeComponents?.includes(ComponentNames.VIDEO_CONFERENCE) &&
      participant.type !== ParticipantType.AUDIENCE;

    const needSlot = componentsNeedSlot || videoNeedSlot;

    return needSlot;
  };

  /**
   * @function validateSlotType
   * @description validate if the participant needs a slot
   * @param {Participant} participant - new participant data
   * @returns {void}
   */
  private validateSlotType = async (participant: Participant): Promise<Slot> => {
    if (this.isAssigningSlot) return this.slot;

    const needSlot = this.participantNeedsSlot(participant);

    if (participant.slot?.index === null && needSlot) {
      const slotData = await this.assignSlot();
      this.slot = slotData;
    }

    if (participant.slot?.index !== null && !needSlot) {
      this.setDefaultSlot();
    }

    return this.slot;
  };
}
