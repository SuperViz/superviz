import sleep from '../../common/utils/sleep';

import '.';

interface Attributes {
  tooltipData?: { name: string; info: string };
  shiftTooltipLeft?: boolean;
}

const createEl = ({ shiftTooltipLeft, tooltipData }: Attributes) => {
  const element = document.createElement('superviz-tooltip');
  document.body.appendChild(element);
  if (shiftTooltipLeft) {
    element.setAttribute('shiftTooltipLeft', '');
  }

  if (tooltipData) {
    element.setAttribute('tooltipData', JSON.stringify(tooltipData));
  }

  document.body.appendChild(element);

  return element;
};

describe('tooltip', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.width = '300px';
    document.body.style.height = '300px';
  });

  test('should instantiate with the correct default ', async () => {
    createEl({});
    const element = document.querySelector('superviz-tooltip');
    expect(element).toBeTruthy();
  });

  test('should set default position at bottom center', async () => {
    const element = createEl({});
    await sleep();

    expect(element['tooltipVerticalPosition']).toBe('tooltip-bottom');
    expect(element['tooltipHorizontalPosition']).toBe('tooltip-center');
  });

  test('should toggle tooltip on mouseenter', async () => {
    const element = createEl({});
    await sleep();

    const mouseEnter = new CustomEvent('mouseenter', { bubbles: true, composed: true });
    element.dispatchEvent(mouseEnter);
    await sleep();

    expect(element['showTooltip']).toBe(true);

    const mouseLeave = new CustomEvent('mouseleave', { bubbles: true, composed: true });
    element.dispatchEvent(mouseLeave);
    await sleep();

    expect(element['showTooltip']).toBe(false);
  });

  test('should repostion tooltip to top if bottom is out of the screen', async () => {
    const element = createEl({});
    await sleep();

    element['tooltip'].getBoundingClientRect = jest.fn(() => {
      return { bottom: 1000, top: 100 };
    });

    element['adjustTooltipPosition']();
    await sleep();

    expect(element['tooltipVerticalPosition']).toBe('tooltip-top');
  });

  test('should repostion tooltip to bottom if top is out of the screen', async () => {
    const element = createEl({});
    await sleep();
    element['tooltipVerticalPosition'] = 'tooltip-top';

    element['tooltip'].getBoundingClientRect = jest.fn(() => {
      return { bottom: 100, top: -1 };
    });

    element['adjustTooltipPosition']();
    await sleep();

    expect(element['tooltipVerticalPosition']).toBe('tooltip-bottom');
  });

  test('should repostion tooltip to right if left is out of the screen', async () => {
    const element = createEl({});
    await sleep();

    element['tooltip'].getBoundingClientRect = jest.fn(() => {
      return { left: -1, right: 100 };
    });

    element['adjustTooltipPosition']();
    await sleep();

    expect(element['tooltipHorizontalPosition']).toBe('tooltip-right');
  });

  test('should repostion tooltip to left if right is out of the screen', async () => {
    const element = createEl({});
    await sleep();

    element['tooltip'].getBoundingClientRect = jest.fn(() => {
      return { left: 100, right: 1000 };
    });

    const map = new Map([['showTooltip', true]]);
    map.has = jest.fn(() => true);
    element['adjustTooltipPosition']();
    element['updated'](map);
    await sleep();

    expect(element['tooltipHorizontalPosition']).toBe('tooltip-left');
  });

  test('should render tooltip with the correct data', async () => {
    const element = createEl({
      tooltipData: { name: 'test name', info: 'test action' },
    });
    await sleep();

    const mouseEnter = new CustomEvent('mouseenter', { bubbles: true, composed: true });
    element.dispatchEvent(mouseEnter);
    await sleep();

    const tooltip = element.shadowRoot!.querySelector(
      '.superviz-who-is-online__tooltip',
    ) as HTMLElement;
    expect(tooltip).toBeTruthy();

    const tooltipName = tooltip!.querySelector('.tooltip-name');

    expect(tooltipName!.textContent).toBe('test name');

    const tooltipAction = tooltip!.querySelector('.tooltip-action');
    expect(tooltipAction!.textContent).toBe('test action');
  });
});
