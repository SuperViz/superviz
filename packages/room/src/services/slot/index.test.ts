import { PresenceEvent, PresenceEvents, Room } from '@superviz/socket-client';

import { ComponentNames } from '../../common/types/component.types';
import { Participant, Slot } from '../../common/types/participant.types';

import { SlotService } from './index';

describe('SlotService', () => {
  let room: Room;
  let participant: Participant;
  let slotService: SlotService;

  beforeEach(() => {
    room = {
      presence: {
        on: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as Room;

    participant = {
      id: 'participant1',
      slot: SlotService.getDefaultSlot(),
      activeComponents: [ComponentNames.WHO_IS_ONLINE],
    } as Participant;

    slotService = new SlotService(room, participant);
  });

  it('should initialize with default slot', () => {
    expect(slotService.slot).toEqual({
      ...SlotService.getDefaultSlot(),
      timestamp: expect.any(Number),
    });
  });

  it('should assign a slot to the participant', async () => {
    room.presence.get = jest.fn((callback) => callback([]));
    room.presence.update = jest.fn();

    const slot = await slotService['assignSlot']();

    expect(slot).toBeDefined();
    expect(slot.index).toBeGreaterThanOrEqual(0);
    expect(slot.index).toBeLessThan(50);
    expect(room.presence.update).toHaveBeenCalledWith({ slot });
  });

  it('should handle presence update for the same participant', async () => {
    const event: PresenceEvent<Participant> = {
      id: participant.id,
      data: { slot: { index: 1 } },
    } as PresenceEvent<Participant>;

    slotService['validateSlotType'] = jest.fn().mockResolvedValue({ index: 1 });

    await slotService['onPresenceUpdate'](event);

    expect(slotService['validateSlotType']).toHaveBeenCalledWith(event.data);
    expect(participant.slot.index).toBe(1);
  });

  it('should set default slot', () => {
    slotService['setDefaultSlot']();

    const expected = {
      ...SlotService.getDefaultSlot(),
      timestamp: expect.any(Number),
    };

    expect(slotService.slot).toEqual(expected);
    expect(room.presence.update).toHaveBeenCalledWith({ slot: expected });
  });

  it('should validate and assign slot type', async () => {
    slotService['assignSlot'] = jest.fn().mockResolvedValue({ index: 1 });
    slotService['setDefaultSlot'] = jest.fn();

    const slot = await slotService['validateSlotType'](participant);

    expect(slotService['assignSlot']).toHaveBeenCalled();
    expect(slot.index).toBe(1);
  });

  it('should not assign slot if already assigning', async () => {
    slotService['isAssigningSlot'] = true;

    const slot = await slotService['assignSlot']();

    expect(slot).toEqual(slotService.slot);
  });

  it('should throw error if no more slots are available', async () => {
    room.presence.get = jest.fn((callback) => callback(Array(50).fill({})));

    await expect(slotService['assignSlot']()).resolves.toEqual(null);
  });
});
