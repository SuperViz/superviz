import { z } from 'zod';

import { Brand, BrandSchema } from '../../common/types/brand.types';
import { ParticipantType } from '../../common/types/participant.types';
import { Permissions } from '../../common/types/permissions.types';

export type VideoConferenceProps = {
  brand?: Brand;
  participantType?: ParticipantType | `${ParticipantType}`;
  permissions?: Permissions;
  styles?: string;
};
