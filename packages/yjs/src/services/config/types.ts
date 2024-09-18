import { EnvironmentTypes, Participant } from "../../types";

export interface ConfigurationInterface {
  apiKey: string;
  participant: Participant;
  environment: EnvironmentTypes | `${EnvironmentTypes}`;
  roomName: string | undefined;
}