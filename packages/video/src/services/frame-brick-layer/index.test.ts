import { FrameBricklayer } from './index';

describe('FrameBricklayer', () => {
  let frameBricklayer: FrameBricklayer;

  beforeEach(() => {
    document.body.innerHTML = '<div id="wrapper"></div>';
    frameBricklayer = new FrameBricklayer();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should build an iframe with given attributes and query parameters', () => {
    const wrapperId = 'wrapper';
    const url = 'https://example.com';
    const frameId = 'frame1';
    const queryParams = { foo: 'bar' };
    const attributes = { width: '600', height: '400' };

    frameBricklayer.build(wrapperId, url, frameId, queryParams, attributes);

    const iframe = document.querySelector(`#${frameId}`) as HTMLIFrameElement;

    expect(iframe).not.toBeNull();
    expect(iframe.src).toBe('https://example.com/?foo=bar');
    expect(iframe.width).toBe('600');
    expect(iframe.height).toBe('400');
    expect(iframe.id).toBe(frameId);
  });

  it('should throw an error if trying to build another iframe with the same instance', () => {
    const wrapperId = 'wrapper';
    const url = 'https://example.com';
    const frameId = 'frame1';

    frameBricklayer.build(wrapperId, url, frameId);

    expect(() => {
      frameBricklayer.build(wrapperId, url, frameId);
    }).toThrow('Tried to initialize two frames with the same FrameBricklayer instance');
  });

  it('should destroy the iframe', () => {
    const wrapperId = 'wrapper';
    const url = 'https://example.com';
    const frameId = 'frame1';

    frameBricklayer.build(wrapperId, url, frameId);
    frameBricklayer.destroy();

    const iframe = document.querySelector(`#${frameId}`);

    expect(iframe).toBeNull();
    expect(frameBricklayer.wrapperId).toBeNull();
    expect(frameBricklayer.element).toBeNull();
  });

  it('should throw an error if trying to destroy an uninitialized frame', () => {
    expect(() => {
      frameBricklayer.destroy();
    }).toThrow('Tried to destroy a frame before it was initialized');
  });
});
