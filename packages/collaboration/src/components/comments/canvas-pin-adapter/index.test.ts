import { MOCK_CANVAS } from '../../../../__mocks__/canvas.mock';
import { MOCK_ANNOTATION } from '../../../../__mocks__/comments.mock';
import { ParticipantByGroupApi } from '../../../common/types/participant.types';
import { HTMLPin } from '../html-pin-adapter';

import { CanvasPin } from '.';

const MOCK_PARTICIPANTS: ParticipantByGroupApi[] = [
  {
    name: 'John Zero',
    avatar: 'avatar1.png',
    id: '1',
    email: 'john.zero@mail.com',
  },
  {
    name: 'John Uno',
    avatar: 'avatar2.png',
    id: '2',
    email: 'john.uno@mail.com',
  },
  {
    name: 'John Doe',
    avatar: 'avatar3.png',
    id: '3',
    email: 'john.doe@mail.com',
  },
];

describe('CanvasPinAdapter', () => {
  let canvasPinAdapter: HTMLPin;
  let instance: CanvasPin;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <div data-superviz-id="1"></div>
        <div data-superviz-id="2"></div>
        <div data-superviz-id="3"></div>
      </div>
      <div id="parentElement" style="width: 200px; height: 200px; overflow: auto;">
      <div id="divWrapper">
        <canvas id="canvas"></canvas>
      </div>
    </div>
    `;
    canvasPinAdapter = new HTMLPin('container');
    canvasPinAdapter.setActive(true);
    canvasPinAdapter['mouseDownCoordinates'] = { x: 100, y: 100 };
    instance = new CanvasPin('canvas');
    instance.setActive(true);
    instance['mouseDownCoordinates'] = { x: 100, y: 100 };
    instance['canvas'] = { ...instance['canvas'], ...MOCK_CANVAS } as unknown as HTMLCanvasElement;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('set participantsList', () => {
    test('should set the participants list correctly', () => {
      const participants = MOCK_PARTICIPANTS;

      canvasPinAdapter.participantsList = participants;

      expect(canvasPinAdapter.participants).toEqual(participants);
    });

    test('should handle an empty participants list', () => {
      const participants: ParticipantByGroupApi[] = [];

      canvasPinAdapter.participantsList = participants;

      expect(canvasPinAdapter.participants).toEqual(participants);
    });

  });

  describe('annotationSelected', () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });

    test('should select annotation pin', async () => {
      instance.updateAnnotations([MOCK_ANNOTATION]);

      expect(instance['selectedPin']).toBeNull();

      instance['annotationSelected'](
        new CustomEvent('select-annotation', {
          detail: {
            uuid: MOCK_ANNOTATION.uuid,
          },
        }),
      );

      expect([...instance['pins'].values()].some((pin) => pin.hasAttribute('active'))).toBeTruthy();
    });

    test('should not select annotation pin if uuid is not defined', async () => {
      instance.updateAnnotations([MOCK_ANNOTATION]);

      expect(instance['selectedPin']).toBeNull();

      instance['annotationSelected'](
        new CustomEvent('select-annotation', {
          detail: {
            uuid: undefined,
          },
        }),
      );

      expect([...instance['pins'].values()].some((pin) => pin.hasAttribute('active'))).toBeFalsy();
    });
  });

  test('should remove active on Escape key', () => {
    instance.updateAnnotations([MOCK_ANNOTATION]);
    const detail = {
      uuid: MOCK_ANNOTATION.uuid,
    };

    instance['annotationSelected']({ detail } as unknown as CustomEvent);

    expect(instance['selectedPin']).not.toBeNull();

    instance['resetPins']({ key: 'Escape' } as unknown as KeyboardEvent);

    expect(instance['selectedPin']).toBeNull();
  });

  test('should toggle active attribute when click same annotation twice', () => {
    const detail = {
      uuid: MOCK_ANNOTATION.uuid,
    };

    instance.updateAnnotations([MOCK_ANNOTATION]);
    instance['annotationSelected']({ detail } as unknown as CustomEvent);

    expect(instance['selectedPin']).not.toBeNull();
    expect(instance['selectedPin']?.hasAttribute('active')).toBeTruthy();

    instance['annotationSelected']({ detail } as unknown as CustomEvent);

    expect(instance['selectedPin']).toBeNull();
  });

  test('should not select annotation pin if it does not exist', async () => {
    instance.updateAnnotations([MOCK_ANNOTATION]);

    expect(instance['selectedPin']).toBeNull();

    instance['annotationSelected'](
      new CustomEvent('select-annotation', {
        detail: {
          uuid: 'not-found',
        },
      }),
    );

    expect([...instance['pins'].values()].some((pin) => pin.hasAttribute('active'))).toBeFalsy();
  });

  test('should remove temporary pin when selecting another pin', () => {
    instance['canvas'].dispatchEvent(new MouseEvent('mouseenter'));
    instance['onClick']({ x: 100, y: 100 } as unknown as MouseEvent);

    instance['annotationSelected'](
      new CustomEvent('select-annotation', {
        detail: {
          uuid: MOCK_ANNOTATION.uuid,
        },
      }),
    );

    expect(instance['pins'].has('temporary-pin')).toBeFalsy();
  });

  test('should remove highlight from annotation pin when sidebar is closed', () => {
    instance.updateAnnotations([MOCK_ANNOTATION]);
    instance['annotationSelected'](
      new CustomEvent('select-annotation', {
        detail: {
          uuid: MOCK_ANNOTATION.uuid,
        },
      }),
    );

    let pin = instance['pins'].get(MOCK_ANNOTATION.uuid);

    expect(pin?.hasAttribute('active')).toBeTruthy();

    instance['onToggleAnnotationSidebar'](
      new CustomEvent('toggle-annotation-sidebar', {
        detail: {
          open: false,
        },
      }),
    );

    pin = instance['pins'].get(MOCK_ANNOTATION.uuid);

    expect(pin?.hasAttribute('active')).toBeFalsy();
  });

  test('should not remove highlight from annotation pin when sibar is opened', () => {
    instance.updateAnnotations([MOCK_ANNOTATION]);
    instance['annotationSelected'](
      new CustomEvent('select-annotation', {
        detail: {
          uuid: MOCK_ANNOTATION.uuid,
        },
      }),
    );

    let pin = instance['pins'].get(MOCK_ANNOTATION.uuid);

    expect(pin?.hasAttribute('active')).toBeTruthy();

    instance['onToggleAnnotationSidebar'](
      new CustomEvent('toggle-annotation-sidebar', {
        detail: {
          open: true,
        },
      }),
    );

    pin = instance['pins'].get(MOCK_ANNOTATION.uuid);

    expect(pin?.hasAttribute('active')).toBeTruthy();
  });

  test('should create a new instance of CanvasPinAdapter', () => {
    const canvasPinAdapter = new CanvasPin('canvas');
    canvasPinAdapter.setActive(true);
    expect(canvasPinAdapter).toBeInstanceOf(CanvasPin);
    expect(canvasPinAdapter['canvas'].style.cursor).toBe(
      'url("https://production.cdn.superviz.com/static/pin-html.png") 0 100, pointer',
    );
  });

  test('should throw an error if no canvas element is found', () => {
    expect(() => new CanvasPin('not-found-canvas')).toThrowError(
      'Canvas with id not-found-canvas not found',
    );
  });

  test('should add event listeners to the canvas element', () => {
    const addEventListenerSpy = jest.spyOn(instance['canvas'], 'addEventListener');
    instance['addListeners']();
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
  });

  test('should destroy the canvas pin adapter', () => {
    const removeEventListenerSpy = jest.spyOn(instance['canvas'], 'removeEventListener');

    instance.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
  });

  test('should create temporary pin when mouse clicks canvas', () => {
    instance['canvas'].dispatchEvent(new MouseEvent('mouseenter'));
    instance['onClick']({ x: 100, y: 100 } as unknown as MouseEvent);

    expect(instance['pins'].has('temporary-pin')).toBeTruthy();
  });

  test('should remove annotation pin', () => {
    instance.updateAnnotations([MOCK_ANNOTATION]);

    expect(instance['pins'].size).toEqual(1);

    instance.removeAnnotationPin(MOCK_ANNOTATION.uuid);

    expect(instance['pins'].size).toEqual(0);
  });

  test('should not remove annotation pin if it does not exist', () => {
    instance.updateAnnotations([MOCK_ANNOTATION]);

    expect(instance['pins'].size).toEqual(1);

    instance.removeAnnotationPin('not_found_uuid');

    expect(instance['pins'].size).toEqual(1);
  });

  test('should not render annotations if the adapter is not active and visibility is false', async () => {
    instance.setActive(false);
    instance.setPinsVisibility(false);

    instance.updateAnnotations([MOCK_ANNOTATION]);

    expect(instance['pins'].size).toEqual(0);
  });

  test('should remove pins when visibility is false', () => {
    instance.setPinsVisibility(true);

    instance.updateAnnotations([MOCK_ANNOTATION]);

    expect(instance['pins'].size).toEqual(1);

    instance.setPinsVisibility(false);

    expect(instance['pins'].size).toEqual(0);
  });

  test('should not render annotation if the coordinate type is not canvas', () => {
    instance.updateAnnotations([
      {
        ...MOCK_ANNOTATION,
        uuid: 'not-canvas',
        position: JSON.stringify({
          x: 100,
          y: 100,
          type: 'not-canvas',
        }),
      },
    ]);

    expect(instance['pins'].has('not-canvas')).toBeFalsy();
  });

  test('should reset on KeyBoardEvent if the key is Escape', () => {
    instance['canvas'].dispatchEvent(new MouseEvent('mouseenter'));
    instance['onClick']({ x: 100, y: 100 } as unknown as MouseEvent);

    expect(instance['pins'].has('temporary-pin')).toBeTruthy();

    instance['resetPins']({ key: 'Escape' } as unknown as KeyboardEvent);

    expect(instance['pins'].has('temporary-pin')).toBeFalsy();
  });

  test('should not reset on KeyboardEvent if the key is not Escape', () => {
    instance['canvas'].dispatchEvent(new MouseEvent('mouseenter'));
    instance['onClick']({ x: 100, y: 100 } as unknown as MouseEvent);

    expect(instance['pins'].has('temporary-pin')).toBeTruthy();

    instance['resetPins']({ key: 'Enter' } as unknown as KeyboardEvent);

    expect(instance['pins'].has('temporary-pin')).toBeTruthy();
  });

  test('should not create a temporary pin if the adapter is not active', () => {
    const canvasPinAdapter = new CanvasPin('canvas');
    canvasPinAdapter.setActive(false);

    canvasPinAdapter['canvas'].dispatchEvent(new MouseEvent('mouseenter'));
    canvasPinAdapter['onClick']({ x: 100, y: 100 } as unknown as MouseEvent);

    expect(canvasPinAdapter['pins'].has('temporary-pin')).toBeFalsy();
  });

  test('should remove annotation pin when it is resolved', () => {
    const annotation = {
      ...MOCK_ANNOTATION,
      resolved: false,
    };

    instance.updateAnnotations([
      { ...annotation, uuid: '000 ' },
      { ...annotation, uuid: '123' },
      { ...annotation, uuid: '321' },
    ]);

    expect(instance['pins'].size).toEqual(3);

    instance.updateAnnotations([
      { ...annotation, uuid: '000 ' },
      { ...annotation, uuid: '123', resolved: true },
      { ...annotation, uuid: '321', resolved: true },
    ]);

    expect(instance['pins'].size).toEqual(1);
  });

  test('should not render annotations if the canvas is hidden', () => {
    instance.updateAnnotations([MOCK_ANNOTATION]);

    expect(instance['pins'].size).toEqual(1);

    instance['canvas'].style.display = 'none';

    instance.updateAnnotations([]);

    expect(instance['pins'].size).toEqual(0);
  });

  test('should update mouse coordinates on mousedown event', () => {
    const event = new MouseEvent('mousedown', { clientX: 100, clientY: 200 });
    instance['setMouseDownCoordinates'] = jest
      .fn()
      .mockImplementation(instance['setMouseDownCoordinates']);
    const customEvent = {
      ...event,
      x: event.clientX,
      y: event.clientY,
    };

    instance['setMouseDownCoordinates'](customEvent);
    expect(instance['mouseDownCoordinates']).toEqual({ x: 100, y: 200 });
  });
});
