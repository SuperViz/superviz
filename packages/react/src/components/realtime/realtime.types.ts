import { DefaultComponentProps } from 'src/common/types/global.types';

import type { RealtimeComponentState } from '../../lib/sdk';

export type RealtimeProps = DefaultComponentProps<{
  onStateChange?: (state: RealtimeComponentState) => void;
}>;
