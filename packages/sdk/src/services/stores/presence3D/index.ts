import { Participant } from '../../../common/types/participant.types';
import { Singleton } from '../common/types';
import { CreateSingleton } from '../common/utils';
import subject from '../subject';

const instance: Singleton<Presence3DStore> = CreateSingleton<Presence3DStore>();

class Presence3DStore {
  public hasJoined3D = subject<boolean>(false);
  public participants = subject<Participant[]>([]);

  constructor() {
    if (instance.value) {
      throw new Error('Presence3DStore is a singleton. There can only be one instance of it.');
    }

    instance.value = this;
  }

  public destroy() {
    this.hasJoined3D.destroy();
    this.participants.destroy();
  }
}

const store = new Presence3DStore();
const destroy = store.destroy.bind(store);

const hasJoined3D = store.hasJoined3D.expose();
const participants = store.participants.expose();

export function usePresence3DStore() {
  return {
    hasJoined3D,
    participants,
    destroy,
  };
}
