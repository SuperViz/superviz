import { PointersCanvas } from './canvas';
import { PointersHTML } from './html';

import { MousePointers } from '.';

describe('MousePointers initialization', () => {
  test('should return a PointersCanvas instance when the container is a canvas', () => {
    document.body.innerHTML = '<canvas id="canvas"></canvas>';
    const mousePointers = new MousePointers('canvas');
    expect(mousePointers).toBeInstanceOf(PointersCanvas);
  });

  test('should return a PointersHTML instance when the container is another type of html element', () => {
    document.body.innerHTML = '<div id="div"></div>';
    const mousePointers = new MousePointers('div');
    expect(mousePointers).toBeInstanceOf(PointersHTML);

    document.body.innerHTML = '<span id="span"></span>';
    const mousePointers2 = new MousePointers('span');
    expect(mousePointers2).toBeInstanceOf(PointersHTML);

    document.body.innerHTML = '<section id="section"></section>';
    const mousePointers3 = new MousePointers('section');
    expect(mousePointers3).toBeInstanceOf(PointersHTML);
  });
});
