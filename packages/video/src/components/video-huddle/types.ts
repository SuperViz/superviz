import { Brand } from '../../common/types/brand.types';
import { i18n } from '../../common/types/i18n.types';
import { Avatar, ParticipantType } from '../../common/types/participant.types';
import { Permissions } from '../../common/types/permissions.types';
import { CamerasPosition, Offset } from '../../services/video-manager/types';

export type VideoHuddleProps = {
  brand?: Brand;
  participantType?: ParticipantType | `${ParticipantType}`;
  permissions?: Permissions & {
    enableFollow?: boolean
    enableGoTo?: boolean
    enableGather?: boolean
    enableDefaultAvatars?: boolean;
  };
  avatars?: Avatar[];
  offset?: Offset;
  camerasPosition?: CamerasPosition | `${CamerasPosition}`
  i18n?: i18n
};
