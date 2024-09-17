export enum EnvironmentTypes {
  DEV = "dev",
  PROD = "prod",
}

export interface Participant {
  id: string;
  name: string;
}

export type Params = {
  apiKey: string;
  environment: EnvironmentTypes | `${EnvironmentTypes}`;
  participant: Participant;
  room?: string;
};
