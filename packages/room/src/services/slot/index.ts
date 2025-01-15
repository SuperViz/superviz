import { PresenceEvent, PresenceEvents, Room } from '@superviz/socket-client';

import { MEETING_COLORS, NAME_IS_WHITE_TEXT } from '../../common/types/colors.types';
import { ComponentNames } from '../../common/types/component.types';
import { Participant, ParticipantType, Slot } from '../../common/types/participant.types';

export class SlotService {
  private isAssigningSlot = false;

  public slot: Slot = SlotService.getDefaultSlot();

  constructor(
    private room: Room,
    private participant: Participant,
  ) {
    this.room = room;

    this.room.presence.on(PresenceEvents.UPDATE, this.onPresenceUpdate);
  }

  /**
   * Retrieves the default slot configuration.
   *
   * @returns {Slot} An object representing the default slot with the following properties:
   * - `index`: The index of the slot, set to `null`.
   * - `color`: The color of the slot, set to `MEETING_COLORS.gray`.
   * - `textColor`: The text color of the slot, set to `'#fff'`.
   * - `colorName`: The name of the color, set to `'gray'`.
   * - `timestamp`: The current timestamp.
   */
  public static getDefaultSlot(): Slot {
    return {
      index: null,
      color: MEETING_COLORS.gray,
      textColor: '#fff',
      colorName: 'gray',
      timestamp: Date.now(),
    };
  }

  /**
   * Assigns a slot to the local participant in the room.
   *
   * This method ensures that the local participant is assigned a unique slot
   * within the room. If the participant is already in the process of being
   * assigned a slot, it returns the current slot. Otherwise, it attempts to
   * assign a new slot by checking the presence of other participants and
   * ensuring no duplicate slots are assigned.
   *
   * @returns {Promise<Slot>} A promise that resolves to the assigned slot data.
   *
   * @throws {Error} If no more slots are available.
   */
  private async assignSlot(): Promise<Slot> {
    if (this.isAssigningSlot) return this.slot;

    this.isAssigningSlot = true;
    let slots = Array.from({ length: 50 }, (_, i) => i);
    let slot = Math.floor(Math.random() * 50);

    try {
      await new Promise((resolve, reject) => {
        this.room.presence.get((presences) => {
          if (!presences || !presences.length) resolve(true);

          if (presences.length >= 50) {
            slots = [];
            reject(new Error('[SuperViz] - No more slots available'));
            return;
          }

          presences.forEach((presence: PresenceEvent<Participant>) => {
            if (presence.id === this.participant.id) return;

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

      this.room.presence.update({ slot: slotData });

      this.isAssigningSlot = false;
      return slotData;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /**
   * Sets the default slot for the room.
   *
   * This method initializes a slot with default values including:
   * - `index`: null
   * - `color`: MEETING_COLORS.gray
   * - `textColor`: '#fff'
   * - `colorName`: 'gray'
   * - `timestamp`: current date and time
   *
   * The initialized slot is then assigned to the `slot` property of the instance
   * and the room's presence is updated with the new slot information.
   */
  private setDefaultSlot() {
    const slot: Slot = SlotService.getDefaultSlot();

    this.slot = slot;

    this.room.presence.update({ slot });
  }

  /**
   * Handles the presence update event for a participant.
   *
   * @param event - The presence event containing participant data.
   * @returns A promise that resolves when the presence update handling is complete.
   *
   * This method performs the following actions:
   * - If the event ID matches the local participant's ID,
    it validates the slot type with the event data.
   * - If the slot index in the event data or the current slot index is null, it returns early.
   * - If the slot index in the event data matches the current slot index, it assigns a new slot.
   */
  private onPresenceUpdate = async (event: PresenceEvent<Participant>) => {
    if (event.id === this.participant.id) {
      const slot = await this.validateSlotType(event.data);

      this.participant = Object.assign(this.participant, event.data, { slot });
      return;
    }

    if (event.data.slot?.index === null || this.slot.index === null) return;

    if (event.data.slot?.index === this.slot?.index) {
      await this.assignSlot();
    }
  };

  /**
   * Determines if a participant needs a slot based on their active components and type.
   *
   * @param participant - The participant object to check.
   * @returns `true` if the participant needs a slot, `false` otherwise.
   *
   * The function checks if the participant has any active components that require a slot
   * or if the participant is involved in a video conference and is not of type `AUDIENCE`.
   */
  public participantNeedsSlot = (participant: Participant): boolean => {
    const COMPONENTS_THAT_NEED_SLOT = [
      ComponentNames.FORM_ELEMENTS,
      ComponentNames.WHO_IS_ONLINE,
      ComponentNames.PRESENCE,
      ComponentNames.PRESENCE_AUTODESK,
      ComponentNames.PRESENCE_MATTERPORT,
      ComponentNames.PRESENCE_THREEJS,
      ComponentNames.YJS_PROVIDER,
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
   * Validates and assigns a slot type to a participant if needed.
   *
   * @param participant - The participant for whom the slot type needs to be validated.
   * @returns A promise that resolves to the assigned or default slot.
   *
   * The function performs the following steps:
   * 1. If a slot is currently being assigned, it returns the existing slot.
   * 2. Checks if the participant needs a slot.
   * 3. If the participant's slot index is null and they need a slot, assigns a new slot.
   * 4. If the participant's slot index is not null and they
     do not need a slot, sets the default slot.
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
