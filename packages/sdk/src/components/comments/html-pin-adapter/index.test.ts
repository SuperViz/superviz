import { MOCK_ANNOTATION } from '../../../../__mocks__/comments.mock';
import { ParticipantByGroupApi } from '../../../common/types/participant.types';

import { HTMLPin } from '.';

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

const MOCK_ANNOTATION_HTML = {
  ...MOCK_ANNOTATION,
  position: JSON.stringify({
    x: 100,
    y: 100,
    z: null,
    type: 'html',
    elementId: '1',
  }),
};

describe('HTMLPinAdapter', () => {
  let instance: HTMLPin;
  let target: HTMLElement;
  let currentTarget: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <div data-superviz-id="1"></div>
        <div data-superviz-id="2"></div>
        <div data-superviz-id="3"></div>
      </div>
    `;

    instance = new HTMLPin('container');
    instance.setActive(true);
    instance['mouseDownCoordinates'] = { x: 100, y: 100 };
    target = instance['divWrappers'].get('1') as HTMLElement;
    currentTarget = target;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should set participants correctly', () => {
    const htmlPinAdapter = new HTMLPin('container');
    const participants: ParticipantByGroupApi[] = MOCK_PARTICIPANTS;
    htmlPinAdapter.participantsList = participants;

    expect(htmlPinAdapter.participants).toEqual(participants);
  });

  describe('constructor', () => {
    test('should create a new instance of HTMLPinAdapter', () => {
      const canvasPinAdapter = new HTMLPin('container');
      canvasPinAdapter.setActive(true);
      expect(canvasPinAdapter).toBeInstanceOf(HTMLPin);
    });

    test('should throw an error if no html element is found', () => {
      expect(() => new HTMLPin('not-found-html')).toThrowError(
        'Element with id not-found-html not found',
      );
    });

    test('should throw error if second argument is not of type object', () => {
      expect(() => new HTMLPin('container', 'not-object' as any)).toThrowError(
        'Second argument of the HTMLPin constructor must be an object',
      );
    });

    test('should throw error if dataAttributeName is an empty string', () => {
      expect(() => new HTMLPin('container', { dataAttributeName: '' })).toThrowError(
        'dataAttributeName must be a non-empty string',
      );
    });

    test('should throw error if dataAttributeName is null', () => {
      expect(() => new HTMLPin('container', { dataAttributeName: null as any })).toThrowError(
        'dataAttributeName cannot be null',
      );
    });

    test('should throw error if dataAttributeName is not a string', () => {
      expect(() => new HTMLPin('container', { dataAttributeName: 123 as any })).toThrowError(
        'dataAttributeName must be a non-empty string',
      );
    });

    test('should call requestAnimationFrame if there is a void element', () => {
      document.body.innerHTML = '<div id="container"><img data-superviz-id="1" /></div>';
      const pin = new HTMLPin('container');
      expect(pin['animateFrame']).toBeTruthy();
    });
  });

  describe('destroy', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should destroy the HTML pin adapter', () => {
      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);
      const removeListenersSpy = jest.spyOn(instance as any, 'removeListeners');
      const removeObserversSpy = jest.spyOn(instance as any, 'removeObservers');
      const onPinFixedObserverSpy = jest.spyOn(instance['onPinFixedObserver'], 'destroy');
      const removeElementListenersSpy = jest.spyOn(document.body as any, 'removeEventListener');
      const removeSpy = jest.fn();
      const removeEventListenerSpy = jest.fn();

      const getAttribute = jest
        .fn()
        .mockResolvedValue(Math.random() > 0.5 ? '' : 'data-wrapper-type');
      const parentElement = {
        remove: removeSpy,
      };

      const wrappers = [...instance['divWrappers']].map(([entry, value]) => {
        return [
          entry,
          {
            ...value,
            remove: removeSpy,
            removeEventListener: removeEventListenerSpy,
            getAttribute,
            parentElement,
          },
        ];
      });
      instance['divWrappers'] = new Map(wrappers as [key: any, value: any][]);

      instance.destroy();

      expect(removeListenersSpy).toHaveBeenCalled();
      expect(removeObserversSpy).toHaveBeenCalled();
      expect(onPinFixedObserverSpy).toHaveBeenCalled();
      expect(removeElementListenersSpy).toHaveBeenCalled();

      expect(removeSpy).toHaveBeenCalledTimes(3);

      expect(instance['annotations']).toEqual([]);
      expect(instance['elementsWithDataId']).toEqual(undefined);
      expect(instance['divWrappers']).toEqual(undefined);
      expect(instance['pins']).toEqual(undefined);
      expect(instance['onPinFixedObserver']).toEqual(undefined);
      expect(instance['divWrappers']).toEqual(undefined);
      expect(instance['mutationObserver']).toEqual(undefined);
    });
  });

  describe('listeners', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      instance['divWrappers'].clear();
      instance['prepareElements']();
    });

    test('should add event listeners to the HTML container', () => {
      const bodyAddEventListenerSpy = jest.spyOn(document.body, 'addEventListener');
      const wrapperAddEventListenerSpy = jest.fn();

      const wrappers = [...instance['divWrappers']].map(([entry, value]) => {
        return [entry, { ...value, addEventListener: wrapperAddEventListenerSpy }];
      });

      instance['divWrappers'] = new Map(wrappers as [key: any, value: any][]);

      instance['addListeners']();

      expect(bodyAddEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(wrapperAddEventListenerSpy).toHaveBeenCalledTimes(12);
    });

    test('should remove event listeners from the HTML container', () => {
      const bodyRemoveEventListenerSpy = jest.spyOn(document.body, 'removeEventListener');
      const wrapperRemoveEventListenerSpy = jest.fn();

      const wrappers = [...instance['divWrappers']].map(([entry, value]) => {
        return [entry, { ...value, removeEventListener: wrapperRemoveEventListenerSpy }];
      });

      instance['divWrappers'] = new Map(wrappers as [key: any, value: any][]);

      instance['removeListeners']();

      expect(bodyRemoveEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(wrapperRemoveEventListenerSpy).toHaveBeenCalledTimes(12);
    });
  });

  describe('annotationSelected', () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });

    test('should select annotation pin', () => {
      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);

      expect(instance['selectedPin']).toBeNull();

      instance['annotationSelected'](
        new CustomEvent('select-annotation', {
          detail: {
            uuid: MOCK_ANNOTATION_HTML.uuid,
          },
        }),
      );

      expect([...instance['pins'].values()].some((pin) => pin.hasAttribute('active'))).toBeTruthy();
    });

    test('should not select annotation pin if uuid is not defined', () => {
      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);

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

  describe('renderAnnotationsPins', () => {
    afterAll(() => {
      jest.restoreAllMocks();
      instance['pins'].clear();
    });

    test('should not render anything if annotations list is empty', () => {
      instance['annotations'] = [];
      instance['pins'].clear();
      const spy = jest.spyOn(instance as any, 'removeAnnotationsPins');

      instance['renderAnnotationsPins']();

      expect(spy).toHaveBeenCalled();
      expect(instance['pins'].size).toEqual(0);
    });

    test('should render annotations pins', () => {
      instance['annotations'] = [MOCK_ANNOTATION_HTML];
      instance['pins'].clear();

      instance['renderAnnotationsPins']();

      expect(instance['pins'].size).toEqual(1);
    });

    test('should not render annotation pin if annotation is resolved', () => {
      instance['annotations'] = [
        {
          ...MOCK_ANNOTATION_HTML,
          resolved: true,
        },
      ];
      instance['pins'].clear();

      instance['renderAnnotationsPins']();

      expect(instance['pins'].size).toEqual(0);
    });

    test('should not render annotation pin if pin was not set using html adapter', () => {
      instance['annotations'] = [MOCK_ANNOTATION];
      instance['pins'].clear();

      instance['renderAnnotationsPins']();

      expect(instance['pins'].size).toEqual(0);
    });

    test('should not render annotation pin if element with the elementId of the annotation is not found', () => {
      instance['annotations'] = [
        {
          ...MOCK_ANNOTATION_HTML,
          position: JSON.stringify({
            x: 100,
            y: 100,
            z: null,
            type: 'html',
            elementId: 'not-found',
          }),
        },
      ];
      instance['pins'].clear();

      instance['renderAnnotationsPins']();

      expect(instance['pins'].size).toEqual(0);
    });

    test('should not render annotation pin if wrapper associated with the elementId of the annotation is not found', () => {
      instance['annotations'] = [
        {
          ...MOCK_ANNOTATION_HTML,
          position: JSON.stringify({
            x: 100,
            y: 100,
            z: null,
            type: 'html',
            elementId: '1',
          }),
        },
      ];

      instance['divWrappers'].delete('1');
      instance['pins'].clear();

      instance['renderAnnotationsPins']();

      expect(instance['pins'].size).toEqual(0);
    });

    test('should not render new annotation pin if it already exists', () => {
      instance['annotations'] = [MOCK_ANNOTATION_HTML];
      instance['pins'].clear();

      instance['renderAnnotationsPins']();

      expect(instance['pins'].size).toEqual(1);

      instance['renderAnnotationsPins']();

      expect(instance['pins'].size).toEqual(1);
    });

    test('should not create pin if annotation element id is not found', () => {
      document.body.innerHTML = ``;
    });
  });

  describe('onClick', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.body.querySelector('[data-superviz-id="1"]') as HTMLElement;
      instance['annotations'] = [MOCK_ANNOTATION_HTML];
      instance['pins'].clear();
      instance['setElementReadyToPin'](element, '1');
      instance['renderAnnotationsPins']();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should create temporary pin when mouse clicks canvas', () => {
      instance['onClick']({
        clientX: 100,
        clientY: 100,
        target,
        currentTarget,
      } as unknown as MouseEvent);

      expect(instance['pins'].has('temporary-pin')).toBeTruthy();
    });

    test('should not create a temporary pin if the adapter is not active', () => {
      instance.setActive(false);

      instance['onClick']({
        x: 100,
        y: 100,
        target,
        currentTarget,
      } as unknown as MouseEvent);

      instance.setActive(true);
      expect(instance['pins'].has('temporary-pin')).toBeFalsy();
    });

    test('should remove temporary pin when selecting another pin', () => {
      instance['onClick']({
        clientX: 100,
        clientY: 100,
        target,
        currentTarget,
      } as unknown as MouseEvent);
      expect(instance['pins'].has('temporary-pin')).toBeTruthy();

      instance['annotationSelected'](
        new CustomEvent('select-annotation', {
          detail: {
            uuid: MOCK_ANNOTATION_HTML.uuid,
          },
        }),
      );

      expect(instance['pins'].has('temporary-pin')).toBeFalsy();
    });

    test('should not create a temporary pin if clicking over another pin', () => {
      const pin = instance['pins'].get(MOCK_ANNOTATION_HTML.uuid);
      instance['onClick']({
        clientX: 100,
        clientY: 100,
        target: pin,
        currentTarget,
      } as unknown as MouseEvent);

      expect(instance['pins'].has('temporary-pin')).toBeFalsy();
    });

    test('should not create a temporary pin if distance between mouse down and mouse up is more than 10px', () => {
      instance['onMouseDown']({ x: 100, y: 100 } as unknown as MouseEvent);

      instance['onClick']({
        clientX: 100,
        clientY: 111,
        target,
        currentTarget,
      } as unknown as MouseEvent);

      expect(instance['pins'].has('temporary-pin')).toBeFalsy();
    });
  });

  describe('clearElement', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should remove pins and listeners and set cursor to default on element being cleared', () => {
      instance['prepareElements']();
      instance['annotations'] = [MOCK_ANNOTATION_HTML];
      instance['renderAnnotationsPins']();

      expect(instance['divWrappers'].get('1')).not.toEqual(undefined);

      const wrapper = instance['divWrappers'].get('1') as HTMLElement;

      expect(wrapper.style.cursor).not.toEqual('default');
      expect(instance['pins'].size).toEqual(1);
      expect(Object.keys(instance['elementsWithDataId']).length).toEqual(3);

      const spy = jest.spyOn(instance as any, 'removeElementListeners');
      instance['clearElement']('1');

      expect(spy).toHaveBeenCalled();
      expect(instance['pins'].size).toEqual(0);
      expect(instance['elementsWithDataId']['1']).toEqual(undefined);
      expect(instance['divWrappers'].get('1')).toEqual(undefined);
    });

    test('should not clear element if it is not stored in elementsWithDataId', () => {
      instance['prepareElements']();
      instance['annotations'] = [MOCK_ANNOTATION_HTML];
      instance['renderAnnotationsPins']();

      const wrapper = instance['divWrappers'].get('1') as HTMLElement;

      expect(wrapper.style.cursor).not.toEqual('default');
      expect(instance['pins'].size).toEqual(1);
      expect(Object.keys(instance['elementsWithDataId']).length).toEqual(3);

      const spy = jest.spyOn(instance as any, 'removeElementListeners');
      instance['clearElement']('not-found');

      expect(spy).not.toHaveBeenCalled();
      expect(instance['pins'].size).toEqual(1);
      expect(Object.keys(instance['elementsWithDataId']).length).toEqual(3);
      expect(wrapper.style.cursor).not.toEqual('default');
    });
  });

  describe('resetPins', () => {
    test('should remove active on Escape key', () => {
      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);
      const detail = {
        uuid: MOCK_ANNOTATION_HTML.uuid,
      };

      instance['annotationSelected']({ detail } as unknown as CustomEvent);

      expect(instance['selectedPin']).not.toBeNull();

      instance['resetPins']({ key: 'Escape' } as unknown as KeyboardEvent);

      expect(instance['selectedPin']).toBeNull();
    });

    test('should reset on KeyBoardEvent if the key is Escape', () => {
      instance['onClick']({
        clientX: 100,
        clientY: 100,
        target,
        currentTarget,
      } as unknown as MouseEvent);

      expect(instance['pins'].has('temporary-pin')).toBeTruthy();

      instance['resetPins']({ key: 'Escape' } as unknown as KeyboardEvent);

      expect(instance['pins'].has('temporary-pin')).toBeFalsy();
    });

    test('should not reset on KeyboardEvent if the key is not Escape', () => {
      instance['onClick']({
        clientX: 100,
        clientY: 100,
        target,
        currentTarget,
      } as unknown as MouseEvent);

      expect(instance['pins'].has('temporary-pin')).toBeTruthy();

      instance['resetPins']({ key: 'Enter' } as unknown as KeyboardEvent);

      expect(instance['pins'].has('temporary-pin')).toBeTruthy();
    });

    test('should remove outline from wrapper being hovered when inactive', () => {
      const wrapper = instance['divWrappers'].get('1') as HTMLElement;
      wrapper.style.outline = '1px solid red';
      instance['hoveredWrapper'] = wrapper;

      instance.setActive(false);

      expect(wrapper.style.outline).toEqual('');
    });
  });

  describe('annotationSelected', () => {
    test('should toggle active attribute when click same annotation twice', () => {
      const detail = {
        uuid: MOCK_ANNOTATION_HTML.uuid,
      };

      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);
      instance['annotationSelected']({ detail } as unknown as CustomEvent);

      expect(instance['selectedPin']).not.toBeNull();
      expect(instance['selectedPin']?.hasAttribute('active')).toBeTruthy();

      instance['annotationSelected']({ detail } as unknown as CustomEvent);

      expect(instance['selectedPin']).toBeNull();
    });

    test('should not select annotation pin if it does not exist', () => {
      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);

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

    test('should remove highlight from annotation pin when sidebar is closed', () => {
      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);
      instance['annotationSelected'](
        new CustomEvent('select-annotation', {
          detail: {
            uuid: MOCK_ANNOTATION_HTML.uuid,
          },
        }),
      );

      let pin = instance['pins'].get(MOCK_ANNOTATION_HTML.uuid);

      expect(pin?.hasAttribute('active')).toBeTruthy();

      instance['onToggleAnnotationSidebar'](
        new CustomEvent('toggle-annotation-sidebar', {
          detail: {
            open: false,
          },
        }),
      );

      pin = instance['pins'].get(MOCK_ANNOTATION_HTML.uuid);

      expect(pin?.hasAttribute('active')).toBeFalsy();
    });

    test('should not remove highlight from annotation pin when sibar is opened', () => {
      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);
      instance['annotationSelected'](
        new CustomEvent('select-annotation', {
          detail: {
            uuid: MOCK_ANNOTATION_HTML.uuid,
          },
        }),
      );

      let pin = instance['pins'].get(MOCK_ANNOTATION_HTML.uuid);

      expect(pin?.hasAttribute('active')).toBeTruthy();

      instance['onToggleAnnotationSidebar'](
        new CustomEvent('toggle-annotation-sidebar', {
          detail: {
            open: true,
          },
        }),
      );

      pin = instance['pins'].get(MOCK_ANNOTATION_HTML.uuid);

      expect(pin?.hasAttribute('active')).toBeTruthy();
    });
  });

  describe('removeAnnotationPin', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should remove annotation pin', () => {
      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);

      expect(instance['pins'].size).toEqual(1);

      instance.removeAnnotationPin(MOCK_ANNOTATION_HTML.uuid);

      expect(instance['pins'].size).toEqual(0);
    });

    test('should not remove annotation pin if it does not exist', () => {
      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);

      expect(instance['pins'].size).toEqual(1);

      instance.removeAnnotationPin('not_found_uuid');

      expect(instance['pins'].size).toEqual(1);
    });
  });

  describe('updateAnnotations', () => {
    test('should not render annotations if visibility is false', () => {
      instance.setPinsVisibility(false);

      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);

      expect(instance['pins'].size).toEqual(0);
    });

    test('should remove pins when visibility is false', () => {
      instance.setPinsVisibility(true);

      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);

      expect(instance['pins'].size).toEqual(1);

      instance.setPinsVisibility(false);

      expect(instance['pins'].size).toEqual(0);
    });

    test('should not render annotation if the coordinate type is not canvas', () => {
      instance.updateAnnotations([
        {
          ...MOCK_ANNOTATION_HTML,
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

    test('should remove annotation pin when it is resolved', () => {
      const annotation = {
        ...MOCK_ANNOTATION_HTML,
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
      instance.updateAnnotations([MOCK_ANNOTATION_HTML]);

      expect(instance['pins'].size).toEqual(1);

      instance['container'].style.display = 'none';

      instance.updateAnnotations([]);

      expect(instance['pins'].size).toEqual(0);
    });
  });

  describe('onMouseDown', () => {
    test('should update mouse coordinates on mousedown event', () => {
      instance['onMouseDown']({ x: 351, y: 153 } as unknown as MouseEvent);
      expect(instance['mouseDownCoordinates']).toEqual({ x: 351, y: 153 });
    });
  });

  describe('renderTemporaryPin', () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });

    test('should remove previous temporary pin when rendering temporary pin over another element', () => {
      instance['onClick']({
        clientX: 100,
        clientY: 100,
        target,
        currentTarget,
      } as unknown as MouseEvent);

      expect(instance['pins'].has('temporary-pin')).toBeTruthy();
      expect(instance['temporaryPinCoordinates'].elementId).toBe(
        currentTarget.getAttribute('data-wrapper-id'),
      );

      const deleteSpy = jest.spyOn(instance['pins'], 'delete');

      instance['onClick']({
        clientX: 100,
        clientY: 100,
        target: document.body.querySelector('[data-wrapper-id="2"]') as HTMLElement,
        currentTarget: document.body.querySelector('[data-wrapper-id="2"]') as HTMLElement,
      } as unknown as MouseEvent);

      expect(deleteSpy).toHaveBeenCalled();
      expect(instance['pins'].has('temporary-pin')).toBeTruthy();
      expect(instance['temporaryPinCoordinates'].elementId).toBe('2');
    });
  });

  describe('setElementReadyToPin', () => {
    beforeEach(() => {
      instance['divWrappers'].get('1')!.style.cursor = 'default';
    });

    afterEach(() => {
      jest.restoreAllMocks();
      instance['divWrappers'].clear();
    });

    test('should change cursor and add event listeners', () => {
      const element = document.body.querySelector('[data-superviz-id="1"]') as HTMLElement;
      const wrapper = instance['divWrappers'].get('1') as HTMLElement;
      const spy = jest.spyOn(instance as any, 'addElementListeners');
      delete instance['elementsWithDataId']['1'];
      instance['setElementReadyToPin'](element, '1');

      expect(wrapper.style.cursor).not.toEqual('default');
      expect(spy).toHaveBeenCalled();
    });

    test('should not change cursor and add event listeners if comments are not active', () => {
      const element = document.body.querySelector('[data-superviz-id="1"]') as HTMLElement;
      const wrapper = instance['divWrappers'].get('1') as HTMLElement;
      const spy = jest.spyOn(instance as any, 'addElementListeners');
      instance.setActive(false);
      delete instance['elementsWithDataId']['1'];
      instance['setElementReadyToPin'](element, '1');

      expect(wrapper.style.cursor).toEqual('default');
      expect(spy).not.toHaveBeenCalled();
    });

    test('should not change cursor and add event listeners if pins are not visible', () => {
      const element = document.body.querySelector('[data-superviz-id="1"]') as HTMLElement;
      const wrapper = instance['divWrappers'].get('1') as HTMLElement;
      const spy = jest.spyOn(instance as any, 'addElementListeners');

      instance.setPinsVisibility(false);
      delete instance['elementsWithDataId']['1'];
      instance['setElementReadyToPin'](element, '1');

      expect(wrapper.style.cursor).toEqual('default');
      expect(spy).not.toHaveBeenCalled();
    });

    test('should create new divWrapper if divWrapper not found', () => {
      const element = document.body.querySelector('[data-superviz-id="1"]') as HTMLElement;
      const spySet = jest.spyOn(instance['divWrappers'], 'set');
      const spyCreate = jest.spyOn(instance as any, 'createWrapper');

      instance['divWrappers'].clear();

      delete instance['elementsWithDataId']['1'];

      instance['setElementReadyToPin'](element, '1');

      expect(spyCreate).toHaveBeenCalled();
      expect(spySet).toHaveBeenCalled();
    });
  });

  describe('addTemporaryPinToElement', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should add temporary pin to element', () => {
      const element = document.body.querySelector('[data-superviz-id="1"]') as HTMLElement;
      const pin = document.createElement('div');
      pin.id = 'temp-pin';

      instance['addTemporaryPinToElement']('1', pin);

      const wrapper = instance['divWrappers'].get('1') as HTMLElement;
      expect(element.firstElementChild).toBe(wrapper);
      expect(wrapper.firstElementChild).toBe(pin);
    });

    test('should not add temporary pin to element if element is not found', () => {
      const pin = document.createElement('div');
      pin.id = 'temp-pin';

      instance['addTemporaryPinToElement']('not-found', pin);

      expect(instance['divWrappers'].get('1')?.querySelector('#temp-pin')).toBe(null);
    });

    test('should not add temporary pin to element if wrapper is not found', () => {
      const pin = document.createElement('div');
      pin.id = 'temp-pin';

      instance['divWrappers'].delete('1');
      instance['addTemporaryPinToElement']('1', pin);

      expect(document.getElementById('temp-pin')).toBe(null);
    });
  });

  describe('createWrapper', () => {
    test('should create a new wrapper', () => {
      const element = document.body.querySelector('[data-superviz-id="1"]') as HTMLElement;

      instance['divWrappers'].clear();
      const wrapper = instance['createWrapper'](element, '1');

      expect(wrapper).toBeInstanceOf(HTMLDivElement);
      expect(wrapper.style.position).toEqual('absolute');
      expect(wrapper.style.top).toEqual('0px');
      expect(wrapper.style.left).toEqual('0px');
      expect(wrapper.style.width).toEqual('100%');
      expect(wrapper.style.height).toEqual('100%');
      expect(wrapper.style.pointerEvents).toEqual('none');
      expect(wrapper.style.cursor).toEqual('default');
      expect(wrapper.getAttribute('data-wrapper-id')).toEqual('1');
      expect(wrapper.id).toEqual('superviz-id-1');
    });

    test('should not create a new wrapper if wrapper already exists', () => {
      const element = document.body.querySelector('[data-superviz-id="1"]') as HTMLElement;

      instance['divWrappers'].clear();

      const wrapper1 = instance['createWrapper'](element, '1');
      instance['divWrappers'].set('1', wrapper1);

      const wrapper2 = instance['createWrapper'](element, '1');

      expect(wrapper1).toBeInstanceOf(HTMLDivElement);
      expect(wrapper2).toBe(undefined);
    });

    test('should create wrapper as sibling of the element if element is a void element', () => {
      document.body.innerHTML = '<img data-superviz-id="1" />';
      const element = document.querySelector('img') as HTMLElement;

      instance['divWrappers'].clear();
      instance['elementsWithDataId']['1'] = element;

      const wrapper = instance['createWrapper'](element, '1');

      const containerRect = element.getBoundingClientRect();

      expect(wrapper.parentElement).toEqual(element.parentElement);
      expect(wrapper.style.position).toEqual('fixed');
      expect(wrapper.style.top).toEqual(`${containerRect.top}px`);
      expect(wrapper.style.left).toEqual(`${containerRect.left}px`);
      expect(wrapper.style.width).toEqual(`${containerRect.width}px`);
      expect(wrapper.style.height).toEqual(`${containerRect.height}px`);

      expect(instance['voidElementsWrappers'].get('1')).toEqual(wrapper);
    });

    test('should append wrapper of void element to body if element parent is not found', () => {
      document.body.innerHTML = '';
      const element = document.createElement('img') as HTMLElement;
      element.setAttribute('data-superviz-id', '1');

      jest.spyOn(instance as any, 'setPositionNotStatic').mockImplementation(() => {});

      instance['divWrappers'].clear();
      instance['elementsWithDataId']['1'] = element;

      const wrapper = instance['createWrapper'](element, '1');

      expect(wrapper.parentElement).toEqual(document.body);
    });
  });

  describe('handleMutationObserverChanges', () => {
    let setElementsSpy: jest.SpyInstance;
    let renderAnnotationsSpy: jest.SpyInstance;
    let clearElementSpy: jest.SpyInstance;
    let removeAnnotationSpy: jest.SpyInstance;

    beforeEach(() => {
      setElementsSpy = jest.spyOn(instance as any, 'setElementReadyToPin');
      renderAnnotationsSpy = jest.spyOn(instance as any, 'renderAnnotationsPins');
      clearElementSpy = jest.spyOn(instance as any, 'clearElement');
      removeAnnotationSpy = jest.spyOn(instance as any, 'removeAnnotationPin');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should set elements and update pins when a new element with the specified attribute appears', () => {
      const change = {
        target: document.body.querySelector('[data-superviz-id="1"]') as HTMLElement,
        oldValue: null,
      } as unknown as MutationRecord;

      instance['handleMutationObserverChanges']([change]);

      expect(setElementsSpy).toHaveBeenCalled();
      expect(renderAnnotationsSpy).toHaveBeenCalled();
      expect(clearElementSpy).not.toHaveBeenCalled();
      expect(removeAnnotationSpy).not.toHaveBeenCalled();
    });

    test('should clear elements and remove pins if the attribute is removed from the element', () => {
      const change = {
        target: document.createElement('div') as HTMLElement,
        oldValue: '1',
      } as unknown as MutationRecord;

      instance['handleMutationObserverChanges']([change]);

      expect(clearElementSpy).toHaveBeenCalled();
      expect(removeAnnotationSpy).toHaveBeenCalled();
      expect(renderAnnotationsSpy).not.toHaveBeenCalled();
      expect(setElementsSpy).not.toHaveBeenCalled();
    });

    test('should unselect pin if the attribute is removed from the element', () => {
      const change = {
        target: document.createElement('div') as HTMLElement,
        oldValue: '1',
      } as unknown as MutationRecord;

      const selectedPin = document.createElement('div');
      selectedPin.setAttribute('elementId', '1');
      instance['selectedPin'] = selectedPin;

      const spy = jest.spyOn(document.body, 'dispatchEvent');
      instance['handleMutationObserverChanges']([change]);

      expect(spy).toHaveBeenCalledWith(new CustomEvent('select-annotation'));
    });

    test('should clear element if the attribute changes, but still exists', () => {
      const change = {
        target: document.body.querySelector('[data-superviz-id="1"]') as HTMLElement,
        oldValue: '2',
      } as unknown as MutationRecord;

      instance['handleMutationObserverChanges']([change]);

      expect(clearElementSpy).toHaveBeenCalled();
      expect(renderAnnotationsSpy).toHaveBeenCalled();
      expect(setElementsSpy).toHaveBeenCalled();
      expect(removeAnnotationSpy).not.toHaveBeenCalled();
    });

    test('should do nothing if there is not new nor old value to the attribute', () => {
      const target = document.createElement('div') as HTMLElement;
      target.setAttribute('data-superviz-id', '');
      const change = {
        target,
        oldValue: null,
      } as unknown as MutationRecord;

      instance['handleMutationObserverChanges']([change]);

      expect(clearElementSpy).not.toHaveBeenCalled();
      expect(removeAnnotationSpy).not.toHaveBeenCalled();
      expect(renderAnnotationsSpy).not.toHaveBeenCalled();
      expect(setElementsSpy).not.toHaveBeenCalled();
    });

    test('should do nothing if the new value is the same as the old attribute value', () => {
      const change = {
        target: document.body.querySelector('[data-superviz-id="1"]') as HTMLElement,
        oldValue: '1',
      } as unknown as MutationRecord;

      instance['handleMutationObserverChanges']([change]);

      expect(clearElementSpy).not.toHaveBeenCalled();
      expect(removeAnnotationSpy).not.toHaveBeenCalled();
      expect(renderAnnotationsSpy).not.toHaveBeenCalled();
      expect(setElementsSpy).not.toHaveBeenCalled();
    });

    test('should clear element then do nothing if new value is filtered', () => {
      document.body.innerHTML =
        '<div id="container"><div data-superviz-id="1-matches";"><div><div data-superviz-id="does-not-match"></div></div>';
      instance = new HTMLPin('container', { dataAttributeValueFilters: [/.*-matches$/] });
      const change = {
        target: document.body.querySelector('[data-superviz-id="1-matches"]') as HTMLElement,
        oldValue: '2',
      } as unknown as MutationRecord;

      setElementsSpy = jest.spyOn(instance as any, 'setElementReadyToPin');
      renderAnnotationsSpy = jest.spyOn(instance as any, 'renderAnnotationsPins');
      clearElementSpy = jest.spyOn(instance as any, 'clearElement');
      removeAnnotationSpy = jest.spyOn(instance as any, 'removeAnnotationPin');

      instance['handleMutationObserverChanges']([change]);

      expect(clearElementSpy).toHaveBeenCalled();
      expect(renderAnnotationsSpy).not.toHaveBeenCalled();
      expect(setElementsSpy).not.toHaveBeenCalled();
      expect(removeAnnotationSpy).not.toHaveBeenCalled();
    });

    test('should not clear element if old value was skipped', () => {
      document.body.innerHTML = `<div id="container">
          <div data-superviz-id="1-matches">
            <div>
              <div data-superviz-id="does-not-match"></div>
            </div>
          </div>
        </div>`;
      instance = new HTMLPin('container', { dataAttributeValueFilters: [/.*-matches$/] });
      const change = {
        target: document.body.querySelector('[data-superviz-id="does-not-match"]') as HTMLElement,
        oldValue: '1-matches',
      } as unknown as MutationRecord;

      setElementsSpy = jest.spyOn(instance as any, 'setElementReadyToPin');
      renderAnnotationsSpy = jest.spyOn(instance as any, 'renderAnnotationsPins');
      clearElementSpy = jest.spyOn(instance as any, 'clearElement');
      removeAnnotationSpy = jest.spyOn(instance as any, 'removeAnnotationPin');

      instance['handleMutationObserverChanges']([change]);

      expect(clearElementSpy).not.toHaveBeenCalled();
      expect(renderAnnotationsSpy).toHaveBeenCalled();
      expect(setElementsSpy).toHaveBeenCalled();
      expect(removeAnnotationSpy).not.toHaveBeenCalled();
    });
  });

  describe('onToggleAnnotationSidebar', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should remove active attribute from selected pin if sidebar is closed', () => {
      const spy = jest.spyOn(instance as any, 'resetSelectedPin');
      instance['onToggleAnnotationSidebar']({ detail: { open: false } } as unknown as CustomEvent);
      expect(spy).toHaveBeenCalled();
    });

    test('should not remove active attribute from selected pin if sidebar is opened', () => {
      const spy = jest.spyOn(instance as any, 'resetSelectedPin');
      instance['onToggleAnnotationSidebar']({ detail: { open: true } } as unknown as CustomEvent);
      expect(spy).not.toHaveBeenCalled();
    });

    test('should remove temporary pin if sidebar is closed', () => {
      const spy = jest.spyOn(instance as any, 'removeAnnotationPin');
      instance['onClick']({
        clientX: 100,
        clientY: 100,
        target,
        currentTarget,
      } as unknown as MouseEvent);

      expect(instance['pins'].has('temporary-pin')).toBeTruthy();

      instance['onToggleAnnotationSidebar']({ detail: { open: false } } as unknown as CustomEvent);

      expect(spy).toHaveBeenCalledWith('temporary-pin');
    });
  });

  describe('animate', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });
    test('should update pins positions', () => {
      const spy = jest.spyOn(instance as any, 'updatePinsPositions');
      window.requestAnimationFrame = jest.fn();
      instance['animate']();
      expect(spy).toHaveBeenCalled();
      expect(window.requestAnimationFrame).toHaveBeenCalledWith(instance['animate']);
    });
  });

  describe('updatePinsPositions', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div><img src="#" data-superviz-id="image-id"/></div>';
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should update position of all wrappers of void elements', () => {
      const div = document.body.querySelector('div') as HTMLDivElement;
      const image = document.body.querySelector('img') as HTMLImageElement;

      instance['container'] = div as HTMLElement;
      instance['prepareElements']();

      image.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 40,
        top: 30,
        width: 50,
        height: 60,
      });

      const wrapper = instance['divWrappers'].get('image-id') as HTMLElement;
      const spy = jest.spyOn(wrapper.style, 'setProperty');

      instance['updatePinsPositions']();

      expect(spy).toHaveBeenNthCalledWith(1, 'top', '30px');
      expect(spy).toHaveBeenNthCalledWith(2, 'left', '40px');
      expect(spy).toHaveBeenNthCalledWith(3, 'width', '50px');
      expect(spy).toHaveBeenNthCalledWith(4, 'height', '60px');
    });

    test('should not update if positions are the same', () => {
      const div = document.body.querySelector('div') as HTMLDivElement;
      const image = document.body.querySelector('img') as HTMLImageElement;

      instance['container'] = div as HTMLElement;
      instance['prepareElements']();

      image.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 40,
        top: 30,
        width: 50,
        height: 60,
      });

      const wrapper = instance['divWrappers'].get('image-id') as HTMLElement;

      wrapper.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 40,
        top: 30,
        width: 50,
        height: 60,
      });

      const spy = jest.spyOn(wrapper.style, 'setProperty');

      instance['updatePinsPositions']();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('setPositionNotStatic', () => {
    test('should set element position to relative if it is static', () => {
      const element = document.createElement('div');

      element.style.position = 'static';

      instance['setPositionNotStatic'](element);

      expect(element.style.position).toEqual('relative');
    });

    test('should do nothing if element position is not static', () => {
      const element = document.createElement('div');

      element.style.position = 'absolute';

      instance['setPositionNotStatic'](element);

      expect(element.style.position).toEqual('absolute');
    });
  });

  describe('prepareElements', () => {
    test('should not prepare element if data attribute value matches filter', () => {
      document.body.innerHTML =
        '<div id="container"><div data-superviz-id="1-matches";"><div><div data-superviz-id="does-not-match"></div></div>';
      const container = document.getElementById('container') as HTMLElement;

      instance = new HTMLPin('container', { dataAttributeValueFilters: [/.*-matches$/] });
      const spy = jest.spyOn(instance as any, 'setElementReadyToPin');

      instance['container'] = container;
      instance['prepareElements']();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleSvgElement', () => {
    test('should return undefined if element is a normal HTML element', () => {
      const element = document.createElement('div');
      const wrapper = document.createElement('div');

      const result = instance['handleSvgElement'](element, wrapper);

      expect(result).toBeUndefined();
    });

    test('should return undefined if element is a SVG element but not an ellipse or rectangle', () => {
      const wrapper = document.createElement('div');

      const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');

      element.appendChild(image);
      document.body.appendChild(element);

      const result = instance['handleSvgElement'](image, wrapper);

      expect(result).toBeUndefined();
    });

    test('should append foreignObject with wrapper inside if element is a <svg /> element', () => {
      const wrapper = document.createElement('div');
      wrapper.id = 'wrapper';
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      const result = instance['handleSvgElement'](element, wrapper);

      expect(result).toBe(wrapper);
      const foreignObject = element.querySelector('foreignObject');

      expect(foreignObject).toBeDefined();

      const foreignObjectWrapper = foreignObject?.querySelector('#wrapper');
      expect(foreignObjectWrapper).toBe(wrapper);
    });

    test('should append svg to the wrapper with ellipse in a equal position of the element if element is a <ellipse /> element', () => {
      const wrapper = document.createElement('div');
      wrapper.id = 'wrapper';
      const container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      container.appendChild(element);

      element.setAttribute('cx', '100');
      element.setAttribute('cy', '100');
      element.setAttribute('rx', '50');
      element.setAttribute('ry', '50');

      const result = instance['handleSvgElement'](element, wrapper);

      expect(result).toBe(wrapper);
      const svg = wrapper.querySelector('svg');
      const svgElement = svg?.querySelector('ellipse');

      expect(svg).toBeDefined();
      expect(svgElement).toBeDefined();
      expect(svgElement?.getAttribute('cx')).toEqual('100');
      expect(svgElement?.getAttribute('cy')).toEqual('100');
      expect(svgElement?.getAttribute('rx')).toEqual('50');
      expect(svgElement?.getAttribute('ry')).toEqual('50');
    });

    test('should append svg to the wrapper with rect in a equal position of the element if element is a <rect /> element', () => {
      const wrapper = document.createElement('div');
      wrapper.id = 'wrapper';
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element.setAttribute('x', '100');
      element.setAttribute('y', '100');
      element.setAttribute('width', '50');
      element.setAttribute('height', '50');
      element.setAttribute('rx', '5');
      element.setAttribute('ry', '5');

      const result = instance['handleSvgElement'](element, wrapper);

      expect(result).toBe(wrapper);
      const svg = wrapper.querySelector('svg');
      const svgElement = svg?.querySelector('rect');

      expect(svg).toBeDefined();
      expect(svgElement).toBeDefined();
      expect(svgElement?.getAttribute('x')).toEqual('0');
      expect(svgElement?.getAttribute('y')).toEqual('0');
      expect(svgElement?.getAttribute('rx')).toEqual('5');
      expect(svgElement?.getAttribute('ry')).toEqual('5');
    });
  });

  describe('onMouseEnter', () => {
    test('should add an outline to the wrapper', () => {
      const target = document.createElement('div');
      instance['onMouseEnter']({ target } as unknown as MouseEvent);
      expect(target.style.outline).toEqual('1px solid rgb(var(--sv-primary))');
    });

    test('should add stroke if element is an ellipse', () => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('data-wrapper-type', 'svg-ellipse');
      svg.appendChild(ellipse);
      instance['onMouseEnter']({ target: svg } as unknown as MouseEvent);
      expect(ellipse.getAttribute('stroke')).toEqual('rgb(var(--sv-primary))');
      expect(ellipse.getAttribute('stroke-width')).toEqual('1');
    });
  });

  describe('onMouseLeave', () => {
    test('should remove the outline from the wrapper', () => {
      const target = document.createElement('div');
      target.style.outline = '1px solid rgb(var(--sv-primary))';
      instance['onMouseLeave']({ target } as unknown as MouseEvent);
      expect(target.style.outline).toEqual('');
    });

    test('should remove stroke if element is an ellipse', () => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('stroke', 'red');
      ellipse.setAttribute('stroke-width', '1');

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('data-wrapper-type', 'svg-ellipse');
      svg.appendChild(ellipse);
      instance['onMouseLeave']({ target: svg } as unknown as MouseEvent);
      expect(ellipse.getAttribute('stroke')).toBeFalsy();
      expect(ellipse.getAttribute('stroke-width')).toBeFalsy();
    });
  });
});
