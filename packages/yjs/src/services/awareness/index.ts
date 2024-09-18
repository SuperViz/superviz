import { ObservableV2 } from "lib0/observable";
import * as Y from "yjs";
export class Awareness extends ObservableV2<any> {
  public clientId: number = 0;
  public meta: Map<string, { clock: number; lastUpdated: number }> = new Map();
  public states: Map<string, any> = new Map();

  constructor(public doc: Y.Doc) {
    super();
    console.log("Awareness");
  }

  public destroy(): void {
    console.log("destroy");
  }

  public getLocalState(): Record<string, any> | null {
    return null;
  }

  public getStates(): Map<string, Record<string, any>> {
    return new Map();
  }

  public setLocalState(value: any): void {
    return;
  }
  public setLocalStateField(field: string, value: any): void {
    return;
  }
}
