import { FrameBricklayer } from './index';

const appendChildSpy = jest.fn();
const removeChildSpy = jest.fn();

describe('FrameBrickLayer', () => {
  let FrameBricklayerInstace: FrameBricklayer;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(document, 'querySelector').mockReturnValue({
      appendChild: appendChildSpy,
      removeChild: removeChildSpy,
      querySelector: jest.fn(() => document.createElement('iframe')),
    } as unknown as Element);
    FrameBricklayerInstace = new FrameBricklayer();
  });

  test('should be defined', () => {
    expect(FrameBricklayerInstace).toBeInstanceOf(FrameBricklayer);
  });

  test('should have a build method', () => {
    expect(FrameBricklayerInstace.build).toBeDefined();
  });

  test('should have a destroy method', () => {
    expect(FrameBricklayerInstace.destroy).toBeDefined();
  });

  describe('build', () => {
    test('should throw an error if the wrapperId is already set', () => {
      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com';
      const frameId = 'frameId';

      FrameBricklayerInstace.wrapperId = wrapperId;

      expect(() => {
        FrameBricklayerInstace.build(wrapperId, url, frameId);
      }).toThrowError('Tried to initialize two frames with the same FrameBricklayer instance');
    });

    test('should set the wrapperId', () => {
      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com';
      const frameId = 'frameId';

      FrameBricklayerInstace.build(wrapperId, url, frameId);

      expect(FrameBricklayerInstace.wrapperId).toEqual(wrapperId);
    });

    test('should set the element', () => {
      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com';
      const frameId = 'frameId';

      FrameBricklayerInstace.build(wrapperId, url, frameId);

      expect(FrameBricklayerInstace.element).toBeDefined();
    });

    test('should set the element src', () => {
      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com/';
      const frameId = 'frameId';

      FrameBricklayerInstace.build(wrapperId, url, frameId);

      expect(FrameBricklayerInstace.element.src).toEqual(url);
    });

    test('should set the element id', () => {
      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com/';
      const frameId = 'frameId';

      FrameBricklayerInstace.build(wrapperId, url, frameId);

      expect(FrameBricklayerInstace.element.id).toEqual(frameId);
    });

    test('should append the element to the wrapper', () => {
      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com/';
      const frameId = 'frameId';

      FrameBricklayerInstace.build(wrapperId, url, frameId);

      expect(appendChildSpy).toHaveBeenCalledWith(FrameBricklayerInstace.element);
    });

    test('should set the element attributes', () => {
      const appendChildSpy = jest.fn();

      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com/';
      const frameId = 'frameId';
      const attributes = {
        'data-test': 'test',
      };

      FrameBricklayerInstace.build(wrapperId, url, frameId, {}, attributes);

      expect(FrameBricklayerInstace.element.getAttribute('data-test')).toEqual(
        attributes['data-test'],
      );
    });

    test('should set the element query params', () => {
      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com/';
      const frameId = 'frameId';
      const queryParams = {
        test: 'test',
      };

      FrameBricklayerInstace.build(wrapperId, url, frameId, queryParams);

      expect(FrameBricklayerInstace.element.src).toEqual(`${url}?test=${queryParams.test}`);
    });
  });

  describe('destroy', () => {
    test('should throw an error if the wrapperId is not set', () => {
      expect(() => {
        FrameBricklayerInstace.destroy();
      }).toThrowError('Tried to destroy a frame before it was initialized');
    });

    test('should remove the element from the wrapper', () => {
      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com/';
      const frameId = 'frameId';

      FrameBricklayerInstace.build(wrapperId, url, frameId);
      FrameBricklayerInstace.destroy();

      expect(removeChildSpy).toBeCalled();
    });

    test('should set the wrapperId to null', () => {
      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com/';
      const frameId = 'frameId';

      FrameBricklayerInstace.build(wrapperId, url, frameId);
      FrameBricklayerInstace.destroy();

      expect(FrameBricklayerInstace.wrapperId).toBeNull();
    });

    test('should set the element to null', () => {
      const wrapperId = 'wrapperId';
      const url = 'https://www.superviz.com/';
      const frameId = 'frameId';

      FrameBricklayerInstace.build(wrapperId, url, frameId);
      FrameBricklayerInstace.destroy();

      expect(FrameBricklayerInstace.element).toBeNull();
    });
  });
});
