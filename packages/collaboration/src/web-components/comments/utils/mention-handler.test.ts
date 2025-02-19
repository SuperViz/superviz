import { MOCK_PARTICIPANT_LIST } from '../../../../__mocks__/participants.mock';

import mentionHandler from './mention-handler';

describe('Mention Handler', () => {
  describe('matchParticipant', () => {
    test('should return default hide mention list', () => {
      const result = mentionHandler.matchParticipant('zi', 0, MOCK_PARTICIPANT_LIST);

      expect(result).toMatchObject({
        action: 'hide',
        mentions: [],
        findDigitParticipant: false,
      });
    })

    test('should return mention list', () => {
      const result = mentionHandler.matchParticipant('name', 0, MOCK_PARTICIPANT_LIST);

      expect(result).toEqual({
        action: 'show',
        mentions: [
          {
            ...MOCK_PARTICIPANT_LIST[0],
            position: 0,
          }
        ],
        findDigitParticipant: false,
      });
    })

    test('should return mention list with digit', () => {
      const { name } = MOCK_PARTICIPANT_LIST[0];
      const result = mentionHandler.matchParticipant(name, 0, MOCK_PARTICIPANT_LIST);

      expect(result).toEqual({
        action: 'hide',
        mentions: [
          {
            ...MOCK_PARTICIPANT_LIST[0],
            position: 0,
          }
        ],
        findDigitParticipant: true,
      });
    });
  });
});
