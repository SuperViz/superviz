import { Avatar, Group, Participant } from '../src';
import { MEETING_COLORS } from '../src/common/types/meeting-colors.types';
import { ParticipantByGroupApi } from '../src/common/types/participant.types';

export const MOCK_AVATAR: Avatar = {
  imageUrl: 'unit-test-avatar-thumbnail.png',
  model3DUrl: 'unit-test-avatar-model.glb',
};

export const MOCK_LOCAL_PARTICIPANT: Participant = {
  id: 'unit-test-local-participant-id',
  name: 'unit-test-local-participant-name',
  avatar: {
    imageUrl: 'unit-test-avatar-thumbnail.png',
    model3DUrl: 'unit-test-avatar-model.glb',
  },
  slot: {
    color: MEETING_COLORS.turquoise,
    index: 0,
    colorName: 'turquoise',
    textColor: '#000',
    timestamp: 0,
  },
};

export const MOCK_GROUP: Group = {
  id: 'unit-test-group-id',
  name: 'unit-test-group-name',
};

export const MOCK_ABLY_PARTICIPANT_DATA_1 = {
  activeComponents: ['whoIsOnline'],
  name: 'unit-test-participant1-name',
  id: 'unit-test-participant1-id',
  avatar: MOCK_AVATAR,
  participantId: MOCK_LOCAL_PARTICIPANT.id,
  slotIndex: 0,
  color: MEETING_COLORS.turquoise,
};

export const MOCK_ABLY_PARTICIPANT_DATA_2 = {
  activeComponents: ['whoIsOnline'],
  name: 'unit-test-participant2-name',
  id: 'unit-test-participant2-id',
  avatar: MOCK_AVATAR,
  participantId: MOCK_LOCAL_PARTICIPANT.id,
  slotIndex: 1,
  color: MEETING_COLORS.orange,
};

export const MOCK_PARTICIPANT_LIST: ParticipantByGroupApi[] = [
  {
    id: 'unit-test-participant1-id',
    name: 'unit-test-participant1-name',
    avatar: 'unit-test-participant1-avatar',
    email: 'unit-test-participant1-email',
  },
];
