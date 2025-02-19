import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';

import { WebComponentsBase } from '../../base';
import importStyle from '../../base/utils/importStyle';
import { topbarStyle } from '../css';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, topbarStyle];

@CreateElement('superviz-comments-topbar')
export class CommentsTopbar extends WebComponentsBase(LitElement) {
  static styles = styles;
  declare side: string;

  static properties = {
    side: { type: String },
  };

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    super.firstUpdated(_changedProperties);
    this.updateComplete.then(() => {
      importStyle.call(this, ['comments']);
    });
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close-threads'));
  }

  protected render() {
    return html`
      <div class="comments__topbar">
        <span class="text text-bold comments__topbar__title">COMMENTS</span>
        <span @click=${this.close} class="comments__topbar__close-threads">
          <superviz-icon name=${this.side}></superviz-icon>
        </span>
      </div>
    `;
  }
}
