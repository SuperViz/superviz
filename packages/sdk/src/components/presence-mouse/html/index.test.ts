import { MOCK_CONFIG } from '../../../../__mocks__/config.mock';
import { EVENT_BUS_MOCK } from '../../../../__mocks__/event-bus.mock';
import { MOCK_LOCAL_PARTICIPANT } from '../../../../__mocks__/participants.mock';
import { useStore } from '../../../common/utils/use-store';
import { IOC } from '../../../services/io';
import { Presence3DManager } from '../../../services/presence-3d-manager';
import { ParticipantMouse } from '../types';

import { PointersHTML } from '.';
import { LIMITS_MOCK } from '../../../../__mocks__/limits.mock';

const createMousePointers = (id: string = 'html'): PointersHTML => {
  const presenceMouseComponent = new PointersHTML(id);
  presenceMouseComponent['localParticipant'] = MOCK_LOCAL_PARTICIPANT;

  presenceMouseComponent.attach({
    ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
    config: MOCK_CONFIG,
    Presence3DManagerService: Presence3DManager,
    eventBus: EVENT_BUS_MOCK,
    connectionLimit: LIMITS_MOCK.presence.maxParticipants,
    useStore,
  });

  return presenceMouseComponent;
};

describe('MousePointers on HTML', () => {
  let presenceMouseComponent: PointersHTML;
  const participants: Record<string, ParticipantMouse> = {};
  let MOCK_MOUSE: ParticipantMouse;

  beforeEach(() => {
    document.body.innerHTML = `<div><div id="html"></div></div>`;

    MOCK_MOUSE = {
      ...MOCK_LOCAL_PARTICIPANT,
      x: 30,
      y: 30,
      slot: {
        index: 7,
        color: '#304AFF',
        textColor: '#fff',
        colorName: 'bluedark',
        timestamp: 1710448079918,
      },
      visible: true,
      camera: {
        x: 0,
        y: 0,
        scale: 1,
        screen: {
          width: 1920,
          height: 1080,
        },
      },
    };

    const participant1 = { ...MOCK_MOUSE };
    const participant2 = { ...MOCK_MOUSE };
    const participant3 = { ...MOCK_MOUSE };
    participant2.id = 'unit-test-participant2-id';
    participant3.id = 'unit-test-participant3-id';

    participants[participant1.id] = { ...participant1 };
    participants[participant2.id] = { ...participant2 };
    participants[participant3.id] = { ...participant3 };

    presenceMouseComponent = createMousePointers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should throw an error if no container is found', () => {
      expect(() => createMousePointers('not-found-container')).toThrowError(
        'Element with id not-found-container not found',
      );
    });

    test('should set different properties', () => {
      createMousePointers();

      expect(presenceMouseComponent['container']).toEqual(document.getElementById('html'));
      expect(presenceMouseComponent['name']).toEqual('presence');
    });
  });

  describe('start', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test('should call renderWrapper', () => {
      const renderWrapperSpy = jest.spyOn(presenceMouseComponent as any, 'renderWrapper');

      presenceMouseComponent['start']();

      expect(renderWrapperSpy).toHaveBeenCalled();
    });

    test('should call addListeners', () => {
      const addListenersSpy = jest.spyOn(presenceMouseComponent as any, 'addListeners');
      presenceMouseComponent['start']();

      expect(addListenersSpy).toHaveBeenCalled();
    });

    test('should call subscribeToRealtimeEvents', () => {
      const subscribeToRealtimeEventsSpy = jest.spyOn(
        presenceMouseComponent as any,
        'subscribeToRealtimeEvents',
      );
      presenceMouseComponent['start']();

      expect(subscribeToRealtimeEventsSpy).toHaveBeenCalled();
    });

    test('should call eventBus.subscribe', () => {
      const subscribeSpy = jest.spyOn(presenceMouseComponent['eventBus'] as any, 'subscribe');
      presenceMouseComponent['start']();

      expect(subscribeSpy).toHaveBeenCalledTimes(3);
    });

    test('should call requestAnimationFrame', () => {
      const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame');
      presenceMouseComponent['start']();

      expect(requestAnimationFrameSpy).toHaveBeenCalledWith(expect.any(Function));
    });

    describe('destroy', () => {
      beforeEach(() => {
        presenceMouseComponent['start']();
      });

      test('should call cancelAnimationFrame', () => {
        const cancelAnimationFrameSpy = jest.spyOn(window, 'cancelAnimationFrame');
        presenceMouseComponent['destroy']();

        expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(
          presenceMouseComponent['animationFrame'],
        );
      });

      test('should remove wrapper from the DOM', () => {
        const wrapperSpy = jest.spyOn(presenceMouseComponent['wrapper'] as any, 'remove');

        presenceMouseComponent['destroy']();

        expect(wrapperSpy).toHaveBeenCalled();
      });

      test('should call removeListeners', () => {
        const removeListeners = jest.spyOn(presenceMouseComponent as any, 'removeListeners');

        presenceMouseComponent['destroy']();

        expect(removeListeners).toHaveBeenCalled();
      });

      test('should call unsubscribeFromRealtimeEvents', () => {
        const unsubscribeFromRealtimeEventsSpy = jest.spyOn(
          presenceMouseComponent as any,
          'unsubscribeFromRealtimeEvents',
        );
        presenceMouseComponent['destroy']();

        expect(unsubscribeFromRealtimeEventsSpy).toHaveBeenCalled();
      });

      test('should call eventBus.unsubscribe', () => {
        const unsubscribeSpy = jest.spyOn(presenceMouseComponent['eventBus'] as any, 'unsubscribe');
        presenceMouseComponent['destroy']();

        expect(unsubscribeSpy).toHaveBeenCalledTimes(3);
      });

      test('should avoid memory leaks', () => {
        presenceMouseComponent['destroy']();

        expect(presenceMouseComponent['logger']).toBeUndefined();
        expect(presenceMouseComponent['presences']).toBeUndefined();
        expect(presenceMouseComponent['wrapper']).toBeUndefined();
        expect(presenceMouseComponent['container']).toBeUndefined();
      });
    });
  });

  describe('renderWrapper', () => {
    test('should call renderElementWrapper', () => {
      const renderElementWrapperSpy = jest.spyOn(
        presenceMouseComponent as any,
        'renderElementWrapper',
      );

      presenceMouseComponent['renderWrapper']();

      expect(renderElementWrapperSpy).toHaveBeenCalled();
    });

    test('should do nothing if wrapper already exists', () => {
      const renderElementWrapperSpy = jest.spyOn(
        presenceMouseComponent as any,
        'renderElementWrapper',
      );

      const element = document.createElement('div');

      presenceMouseComponent['wrapper'] = element;

      presenceMouseComponent['renderWrapper']();

      expect(renderElementWrapperSpy).not.toHaveBeenCalled();
    });
  });

  describe('addWrapperListeners', () => {
    test('should add event listeners to the container', () => {
      const addEventListenerSpy = jest.spyOn(
        presenceMouseComponent['container'],
        'addEventListener',
      );

      presenceMouseComponent['addListeners']();

      expect(addEventListenerSpy).toHaveBeenCalledWith('pointerleave', expect.any(Function));
    });
  });

  describe('removeWrapperListeners', () => {
    test('should remove event listeners from the container', () => {
      const removeEventListenerSpy = jest.spyOn(
        presenceMouseComponent['container'],
        'removeEventListener',
      );

      presenceMouseComponent['removeListeners']();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerleave', expect.any(Function));
    });
  });

  describe('renderVoidElementWrapper', () => {
    test('should create a wrapper and append it to the parent', () => {
      document.body.innerHTML = `<div><img id="void-element" style="height: 100px; width: 100px;"></div>`;
      presenceMouseComponent = createMousePointers('void-element');

      presenceMouseComponent['container'].getBoundingClientRect = () =>
        ({
          left: 20,
          top: 30,
          width: 100,
          height: 100,
        } as any);

      presenceMouseComponent['start']();

      const elementWrapper = presenceMouseComponent['wrapper'];

      expect(elementWrapper).toBeTruthy();
      expect(elementWrapper.style.position).toEqual('absolute');
      expect(elementWrapper.style.width).toEqual('100px');
      expect(elementWrapper.style.height).toEqual('100px');
      expect(elementWrapper.style.top).toEqual('30px');
      expect(elementWrapper.style.left).toEqual('20px');
      expect(elementWrapper.style.overflow).toEqual('visible');
      expect(elementWrapper.style.pointerEvents).toEqual('none');
    });
  });

  describe('renderSVGElementWrapper', () => {
    beforeEach(() => {
      presenceMouseComponent = createMousePointers();
      presenceMouseComponent['start']();
    });

    test('should create a wrapper for a rect element and append it to the parent', () => {
      document.body.innerHTML = '<svg id="svg"><rect id="rect"></rect></svg>';

      presenceMouseComponent = createMousePointers('rect');
      presenceMouseComponent['container'].getBoundingClientRect = () =>
        ({
          left: 20,
          top: 30,
          width: 100,
          height: 100,
        } as unknown as DOMRect);

      presenceMouseComponent['start']();

      const wrapper = document.body.querySelector('#superviz-rect-wrapper') as SVGRectElement;

      expect(wrapper).toBeTruthy();
      expect(presenceMouseComponent['wrapper']).toEqual(wrapper);

      expect(wrapper.style.position).toEqual('fixed');
      expect(wrapper.style.width).toEqual('100px');
      expect(wrapper.style.height).toEqual('100px');
      expect(wrapper.style.top).toEqual('30px');
      expect(wrapper.style.left).toEqual('20px');
      expect(wrapper.style.overflow).toEqual('visible');
      expect(wrapper.style.pointerEvents).toEqual('none');

      expect(wrapper.querySelector('svg')).toBeDefined();
    });

    test('should create a wrapper for a ellipse element and append it to the parent', () => {
      document.body.innerHTML = `<svg id="svg"><ellipse id="ellipse"></ellipse></svg>`;

      presenceMouseComponent = createMousePointers('ellipse');
      presenceMouseComponent['container'].getBoundingClientRect = () =>
        ({
          left: 20,
          top: 30,
          width: 100,
          height: 100,
        } as unknown as DOMRect);

      presenceMouseComponent['start']();

      const wrapper = document.body.querySelector('#superviz-ellipse-wrapper') as SVGRectElement;

      expect(wrapper).toBeTruthy();
      expect(presenceMouseComponent['wrapper']).toEqual(wrapper);

      expect(wrapper.style.position).toEqual('fixed');
      expect(wrapper.style.width).toEqual('100px');
      expect(wrapper.style.height).toEqual('100px');
      expect(wrapper.style.top).toEqual('30px');
      expect(wrapper.style.left).toEqual('20px');
      expect(wrapper.style.overflow).toEqual('visible');
      expect(wrapper.style.pointerEvents).toEqual('none');

      expect(wrapper.querySelector('svg')).toBeDefined();
    });

    test('should create a wrapper for a svg element and append it to the parent', () => {
      document.body.innerHTML = `<svg id="svg"></svg>`;
      presenceMouseComponent = createMousePointers('svg');
      presenceMouseComponent['container'].getBoundingClientRect = () =>
        ({
          left: 20,
          top: 30,
          width: 100,
          height: 100,
        } as unknown as DOMRect);

      presenceMouseComponent['start']();

      const wrapper = document.body.querySelector('#superviz-svg-wrapper') as SVGRectElement;

      expect(wrapper).toBeTruthy();
      expect(presenceMouseComponent['wrapper']).toEqual(wrapper);

      expect(wrapper.style.position).toEqual('fixed');
      expect(wrapper.style.width).toEqual('100px');
      expect(wrapper.style.height).toEqual('100px');
      expect(wrapper.style.top).toEqual('30px');
      expect(wrapper.style.left).toEqual('20px');
      expect(wrapper.style.overflow).toEqual('visible');
      expect(wrapper.style.pointerEvents).toEqual('none');

      expect(wrapper.querySelector('svg')).toBeDefined();
    });
  });

  describe('renderElementWrapper', () => {
    beforeEach(() => {
      document.body.innerHTML = `<div><div id="regular-element"></div></div>`;
    });

    test('should create a wrapper and append it to the parent', () => {
      createMousePointers('regular-element');

      presenceMouseComponent.attach({
        config: MOCK_CONFIG,
        eventBus: EVENT_BUS_MOCK,
        ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
        Presence3DManagerService: Presence3DManager,
        connectionLimit: LIMITS_MOCK.presence.maxParticipants,
        useStore,
      });

      presenceMouseComponent['start']();

      const elementWrapper = presenceMouseComponent['wrapper'];

      expect(elementWrapper).toBeTruthy();
      expect(elementWrapper.style.position).toEqual('absolute');
      expect(elementWrapper.style.width).toEqual('100%');
      expect(elementWrapper.style.height).toEqual('100%');
      expect(elementWrapper.style.top).toEqual('0px');
      expect(elementWrapper.style.left).toEqual('0px');
      expect(elementWrapper.style.overflow).toEqual('visible');
    });
  });

  describe('onMyParticipantMouseMove', () => {
    beforeEach(() => {
      document.body.innerHTML = `<div><div id="html"><div style="width: 100px; height: 100px;"></div></div></div>`;
      presenceMouseComponent = createMousePointers();
    });

    test('should call room.presence.update', () => {
      const updatePresenceMouseSpy = jest.spyOn(
        presenceMouseComponent['room']['presence'],
        'update',
      );

      presenceMouseComponent['transform']({ translate: { x: 10, y: 10 }, scale: 1 });

      const event = {
        currentTarget: {
          getBoundingClientRect() {
            return {
              left: 10,
              top: 10,
            };
          },
        },
        x: 50,
        y: 50,
      } as unknown as MouseEvent;

      presenceMouseComponent['onMyParticipantMouseMove'](event);

      expect(updatePresenceMouseSpy).toHaveBeenCalledWith({
        ...MOCK_LOCAL_PARTICIPANT,
        x: 30,
        y: 30,
        visible: true,
        camera: {
          scale: 1,
          x: 10,
          y: 10,
          screen: {
            height: 1,
            width: 1,
          },
        },
      } as ParticipantMouse);
    });

    test('should not call room.presence.update if isPrivate', () => {
      const updatePresenceMouseSpy = jest.spyOn(
        presenceMouseComponent['room']['presence'],
        'update',
      );

      presenceMouseComponent['isPrivate'] = true;

      const event = {
        currentTarget: {
          clientWidth: 100,
          clientHeight: 100,
          getAttribute: () => '1',
        },
        offsetX: 50,
        offsetY: 50,
      } as unknown as MouseEvent;

      presenceMouseComponent['onMyParticipantMouseMove'](event);

      expect(updatePresenceMouseSpy).not.toHaveBeenCalled();
    });
  });

  describe('onMyParticipantMouseLeave', () => {
    test('should only call room.presence.update if mouse is out of container boundaries', () => {
      const updatePresenceMouseSpy = jest.spyOn(
        presenceMouseComponent['room']['presence'],
        'update',
      );

      presenceMouseComponent['container'].getBoundingClientRect = jest.fn(
        () =>
          ({
            left: 10,
            right: 100,
            top: 20,
            bottom: 90,
          } as any),
      );

      const mouseEvent1 = {
        x: 5,
        y: 5,
      } as any;

      presenceMouseComponent['onMyParticipantMouseLeave'](mouseEvent1);

      expect(updatePresenceMouseSpy).toHaveBeenCalledWith({ visible: false });
      updatePresenceMouseSpy.mockClear();

      const mouseEvent2 = {
        x: 30,
        y: 40,
      } as any;

      presenceMouseComponent['onMyParticipantMouseLeave'](mouseEvent2);

      expect(updatePresenceMouseSpy).not.toHaveBeenCalled();
    });
  });

  describe('on participant updated', () => {
    test('should set presences', () => {
      presenceMouseComponent['onPresenceUpdate']({
        connectionId: 'unit-test-participant2-id',
        data: {
          ...MOCK_MOUSE,
          id: 'unit-test-participant2-id',
        },
        id: 'unit-test-participant2-id',
        name: MOCK_MOUSE.name as string,
        timestamp: 1,
      });

      const ex = new Map();
      ex.set('unit-test-participant2-id', {
        ...MOCK_MOUSE,
        id: 'unit-test-participant2-id',
      });

      expect(presenceMouseComponent['presences']).toEqual(ex);
    });

    test('should call removePresenceMouseParticipant', () => {
      const removePresenceMouseParticipantSpy = jest.spyOn(
        presenceMouseComponent as any,
        'removePresenceMouseParticipant',
      );

      presenceMouseComponent['onPresenceUpdate']({
        connectionId: 'unit-test-participant3-id',
        data: {
          ...MOCK_MOUSE,
          id: 'unit-test-participant3-id',
        },
        id: 'unit-test-participant3-id',
        name: MOCK_MOUSE.name as string,
        timestamp: 1,
      });

      presenceMouseComponent['onPresenceUpdate']({
        connectionId: 'unit-test-participant2-id',
        data: {
          ...MOCK_MOUSE,
          id: 'unit-test-participant2-id',
        },
        id: 'unit-test-participant2-id',
        name: MOCK_MOUSE.name as string,
        timestamp: 1,
      });

      presenceMouseComponent['userBeingFollowedId'] = 'unit-test-participant2-id';

      presenceMouseComponent['onPresenceUpdate']({
        connectionId: 'unit-test-participant3-id',
        data: {
          ...MOCK_MOUSE,
          id: 'unit-test-participant3-id',
        },
        id: 'unit-test-participant3-id',
        name: MOCK_MOUSE.name as string,
        timestamp: 1,
      });

      expect(removePresenceMouseParticipantSpy).toHaveBeenCalledTimes(1);
    });

    test('should call updateParticipantsMouses', () => {
      const updateParticipantsMousesSpy = jest.spyOn(
        presenceMouseComponent as any,
        'updateParticipantsMouses',
      );

      presenceMouseComponent['onPresenceUpdate']({
        connectionId: 'unit-test-participant2-id',
        data: {
          ...MOCK_MOUSE,
          id: 'unit-test-participant2-id',
        },
        id: 'unit-test-participant2-id',
        name: MOCK_MOUSE.name as string,
        timestamp: 1,
      });

      expect(updateParticipantsMousesSpy).toHaveBeenCalled();
    });
  });

  describe('goToMouse', () => {
    beforeEach(() => {
      presenceMouseComponent['onPresenceUpdate']({
        connectionId: 'unit-test-participant2-id',
        data: {
          ...MOCK_MOUSE,
          id: 'unit-test-participant2-id',
        },
        id: 'unit-test-participant2-id',
        name: MOCK_MOUSE.name as string,
        timestamp: 1,
      });
    });

    test('should call scrollIntoView', () => {
      presenceMouseComponent['start']();

      presenceMouseComponent['createMouseElement'](
        presenceMouseComponent['presences'].get('unit-test-participant2-id')!,
      );
      presenceMouseComponent['mouses'].get('unit-test-participant2-id')!.scrollIntoView = jest.fn();
      presenceMouseComponent['start']();
      presenceMouseComponent['goToMouse']('unit-test-participant2-id');

      expect(
        presenceMouseComponent['mouses'].get('unit-test-participant2-id')!.scrollIntoView,
      ).toHaveBeenCalledWith({
        block: 'center',
        inline: 'center',
        behavior: 'smooth',
      });
    });

    test('should not call scrollIntoView if participant is not found', () => {
      presenceMouseComponent['start']();

      presenceMouseComponent['createMouseElement'](
        presenceMouseComponent['presences'].get('unit-test-participant2-id')!,
      );

      presenceMouseComponent['mouses'].get('unit-test-participant2-id')!.scrollIntoView = jest.fn();

      presenceMouseComponent['goToMouse']('not-found');

      expect(
        presenceMouseComponent['mouses'].get('unit-test-participant2-id')!.scrollIntoView,
      ).not.toHaveBeenCalled();
    });

    test('should call callback and not scrollIntoView if there is a callback', () => {
      presenceMouseComponent['start']();

      presenceMouseComponent['createMouseElement'](
        presenceMouseComponent['presences'].get('unit-test-participant2-id')!,
      );

      presenceMouseComponent['mouses'].get('unit-test-participant2-id')!.scrollIntoView = jest.fn();

      const { x, y } = presenceMouseComponent['mouses']
        .get('unit-test-participant2-id')!
        .getBoundingClientRect();

      const callback = jest.fn();
      presenceMouseComponent['goToPresenceCallback'] = callback;
      presenceMouseComponent['goToMouse']('unit-test-participant2-id');

      expect(callback).toHaveBeenCalledWith({ x, y, scaleX: 0, scaleY: 0 });
    });
  });

  describe('followMouse', () => {
    test('should set userBeingFollowedId', () => {
      presenceMouseComponent['followMouse']('unit-test-participant2-id');
      expect(presenceMouseComponent['userBeingFollowedId']).toEqual('unit-test-participant2-id');
    });
  });

  describe('onPresenceLeftRoom', () => {
    test('should call removePresenceMouseParticipant', () => {
      const removePresenceMouseParticipantSpy = jest.spyOn(
        presenceMouseComponent as any,
        'removePresenceMouseParticipant',
      );

      presenceMouseComponent['onPresenceLeftRoom']({
        connectionId: 'unit-test-participant2-id',
        data: MOCK_MOUSE,
        id: MOCK_MOUSE.id,
        name: MOCK_MOUSE.name as string,
        timestamp: 1,
      });

      expect(removePresenceMouseParticipantSpy).toHaveBeenCalledWith(MOCK_MOUSE.id);
    });
  });

  describe('setParticipantPrivate', () => {
    test('should call room.presence.update', () => {
      const updatePresenceMouseSpy = jest.spyOn(
        presenceMouseComponent['room']['presence'],
        'update',
      );

      presenceMouseComponent['setParticipantPrivate'](true);

      expect(updatePresenceMouseSpy).toHaveBeenCalledWith({ visible: false });
    });

    test('should set isPrivate', () => {
      presenceMouseComponent['setParticipantPrivate'](true);
      expect(presenceMouseComponent['isPrivate']).toBeTruthy();
    });
  });

  describe('setPositionNotStatic', () => {
    test('should set position relative if position is static', () => {
      presenceMouseComponent['container'].style.position = 'static';

      presenceMouseComponent['setPositionNotStatic']();

      expect(presenceMouseComponent['container'].style.position).toEqual('relative');
    });

    test('should not set position relative if position is not static', () => {
      presenceMouseComponent['container'].style.position = 'relative';

      presenceMouseComponent['setPositionNotStatic']();

      expect(presenceMouseComponent['container'].style.position).toEqual('relative');
    });
  });

  describe('createMouseElement', () => {
    beforeEach(() => {
      presenceMouseComponent['start']();
    });

    test('should create a mouse element and append it to the wrapper', () => {
      const mouse = presenceMouseComponent['createMouseElement'](
        participants['unit-test-participant2-id'],
      );

      expect(mouse).toBeTruthy();
      expect(mouse.getAttribute('id')).toEqual('mouse-unit-test-participant2-id');
      expect(mouse.getAttribute('class')).toEqual('mouse-follower');
      expect(mouse.querySelector('.pointer-mouse')).toBeTruthy();
      expect(mouse.querySelector('.mouse-user-name')).toBeTruthy();
      expect(presenceMouseComponent['mouses'].get('unit-test-participant2-id')).toEqual(mouse);
    });

    test('should not create a mouse element if wrapper is not found', () => {
      // @ts-ignore
      presenceMouseComponent['wrapper'] = undefined;

      const mouse = presenceMouseComponent['createMouseElement'](
        participants['unit-test-participant3-id'],
      );

      expect(mouse).toBeFalsy();
    });
  });

  describe('updateSVGPosition', () => {
    beforeEach(() => {
      presenceMouseComponent['start']();
    });

    test('should update the wrapper position', () => {
      document.body.innerHTML = `<div><svg id="svg"></svg></div>`;
      presenceMouseComponent = createMousePointers('svg');

      presenceMouseComponent['container'].getBoundingClientRect = () =>
        ({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
        } as unknown as DOMRect);

      presenceMouseComponent['start']();
      presenceMouseComponent['updateSVGElementWrapper']();

      const wrapper = presenceMouseComponent['wrapper'] as HTMLElement;

      expect(wrapper.style.width).toEqual('100px');
      expect(wrapper.style.height).toEqual('100px');
      expect(wrapper.style.top).toEqual('100px');
      expect(wrapper.style.left).toEqual('100px');
    });
  });

  describe('createRectWrapper', () => {
    test('should identify the correct external viewport when there are nested svgs', () => {
      document.body.innerHTML = `
        <div id="html">
          <svg id="svg1">
            <svg id="svg2">
              <rect id="rect" data-superviz-id="1"></rect>
            </svg>
          </svg>
        </div>
        `;

      presenceMouseComponent = createMousePointers('rect');
      const svg1 = document.getElementById('svg1');
      const svg2 = document.getElementById('svg2');

      const spyOne = jest.spyOn(svg1!.parentElement as any, 'appendChild');
      const spyTwo = jest.spyOn(svg2!.parentElement as any, 'appendChild');

      presenceMouseComponent['start']();
      presenceMouseComponent['createRectWrapper']();

      expect(spyOne).toHaveBeenCalled();
      expect(spyTwo).not.toHaveBeenCalled();
    });
  });

  describe('createEllipseWrapper', () => {
    test('should identify the correct external viewport when there are nested svgs', () => {
      document.body.innerHTML = `
        <div id="html">
          <svg id="svg1">
            <svg id="svg2">
              <ellipse id="ellipse" data-superviz-id="1"></ellipse>
            </svg>
          </svg>
        </div>
        `;

      presenceMouseComponent = createMousePointers('ellipse');
      const svg1 = document.getElementById('svg1');
      const svg2 = document.getElementById('svg2');

      const spyOne = jest.spyOn(svg1!.parentElement as any, 'appendChild');
      const spyTwo = jest.spyOn(svg2!.parentElement as any, 'appendChild');

      presenceMouseComponent['start']();
      presenceMouseComponent['createEllipseWrapper']();

      expect(spyOne).toHaveBeenCalled();
      expect(spyTwo).not.toHaveBeenCalled();
    });
  });

  describe('animate', () => {
    test('should call requestAnimationFrame', () => {
      const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame');

      presenceMouseComponent['start']();
      presenceMouseComponent['animate']();

      expect(requestAnimationFrameSpy).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should call updateVoidElementWrapper', () => {
      document.body.innerHTML = '<div><img id="void-element"></div>';
      presenceMouseComponent = createMousePointers('void-element');

      const updateVoidElementWrapperSpy = jest.spyOn(
        presenceMouseComponent as any,
        'updateVoidElementWrapper',
      );

      presenceMouseComponent['start']();
      presenceMouseComponent['animate']();

      expect(updateVoidElementWrapperSpy).toHaveBeenCalled();
    });

    test('should call updateSVGElementWrapper', () => {
      document.body.innerHTML = '<div><svg id="void-element"></svg></div>';
      presenceMouseComponent = createMousePointers('void-element');

      const updateSVGElementWrapperSpy = jest.spyOn(
        presenceMouseComponent as any,
        'updateSVGElementWrapper',
      );

      presenceMouseComponent['start']();
      presenceMouseComponent['animate']();

      expect(updateSVGElementWrapperSpy).toHaveBeenCalled();
    });
  });

  describe('updateParticipantsMouses', () => {
    beforeEach(() => {
      presenceMouseComponent['onPresenceUpdate']({
        connectionId: 'unit-test-participant2-id',
        data: {
          ...MOCK_MOUSE,
          id: 'unit-test-participant2-id',
        },
        id: 'unit-test-participant2-id',
        name: MOCK_MOUSE.name as string,
        timestamp: 1,
      });
    });

    test('should call removePresenceMouseParticipant if mouse is not visible', () => {
      const removePresenceMouseParticipantSpy = jest.spyOn(
        presenceMouseComponent as any,
        'removePresenceMouseParticipant',
      );

      presenceMouseComponent['presences'].get('unit-test-participant2-id')!.visible = false;
      presenceMouseComponent['updateParticipantsMouses']();

      expect(removePresenceMouseParticipantSpy).toHaveBeenCalledWith('unit-test-participant2-id');
    });

    test('should call renderPresenceMouses', () => {
      const renderPresenceMousesSpy = jest.spyOn(
        presenceMouseComponent as any,
        'renderPresenceMouses',
      );

      presenceMouseComponent['updateParticipantsMouses']();

      expect(renderPresenceMousesSpy).toHaveBeenCalledWith(
        presenceMouseComponent['presences'].get('unit-test-participant2-id')!,
      );
    });

    test('should call goToMouse', () => {
      const goToMouseSpy = jest.spyOn(presenceMouseComponent as any, 'goToMouse');

      presenceMouseComponent['userBeingFollowedId'] = 'unit-test-participant2-id';
      presenceMouseComponent['updateParticipantsMouses']();

      expect(goToMouseSpy).toHaveBeenCalledWith('unit-test-participant2-id');
    });
  });

  describe('updateVoidElementWrapper', () => {
    test('should update the wrapper position', () => {
      presenceMouseComponent['container'].getBoundingClientRect = () =>
        ({
          width: 200,
          height: 200,
        } as any);

      presenceMouseComponent['start']();

      presenceMouseComponent['container'] = {
        ...presenceMouseComponent['container'],
        offsetLeft: 200,
        offsetTop: 200,
      };

      const setPropertySpy = jest.spyOn(
        presenceMouseComponent['wrapper'].style as any,
        'setProperty',
      );
      presenceMouseComponent['updateVoidElementWrapper']();

      const wrapper = presenceMouseComponent['wrapper'] as HTMLElement;

      expect(setPropertySpy).toBeCalled();
      expect(wrapper.style.width).toEqual('200px');
      expect(wrapper.style.height).toEqual('200px');
      expect(wrapper.style.top).toEqual('200px');
      expect(wrapper.style.left).toEqual('200px');
    });

    test('should not update the wrapper position if it is already updated', () => {
      presenceMouseComponent['container'] = {
        getBoundingClientRect() {
          return {
            width: 100,
            height: 100,
          };
        },
        offsetLeft: 100,
        offsetTop: 100,
      } as any;

      presenceMouseComponent['wrapper'] = {
        getBoundingClientRect() {
          return {
            width: 100,
            height: 100,
          };
        },
        offsetLeft: 200,
        offsetTop: 200,
        style: {
          setProperty: jest.fn(),
        },
      } as any;

      presenceMouseComponent['updateVoidElementWrapper']();

      const wrapper = presenceMouseComponent['wrapper'] as HTMLElement;

      expect(wrapper.style.setProperty).not.toBeCalled();
    });
  });

  describe('updateSVGElementWrapper', () => {
    test('should update the wrapper position', () => {
      presenceMouseComponent['container'] = {
        getBoundingClientRect() {
          return {
            width: 100,
            height: 100,
            left: 100,
            top: 100,
          };
        },
      } as any;

      presenceMouseComponent['wrapper'] = {
        getBoundingClientRect() {
          return {
            width: 200,
            height: 200,
            left: 200,
            top: 200,
          };
        },
        style: {
          // eslint-disable-next-line func-names
          setProperty: jest.fn().mockImplementation(function (key, value) {
            this[key] = value;
          }),
          width: '0',
          height: '0',
          top: '0',
          left: '0',
        },
      } as any;

      presenceMouseComponent['updateSVGElementWrapper']();

      const wrapper = presenceMouseComponent['wrapper'] as HTMLElement;

      expect(wrapper.style.setProperty).toBeCalled();
      expect(wrapper.style.width).toEqual('100px');
      expect(wrapper.style.height).toEqual('100px');
      expect(wrapper.style.top).toEqual('100px');
      expect(wrapper.style.left).toEqual('100px');
    });

    test('should not update the wrapper position if it is already updated', () => {
      presenceMouseComponent['start']();

      presenceMouseComponent['container'] = {
        getBoundingClientRect() {
          return {
            width: 100,
            height: 100,
            left: 100,
            top: 100,
          };
        },
      } as any;

      presenceMouseComponent['wrapper'] = {
        getBoundingClientRect() {
          return {
            width: 100,
            height: 100,
            left: 100,
            top: 100,
          };
        },
        style: {
          setProperty: jest.fn(),
        },
      } as any;

      presenceMouseComponent['updateSVGElementWrapper']();

      const wrapper = presenceMouseComponent['wrapper'] as HTMLElement;

      expect(wrapper.style.setProperty).not.toBeCalled();
    });

    test('should call updateSVGPosition if element is an svg', () => {
      document.body.innerHTML = '<svg id="svg"></svg>';
      presenceMouseComponent = createMousePointers('svg');
      presenceMouseComponent['start']();
      presenceMouseComponent['updateSVGPosition'] = jest.fn();

      presenceMouseComponent['container'] = {
        ...presenceMouseComponent['container'],
        getBoundingClientRect() {
          return {
            width: 100,
            height: 100,
            left: 100,
            top: 100,
          };
        },
      } as any;

      presenceMouseComponent['wrapper'] = {
        getBoundingClientRect() {
          return {
            width: 200,
            height: 200,
            left: 200,
            top: 200,
          };
        },
        style: {
          setProperty: jest.fn(),
        },
      } as any;

      presenceMouseComponent['updateSVGElementWrapper']();

      expect(presenceMouseComponent['updateSVGPosition']).toHaveBeenCalled();
      expect(presenceMouseComponent['wrapper'].style.setProperty).not.toBeCalled();
    });
  });

  describe('removePresenceMouseParticipant', () => {
    beforeEach(() => {
      presenceMouseComponent['onPresenceUpdate']({
        connectionId: 'unit-test-participant2-id',
        data: {
          ...MOCK_MOUSE,
          id: 'unit-test-participant2-id',
        },
        id: 'unit-test-participant2-id',
        name: MOCK_MOUSE.name as string,
        timestamp: 1,
      });
      presenceMouseComponent['updateParticipantsMouses']();
    });

    test('should remove the mouse element and the participant from the presences and mouses', () => {
      const mouse = document.createElement('div');
      mouse.setAttribute('id', 'mouse-unit-test-participant2-id');
      document.body.appendChild(mouse);

      presenceMouseComponent['presences'].set('unit-test-participant2-id', MOCK_MOUSE);
      presenceMouseComponent['mouses'].set('unit-test-participant2-id', mouse);

      presenceMouseComponent['removePresenceMouseParticipant']('unit-test-participant2-id');

      expect(document.getElementById('mouse-unit-test-participant2-id')).toBeFalsy();
      expect(presenceMouseComponent['presences'].get('unit-test-participant2-id')).toBeFalsy();
      expect(presenceMouseComponent['mouses'].get('unit-test-participant2-id')).toBeFalsy();
    });

    test('should not remove the mouse element if it does not exist', () => {
      const presenceSpy = jest.spyOn(presenceMouseComponent['presences'], 'delete');
      const mouseSpy = jest.spyOn(presenceMouseComponent['mouses'], 'delete');

      presenceMouseComponent['removePresenceMouseParticipant']('not-found');

      expect(presenceSpy).not.toHaveBeenCalled();
      expect(mouseSpy).not.toHaveBeenCalled();
    });
  });

  describe('renderPresenceMouses', () => {
    let participant: ParticipantMouse;
    let mouseFollower: HTMLElement;
    let divMouseUser: HTMLElement;
    let divPointer: HTMLElement;
    let mouseUser: HTMLDivElement;
    let pointerUser: HTMLDivElement;

    beforeEach(() => {
      participant = MOCK_MOUSE;

      mouseFollower = document.createElement('div');
      mouseFollower.setAttribute('id', `mouse-${participant.id}`);
      document.body.appendChild(mouseFollower);

      divMouseUser = document.createElement('div');
      divMouseUser.setAttribute('id', `mouse-${participant.id}`);
      document.body.appendChild(divMouseUser);

      divPointer = document.createElement('div');
      divPointer.setAttribute('id', `mouse-${participant.id}`);
      document.body.appendChild(divPointer);

      mouseUser = document.createElement('div');
      mouseUser.setAttribute('class', 'mouse-user-name');
      divMouseUser.appendChild(mouseUser);

      pointerUser = document.createElement('div');
      pointerUser.setAttribute('class', 'pointer-mouse');
      divPointer.appendChild(pointerUser);

      presenceMouseComponent['start']();
    });

    test('should create the mouse element if it does not exist', () => {
      const createMouseElementSpy = jest.spyOn(presenceMouseComponent as any, 'createMouseElement');

      presenceMouseComponent['renderPresenceMouses'](participants['unit-test-participant2-id']);

      expect(createMouseElementSpy).toHaveBeenCalledWith(participants['unit-test-participant2-id']);
    });

    test('should not create the mouse element if it already exists', () => {
      const createMouseElementSpy = jest.spyOn(presenceMouseComponent as any, 'createMouseElement');

      presenceMouseComponent['renderPresenceMouses'](participants['unit-test-participant2-id']);

      presenceMouseComponent['renderPresenceMouses'](participants['unit-test-participant2-id']);

      expect(createMouseElementSpy).toHaveBeenCalledTimes(1);
    });
  });
});
