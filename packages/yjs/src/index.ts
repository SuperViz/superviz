import { SuperVizYjsProvider } from "./provider";
export { Awareness } from "./services";

export { SuperVizYjsProvider };

if (typeof window !== undefined) {
  window.SuperVizYjsProvider = SuperVizYjsProvider;
}