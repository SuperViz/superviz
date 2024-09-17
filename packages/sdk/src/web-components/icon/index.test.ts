import '.';
import sleep from '../../common/utils/sleep';

const createElement = (name: string, size?: string, color?: string): Element => {
  const element = document.createElement('superviz-icon');
  document.body.appendChild(element);

  element.setAttribute('name', name);

  if (size) {
    element.setAttribute('size', size);
  }

  if (color) {
    element.setAttribute('color', color);
  }

  return element;
};

describe('Icon', () => {
  test('should mount correctly the icon class', async () => {
    const element = createElement('2d-scene');

    await sleep(0);

    const icon = element.shadowRoot!.querySelector('i')!;

    expect(icon.className).toBe('sv-icon sv-icon-2d-scene_md black');
  });

  test('should mount correctly the icon class with size', async () => {
    const element = createElement('2d-scene', 'lg', 'white');

    await sleep(0);

    element['color'] = 'white';

    const icon = element.shadowRoot!.querySelector('i')!;
    expect(icon.className).toBe('sv-icon sv-icon-2d-scene_lg white');
  });
});
