import { Participant } from '../../../common/types/participant.types';
import { Singleton } from '../common/types';
import { CreateSingleton } from '../common/utils';
import subject from '../subject';

const instance: Singleton<CoreStore> = CreateSingleton<CoreStore>();

class CoreStore {
  public localParticipant = subject<Participant>({} as Participant);
  public participants = subject<Record<Participant['id'], Participant>>({});

  constructor() {
    if (instance.value) {
      throw new Error('CoreStore is a singleton. There can only be one instance of it.');
    }

    instance.value = this;
  }

  public destroy() {
    this.localParticipant.destroy();
    this.participants.destroy();
  }
}

const store = new CoreStore();
const destroy = store.destroy.bind(store);

const localParticipant = store.localParticipant.expose();
const participants = store.participants.expose();

export function useCoreStore() {
  return {
    localParticipant,
    participants,
    destroy,
  };
}
