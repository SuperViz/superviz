import { MouseOptions } from '../src/components/presence-mouse/types';
import { PresenceMouse } from '../src/web-components';

export const PRESENCE_MOUSE_MOCK: PresenceMouse = <PresenceMouse>{
  updatePresenceMouseParticipant: (externalParticipant: MouseOptions): void => {},
  removePresenceMouseParticipant: (participantId: string): void => {},
};
