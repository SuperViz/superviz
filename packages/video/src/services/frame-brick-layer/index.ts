export class FrameBricklayer {
  public wrapperId: string;

  public element: HTMLIFrameElement;

  build(
    wrapperId: string,
    url: string,
    frameId: string,
    queryParams: Object = {},
    attributes: Object = {},
  ) {
    const wrapper = document.querySelector(`#${wrapperId}`);
    const frameUrl = new URL(url);

    if (this.wrapperId || this.element) {
      throw new Error('Tried to initialize two frames with the same FrameBricklayer instance');
    }

    this.element = document.createElement('iframe');

    Object.entries(queryParams).forEach(([key, value]) => {
      frameUrl.searchParams.set(key, value);
    });

    Object.entries(attributes).forEach(([attribute, value]) => {
      this.element.setAttribute(attribute, value);
    });

    this.element.src = frameUrl.toString();
    this.element.id = frameId;

    wrapper.appendChild(this.element);

    this.wrapperId = wrapperId;
  }

  destroy() {
    if (!this.wrapperId) {
      throw new Error('Tried to destroy a frame before it was initialized');
    }

    const wrapper = document.querySelector(`#${this.wrapperId}`);

    if (!!wrapper && !!wrapper.querySelector(`#${this.element.id}`)) {
      wrapper.removeChild(this.element);
    }

    this.wrapperId = null;
    this.element = null;
  }
}
