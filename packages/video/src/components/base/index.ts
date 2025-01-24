export abstract class BaseComponent {
  attach() {}
  dettach() {}

  protected abstract destroy(): void;
  protected abstract start(): void;
}
