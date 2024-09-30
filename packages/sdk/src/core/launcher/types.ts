import { ParticipantEvent } from '../../common/types/events.types';
import { type Participant } from '../../common/types/participant.types';
import { SuperVizSdkOptions } from '../../common/types/sdk-options.types';
import { Observable } from '../../common/utils';

export interface DefaultLauncher {}

type Events = ParticipantEvent | `${ParticipantEvent}`;
export interface LauncherOptions
  extends Omit<SuperVizSdkOptions, 'environment' | 'debug' | 'roomId'> {}

type LauncherSubscribe = {
  (event: `${ParticipantEvent.SAME_ACCOUNT_ERROR}`, callback: () => void);
  (event: `${ParticipantEvent.LOCAL_JOINED}`, callback: (participant: Participant) => void);
  (event: `${ParticipantEvent.JOINED}`, callback: (participant: Participant) => void);
  (event: `${ParticipantEvent.LOCAL_LEFT}`, callback: (participant: Participant) => void);
  (event: `${ParticipantEvent.LEFT}`, callback: (participant: Participant) => void);
  (event: `${ParticipantEvent.LIST_UPDATED}`, callback: (participant: Participant[]) => void);
  (event: `${ParticipantEvent.LOCAL_UPDATED}`, callback: (participant: Participant) => void);
  (event: string, callback: (data: any) => void);
};

export type LauncherUnsubscribe = {
  (event: `${ParticipantEvent.SAME_ACCOUNT_ERROR}`, callback?: () => void);
  (event: `${ParticipantEvent.LOCAL_JOINED}`, callback?: (participant: Participant) => void);
  (event: `${ParticipantEvent.JOINED}`, callback?: (participant: Participant) => void);
  (event: `${ParticipantEvent.LOCAL_LEFT}`, callback?: (participant: Participant) => void);
  (event: `${ParticipantEvent.LEFT}`, callback?: (participant: Participant) => void);
  (event: `${ParticipantEvent.LIST_UPDATED}`, callback?: (participant: Participant[]) => void);
  (event: `${ParticipantEvent.LOCAL_UPDATED}`, callback?: (participant: Participant) => void);
  (event: string, callback?: (data: any) => void);
};

export interface LauncherFacade {
  subscribe: LauncherSubscribe;
  unsubscribe: LauncherUnsubscribe;
  destroy: () => void;
  addComponent: (component: any) => void;
  removeComponent: (component: any) => void;
}
