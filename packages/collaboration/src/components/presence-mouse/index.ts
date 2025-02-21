/* eslint-disable no-constructor-return */
import { PointersCanvas } from './canvas';
import { PointersHTML } from './html';
import { PresenceMouseProps, Transform } from './types';

export class MousePointers {
  constructor(containerId: string, options?: PresenceMouseProps) {
    const container = document.getElementById(containerId);

    if (!container) {
      throw new Error(`[Superviz] Container with id ${containerId} not found`);
    }

    const tagName = container.tagName.toLowerCase();

    if (tagName === 'canvas') {
      // @ts-ignore
      return new PointersCanvas(containerId, options);
    }

    // @ts-ignore
    return new PointersHTML(containerId, options);
  }

  public transform(transform: Transform) {
    // this is here to give a signature to the method
    // the real implementation occurs in each Pointer
  }
}
