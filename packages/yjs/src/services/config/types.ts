import { EnvironmentTypes, Participant } from '../../provider/types';

export interface ConfigurationInterface {
  apiKey: string;
  participant: Participant;
  environment: EnvironmentTypes | `${EnvironmentTypes}`;
  roomName: string | undefined;
}
