import { Group, Participant } from '../../../common/types/participant.types';
import { Singleton } from '../common/types';
import { CreateSingleton } from '../common/utils';
import subject from '../subject';

const instance: Singleton<GlobalStore> = CreateSingleton<GlobalStore>();

export class GlobalStore {
  public localParticipant = subject<Participant>({} as Participant);
  public participants = subject<Record<string, Participant>>({});
  public group = subject<Group>(null);
  public isDomainWhitelisted = subject<boolean>(true);
  public hasJoinedRoom = subject<boolean>(false);

  constructor() {
    if (instance.value) {
      throw new Error('CommentsStore is a singleton. There can only be one instance of it.');
    }

    instance.value = this;
  }

  public destroy() {
    this.localParticipant.destroy();
    this.participants.destroy();
    this.group.destroy();
    this.isDomainWhitelisted.destroy();
    this.hasJoinedRoom.destroy();
  }
}

const store = new GlobalStore();
const destroy = store.destroy.bind(store);

const group = store.group.expose();
const participants = store.participants.expose();
const localParticipant = store.localParticipant.expose();
const isDomainWhitelisted = store.isDomainWhitelisted.expose();
const hasJoinedRoom = store.hasJoinedRoom.expose();

export function useGlobalStore() {
  return {
    localParticipant,
    participants,
    group,
    isDomainWhitelisted,
    hasJoinedRoom,
    destroy,
  };
}
