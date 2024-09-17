import { coreBridge } from '.';

const localParticipantSpy = jest.fn();
const participantsSpy = jest.fn();
jest.mock('../../common/utils/use-store', () => ({
  useStore: () => ({
    localParticipant: {
      publish: localParticipantSpy,
    },
    participants: {
      publish: participantsSpy,
    },
  }),
}));

describe('coreBridge', () => {
  describe('updateLocalParticipant', () => {
    test('should log "updateLocalParticipant" and call localParticipant.publish', () => {
      const data = { id: '1' };
      const logSpy = jest.spyOn(coreBridge['logger'], 'log');

      coreBridge.updateLocalParticipant(data);

      expect(logSpy).toHaveBeenCalledWith('updateLocalParticipant', data);
      expect(localParticipantSpy).toHaveBeenCalledWith(data);
    });
  });

  describe('updateParticipantsList', () => {
    test('should log "updateParticipantsList" and call participants.publish', () => {
      const data = { 1: { id: '1' } };
      const logSpy = jest.spyOn(coreBridge['logger'], 'log');

      coreBridge.updateParticipantsList(data);

      expect(logSpy).toHaveBeenCalledWith('updateParticipantsList', data);
      expect(participantsSpy).toHaveBeenCalledWith(data);
    });
  });
});
