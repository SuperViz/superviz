import { Brand } from '../../common/types/brand.types';
import { i18n } from '../../common/types/i18n.types';
import { ParticipantType } from '../../common/types/participant.types';
import { Permissions } from '../../common/types/permissions.types';

export type VideoConferenceProps = {
  brand?: Brand;
  participantType?: ParticipantType | `${ParticipantType}`;
  permissions?: Permissions;
  styles?: string;
  i18n?: i18n
};
