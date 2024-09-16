import { waterMarkElementObserver, reloadWaterMarkContent } from './watermark';

describe('waterMarkElementObserver', () => {
  test('should observe changes to superviz-comments', () => {
    const hostElement = document.createElement('div');
    hostElement.id = 'superviz-comments';
    const shadowRoot = hostElement.attachShadow({ mode: 'open' });

    waterMarkElementObserver(shadowRoot);
    expect(typeof shadowRoot.querySelector('#superviz-comments')).toBe('object');
  });
});
describe('reloadWaterMarkContent', () => {
  test('should remove existing poweredby-footer and add a new one', () => {
    const shadowRoot = document.createElement('div').attachShadow({ mode: 'open' });

    const existingPoweredByFooter = document.createElement('div');
    existingPoweredByFooter.id = 'superviz-comments';
    shadowRoot.appendChild(existingPoweredByFooter);

    expect(shadowRoot.querySelector('#poweredby-footer')).toBeNull();

    reloadWaterMarkContent(shadowRoot);

    const newPoweredByFooter = shadowRoot.querySelector('#poweredby-footer');
    expect(newPoweredByFooter).not.toBeNull();
  });

  test('should add a new poweredby-footer if none exists', () => {
    const shadowRoot = document.createElement('div').attachShadow({ mode: 'open' });

    const existingPoweredByFooter = document.createElement('div');
    existingPoweredByFooter.id = 'superviz-comments';

    shadowRoot.appendChild(existingPoweredByFooter);

    reloadWaterMarkContent(shadowRoot);

    const newPoweredByFooter = shadowRoot.querySelector('#poweredby-footer');
    expect(newPoweredByFooter).not.toBeNull();
  });
});
