import type { SuperVizYjsProvider } from './provider';

declare global {
  interface Window {
    SuperVizYjsProvider: typeof SuperVizYjsProvider;  
  }
}
