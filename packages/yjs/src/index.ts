import { SuperVizYjsProvider } from './provider';
export type { Awareness } from './services';
export type { Events, MessageCallback, ProviderState } from './provider/types';

export { SuperVizYjsProvider };

if (typeof window !== 'undefined') {
  window.SuperVizYjsProvider = SuperVizYjsProvider;
}
