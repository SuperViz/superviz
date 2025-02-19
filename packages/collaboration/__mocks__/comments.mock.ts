import { Annotation } from '../src/components/comments/types';

export const MOCK_ANNOTATION: Annotation = {
  uuid: 'any_uuid',
  position: JSON.stringify({
    x: 100,
    y: 100,
    z: null,
    type: 'canvas',
  }),
  resolved: false,
  comments: [
    {
      uuid: 'any_uuid',
      avatar: 'any_avatar',
      text: 'any_text',
      createdAt: new Date().toISOString(),
      participant: {
        uuid: 'mock_uuid',
        name: 'mock_name',
        participantId: 'mock_participant_id',
        createdAt: new Date().toISOString(),
        avatar: 'mock_avatar',
      },
      mentions: [{
        userId: 'mock_user_id',
        name: 'mock_name',
      }],
    },
    {
      uuid: 'any_uuid 2',
      avatar: 'any_avatar 2',
      text: 'any_text 2',
      createdAt: new Date().toISOString(),
      participant: {
        uuid: 'mock_uuid',
        name: 'mock_name',
        participantId: 'mock_participant_id',
        createdAt: new Date().toISOString(),
        avatar: 'mock_avatar',
      },
      mentions: [{
        userId: 'mock_user_id',
        name: 'mock_name',
      }],
    },
    {
      uuid: 'any_uuid 3',
      avatar: 'any_avatar 3',
      text: 'any_text 3',
      createdAt: new Date().toISOString(),
      participant: {
        uuid: 'mock_uuid',
        name: 'mock_name',
        participantId: 'mock_participant_id',
        createdAt: new Date().toISOString(),
        avatar: 'mock_avatar'
      },
      mentions: [{
        userId: 'mock_user_id',
        name: 'mock_name',
      }],
    },
  ],
};
