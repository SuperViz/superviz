import { Participant } from '../../common/types/participant.types';
import { StoreType } from '../../common/types/stores.types';
import { Logger } from '../../common/utils';
import { useStore } from '../../common/utils/use-store';

class CoreBridge {
  private logger: Logger;
  constructor() {
    this.logger = new Logger('@superviz/sdk/core-bridge');
    this.logger.log('CoreBridge initialized');
  }

  public updateLocalParticipant(data: Participant) {
    this.logger.log('updateLocalParticipant', data);
    const { localParticipant } = useStore(StoreType.CORE);
    localParticipant.publish(data);
  }

  public updateParticipantsList(data: Record<Participant['id'], Participant>) {
    this.logger.log('updateParticipantsList', data);
    const { participants } = useStore(StoreType.CORE);
    participants.publish(data);
  }
}

export const coreBridge = new CoreBridge();
