import '.';

import sleep from '../../common/utils/sleep';

import { DropdownOption } from './types';

interface elementProps {
  position: string;
  align: string;
  label?: string;
  options?: DropdownOption[];
  name?: string;
  showTooltip?: boolean;
  returnData?: any;
}

export const createEl = ({
  position,
  align,
  label,
  options,
  name,
  showTooltip,
  returnData,
}: elementProps): HTMLElement => {
  const element: HTMLElement = document.createElement('superviz-dropdown');

  if (label) {
    element.setAttribute('label', label);
  }

  if (options) {
    element.setAttribute('options', JSON.stringify(options));
  }

  if (returnData) {
    element.setAttribute('returnData', JSON.stringify(returnData));
  }

  if (name) {
    element.setAttribute('name', name);
  }

  if (showTooltip) {
    const tooltipData = {
      name: 'onHover',
      action: 'Click to see more',
    };
    element.setAttribute('tooltipData', JSON.stringify(tooltipData));
    element.setAttribute('canShowTooltip', 'true');
  }

  if (!options) {
    const defaultOptions = [
      {
        name: 'EDIT',
        value: {
          uuid: 'any_uuid',
        },
      },
      {
        name: 'DELETE',
        value: {
          uuid: 'any_uuid',
        },
      },
    ];

    element.setAttribute('position', position);
    element.setAttribute('align', align);
    element.setAttribute('options', JSON.stringify(defaultOptions));
  }

  const elementSlot = document.createElement('div');
  elementSlot.setAttribute('slot', 'dropdown');
  elementSlot.innerHTML = 'X';
  element.appendChild(elementSlot);
  element.style.position = 'absolute';
  element.style.top = '100px';
  element.style.right = '100px';

  const divWrapper = document.createElement('div');
  divWrapper.style.height = '500px';
  divWrapper.style.width = '500px';

  const divContainer = document.createElement('div');
  divContainer.style.height = '300px';
  divContainer.style.width = '300px';
  divContainer.style.overflow = 'scroll';
  divContainer.classList.add('container');

  divWrapper.appendChild(element);
  divContainer.appendChild(divWrapper);

  document.body.style.height = '1000px';
  document.body.style.width = '1000px';
  document.body.appendChild(divContainer);
  return element;
};

const element = () => document.querySelector('superviz-dropdown') as HTMLElement | null;
const dropdown = () => element()?.shadowRoot?.querySelector('.dropdown') as HTMLElement | null;
const dropdownContent = () => dropdown()?.querySelector('.dropdown-content') as HTMLElement | null;
const dropdownMenu = () => {
  return element()?.shadowRoot?.querySelector('.menu') as HTMLElement | null;
};
const dropdownListUL = () => {
  return dropdownMenu()?.querySelector('ul') as HTMLElement | null;
};

describe('dropdown', () => {
  afterEach(() => {
    document.body.querySelector('superviz-dropdown')?.remove();
  });

  test('should render dropdown', () => {
    createEl({ position: 'bottom-right', align: 'left' });
    const element = document.querySelector('superviz-dropdown');

    expect(element).not.toBeNull();
  });

  test('should open dropdown when click on it', async () => {
    createEl({ position: 'bottom-right', align: 'left' });

    await sleep();

    dropdownContent()?.click();

    await sleep();
    const isOpen = dropdownMenu()?.classList.contains('menu-open');
    expect(isOpen).toBeTruthy();
  });

  test('should close dropdown when click on it', async () => {
    const el = createEl({ position: 'bottom-left', align: 'left' });
    await sleep();

    dropdownContent()?.click();
    await sleep();

    expect(el['open']).toBe(true);

    dropdownContent()?.click();
    await sleep();

    expect(el['open']).toBe(false);
  });

  test('should close dropdown when click on option', async () => {
    createEl({ position: 'bottom-right', align: 'left' });

    await sleep();

    dropdownContent()?.click();

    await sleep();

    const option = dropdownListUL()?.querySelector('li');

    option?.click();

    await sleep();

    const isOpen = dropdownMenu()?.classList.contains('menu-open');

    expect(isOpen).toBeFalsy();
  });

  test('should emit event when click on option', async () => {
    createEl({ position: 'bottom-right', align: 'left' });

    await sleep();

    dropdownContent()?.click();

    await sleep();

    const option = dropdownListUL()?.querySelector('li');

    const spy = jest.fn();

    element()?.addEventListener('selected', spy);

    option?.click();

    await sleep();

    expect(spy).toHaveBeenCalled();
  });

  test('should listen click event when click out', async () => {
    createEl({ position: 'bottom-right', align: 'left' });

    await sleep();

    dropdownContent()?.click();

    await sleep();

    const spy = jest.fn();

    document.addEventListener('click', spy);

    document.body.click();

    await sleep();

    expect(spy).toHaveBeenCalled();
  });

  test('should emit event with returnData when returnData specified', async () => {
    createEl({ position: 'bottom-right', align: 'left', returnData: { value: 1 } });

    await sleep();

    dropdownContent()?.click();

    await sleep();

    const option = dropdownListUL()?.querySelector('li');

    const spy = jest.fn();

    element()?.addEventListener('selected', spy);

    option?.click();

    await sleep();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          value: 1,
        },
      }),
    );
  });

  test('should not render header with a name if name is not specified', async () => {
    createEl({ position: 'bottom-right', align: 'left' });

    await sleep();

    const header = dropdownMenu()?.querySelector('.header');
    expect(header).toBeFalsy();
  });

  test('should render header with a name if name is specified', async () => {
    createEl({ position: 'bottom-right', align: 'left', name: 'name' });

    await sleep();

    const header = dropdownMenu()?.querySelector('.header');
    expect(header?.children.length).not.toBe(0);
  });

  test('should not show icons if icons is not specified', async () => {
    createEl({ position: 'bottom-right', align: 'left' });

    await sleep();

    const icons = dropdownListUL()?.querySelector('superviz-icon');

    expect(icons).toBeNull();
  });

  test('should show icons if icons is specified', async () => {
    createEl({
      position: 'bottom-right',
      align: 'left',
      options: [
        { label: 'left', icon: 'left' },
        { label: 'right', icon: 'right' },
      ],
    });

    await sleep();

    const icons = dropdownListUL()?.querySelector('superviz-icon');

    expect(icons).not.toBeNull();
  });

  describe('tooltip', () => {
    test('should render tooltip if can show it', async () => {
      createEl({ position: 'bottom-right', align: 'left', showTooltip: true });
      await sleep();

      const tooltip = element()?.shadowRoot?.querySelector('superviz-tooltip');

      expect(tooltip).toBeTruthy();
    });
  });

  describe('setHorizontalPosition', () => {
    beforeEach(() => {
      window.innerWidth = 1000;
    });

    test('should center dropdown if it fits in the window', async () => {
      const element = createEl({ position: 'bottom-right', align: 'left' });
      await sleep();

      const slotDropdown = element.shadowRoot!.querySelector(
        'slot[name="dropdown"]',
      ) as HTMLSlotElement;
      slotDropdown.parentElement!.getBoundingClientRect = () =>
        ({
          left: 300,
          right: 340,
          width: 100,
        } as any);

      element['menu'].getBoundingClientRect = () => ({ width: 100 });

      element['setHorizontalPosition']();

      expect(element['menu'].style.left).toBe('300px');
      expect(element['menu'].style.right).toBe('');
      expect(element['menu'].style.transform).toContain('translate(calc(-50% + 50px)');
    });

    test('should align dropdown to the left if it does not fit to the right of the window', async () => {
      const element = createEl({ position: 'bottom-right', align: 'left' });
      await sleep();

      const slotDropdown = element.shadowRoot!.querySelector(
        'slot[name="dropdown"]',
      ) as HTMLSlotElement;
      slotDropdown.parentElement!.getBoundingClientRect = () =>
        ({
          left: 980,
          right: 1020,
          width: 100,
        } as any);

      element['menu'].getBoundingClientRect = () => ({ width: 100 });

      element['setHorizontalPosition']();

      const right = window.innerWidth - 1020;
      expect(element['menu'].style.left).toBe('');
      expect(element['menu'].style.right).toBe(`${right}px`);
      expect(element['menu'].style.transform).toContain('translate(0px');
    });

    test('should align dropdown to the right if it does not fit to the left of the window', async () => {
      const element = createEl({ position: 'bottom-right', align: 'left' });
      await sleep();

      const slotDropdown = element.shadowRoot!.querySelector(
        'slot[name="dropdown"]',
      ) as HTMLSlotElement;
      slotDropdown.parentElement!.getBoundingClientRect = () =>
        ({
          left: 0,
          right: 40,
          width: 40,
        } as any);

      element['menu'].getBoundingClientRect = () => ({ width: 100 });

      element['setHorizontalPosition']();

      const left = 40 - 40;
      expect(element['menu'].style.left).toBe(`${left}px`);
      expect(element['menu'].style.right).toBe('');
      expect(element['menu'].style.transform).toContain('translate(0px');
    });
  });

  describe('setPositionVertical', () => {
    beforeEach(() => {
      window.innerHeight = 1000;
    });

    test('should position dropdown below the dropdown button if it fits in the window', async () => {
      const element = createEl({ position: 'bottom-right', align: 'left' });
      await sleep();

      const slotDropdown = element.shadowRoot!.querySelector(
        'slot[name="dropdown"]',
      ) as HTMLSlotElement;
      slotDropdown.parentElement!.getBoundingClientRect = () =>
        ({
          top: 100,
          bottom: 140,
        } as any);

      element['menu'].getBoundingClientRect = () => ({ height: 40 });

      element['setPositionVertical']();

      expect(element['menu'].style.bottom).toBe('');
      expect(element['menu'].style.top).toBe('148px');
    });

    test('should position dropdown above the dropdown button if it does not fit below the button', async () => {
      const element = createEl({ position: 'bottom-right', align: 'left' });
      await sleep();

      const slotDropdown = element.shadowRoot!.querySelector(
        'slot[name="dropdown"]',
      ) as HTMLSlotElement;
      slotDropdown.parentElement!.getBoundingClientRect = () =>
        ({
          top: 959,
          bottom: 999,
        } as any);

      element['menu'].getBoundingClientRect = () => ({ height: 100 });

      element['setPositionVertical']();

      const bottom = 1000 - 959 + 8;
      expect(element['menu'].style.top).toBe('auto');
      expect(element['menu'].style.bottom).toBe(`${bottom}px`);
    });
  });
});
