import { DefaultComponentProps } from 'src/common/types/global.types';

import type { Position } from '../../lib/sdk';

export type WhoIsOnlineProps = DefaultComponentProps<{
  position?: `${Position}` | string;
  styles?: string;
  disablePresenceControls?: boolean;
  disableGoToParticipant?: boolean;
  disableFollowParticipant?: boolean;
  disablePrivateMode?: boolean;
  disableGatherAll?: boolean;
  disableFollowMe?: boolean;
}>;
