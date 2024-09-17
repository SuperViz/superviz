import { Comments } from './comments';
import { CanvasPin } from './comments/canvas-pin-adapter';
import { MousePointers } from './presence-mouse';
import { Realtime } from './realtime';
import { VideoConference } from './video';

import * as Components from '.';

describe('Components', () => {
  test('should be export VideoConference', () => {
    expect(Components.VideoConference).toBeDefined();
    expect(Components.VideoConference).toBe(VideoConference);
  });

  test('should be export Comments', () => {
    expect(Components.Comments).toBeDefined();
    expect(Components.Comments).toBe(Comments);
  });

  test('should be export CanvasPin', () => {
    expect(Components.CanvasPin).toBeDefined();
    expect(Components.CanvasPin).toBe(CanvasPin);
  });

  test('should be export MousePointers', () => {
    expect(Components.MousePointers).toBeDefined();
    expect(Components.MousePointers).toBe(MousePointers);
  });

  test('should be export Realtime', () => {
    expect(Components.Realtime).toBeDefined();
    expect(Components.Realtime).toBe(Realtime);
  });

  test('should be export WhoIsOnline', () => {
    expect(Components.WhoIsOnline).toBeDefined();
    expect(Components.WhoIsOnline).toBe(Components.WhoIsOnline);
  });
});
