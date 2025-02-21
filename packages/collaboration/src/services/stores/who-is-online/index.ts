import { WhoIsOnlineParticipant } from '../../../components/who-is-online/types';
import { Singleton } from '../common/types';
import { CreateSingleton } from '../common/utils';
import subject from '../subject';

import { Following } from './types';

const instance: Singleton<WhoIsOnlineStore> = CreateSingleton<WhoIsOnlineStore>();

export class WhoIsOnlineStore {
  public disablePresenceControls = subject<boolean>(false);
  public disableGoToParticipant = subject<boolean>(false);
  public disableFollowParticipant = subject<boolean>(false);
  public disablePrivateMode = subject<boolean>(false);
  public disableGatherAll = subject<boolean>(false);
  public disableFollowMe = subject<boolean>(false);
  public participants = subject<WhoIsOnlineParticipant[]>([]);
  public extras = subject<WhoIsOnlineParticipant[]>([]);
  public joinedPresence = subject<boolean | undefined>(undefined);
  public everyoneFollowsMe = subject<boolean>(false);
  public privateMode = subject<boolean>(false);
  public following = subject<Following | undefined>(undefined);

  constructor() {
    if (instance.value) {
      throw new Error('WhoIsOnlineStore is a singleton. There can only be one instance of it.');
    }

    instance.value = this;
  }

  public destroy() {
    this.disableGoToParticipant.destroy();
    this.disablePresenceControls.destroy();
    this.disableFollowParticipant.destroy();
    this.disablePrivateMode.destroy();
    this.disableGatherAll.destroy();
    this.disableFollowMe.destroy();
    this.participants.destroy();
    this.extras.destroy();
    this.joinedPresence.destroy();
    this.everyoneFollowsMe.destroy();
    this.privateMode.destroy();
    this.following.destroy();
  }
}

const store = new WhoIsOnlineStore();
const destroy = store.destroy.bind(store) as () => void;

const disablePresenceControls = store.disablePresenceControls.expose();
const disableGoToParticipant = store.disableGoToParticipant.expose();
const disableFollowParticipant = store.disableFollowParticipant.expose();
const disablePrivateMode = store.disablePrivateMode.expose();
const disableGatherAll = store.disableGatherAll.expose();
const disableFollowMe = store.disableFollowMe.expose();
const joinedPresence = store.joinedPresence.expose();
const participants = store.participants.expose();
const extras = store.extras.expose();

const everyoneFollowsMe = store.everyoneFollowsMe.expose();
const privateMode = store.privateMode.expose();

const following = store.following.expose();

export function useWhoIsOnlineStore() {
  return {
    disablePresenceControls,
    disableGoToParticipant,
    disableFollowParticipant,
    disablePrivateMode,
    disableGatherAll,
    disableFollowMe,

    participants,
    extras,

    joinedPresence,
    everyoneFollowsMe,
    privateMode,

    following,

    destroy,
  };
}

export type WhoIsOnlineStoreReturnType = ReturnType<typeof useWhoIsOnlineStore>;
