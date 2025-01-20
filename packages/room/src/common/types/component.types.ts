import { Configuration } from '../../services/config/types';
import { EventBus } from '../../services/event-bus';
import { IOC } from '../../services/io';
import { Store, StoreType } from '../../stores/common/types';

export enum ComponentNames {
  REALTIME = 'realtime',
  PRESENCE = 'presence',
  VIDEO_CONFERENCE = 'videoConference',
  COMMENTS = 'comments',
  WHO_IS_ONLINE = 'whoIsOnline',
  PRESENCE_MATTERPORT = 'presence3dMatterport',
  PRESENCE_AUTODESK = 'presence3dAutodesk',
  PRESENCE_THREEJS = 'presence3dThreejs',
  COMMENTS_MATTERPORT = 'comments3dMatterport',
  COMMENTS_AUTODESK = 'comments3dAutodesk',
  COMMENTS_THREEJS = 'comments3dThreejs',
  FORM_ELEMENTS = 'formElements',
  YJS_PROVIDER = 'yjsProvider',
}

export enum PresenceMap {
  'comments' = 'presence',
  'presence3dMatterport' = 'presence',
  'presence3dAutodesk' = 'presence',
  'presence3dThreejs' = 'presence',
  'whoIsOnline' = 'presence',
  'formElements' = 'presence',
  'yjsProvider' = 'presence',
}

export enum Comments3d {
  'comments3dMatterport' = 'comments3d',
  'comments3dAutodesk' = 'comments3d',
  'comments3dThreejs' = 'comments3d',
}

export interface AttachComponentOptions {
  ioc: IOC,
  config: Partial<Configuration>,
  eventBus: EventBus,
  useStore: <T extends StoreType>(name: T) => Store<T>,
  connectionLimit: number | 'unlimited',
}
export interface Component {
  name: ComponentNames | string;
  attach: (o: AttachComponentOptions | any) => void;
  detach: () => void;
}
