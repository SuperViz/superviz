export type RemoteConfig = {
  apiUrl: string;
  conferenceLayerUrl: string;
};

export interface FeatureFlags {
  realtime: boolean;
  presence: boolean;
  videoConference: boolean;
  comments: boolean;
  whoIsOnline: boolean;
  presence3dMatterport: boolean;
  presence3dAutodesk: boolean;
  presence3dThreejs: boolean;
  formElements: boolean;
  transcriptLangs: string[];
}
