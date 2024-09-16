import { customElement } from 'lit/decorators.js';

/**
 * A decorator function that creates a custom element.
 *
 * @param {string} elementName - The name of the custom element to be created.
 * @returns {Function} A decorator function that registers the custom element.
 *
 * @description
 * This decorator function wraps the Lit `customElement` decorator and adds some additional checks:
 * - It checks if the element has already been declared to avoid duplicate declarations.
 * - It checks if the current environment supports custom elements (i.e., if `window` and `HTMLElement` are defined).
 *
 * If the element has already been declared or if the environment doesn't support custom elements,
 * the decorator will not register the element and will simply return.
 *
 * @example
 * ```
 * @CreateElement('my-custom-element')
 * class MyCustomElement extends LitElement {
 *   // ...
 * }
 * ```
 */
export function CreateElement(elementName: string): Function {
  return function (constructor: Function) {
    const alreadyDeclared = !!customElements.get(elementName);
    const isWithWrongEnvirionment =
      typeof window === 'undefined' || typeof HTMLElement === 'undefined';

    if (isWithWrongEnvirionment || alreadyDeclared) return;

    customElement(elementName)(constructor);
  };
}
