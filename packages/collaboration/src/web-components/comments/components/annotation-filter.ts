import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

import { WebComponentsBase } from '../../base';
import importStyle from '../../base/utils/importStyle';
import { DropdownOption } from '../../dropdown/types';
import { annotationFilterStyle } from '../css';

import { AnnotationFilter } from './types';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, annotationFilterStyle];

const options: DropdownOption[] = [
  {
    label: AnnotationFilter.ALL,
  },
  {
    label: AnnotationFilter.RESOLVED,
  },
];

@CreateElement('superviz-comments-annotation-filter')
export class CommentsAnnotationFilter extends WebComponentsBaseElement {
  constructor() {
    super();
    this.caret = 'down';
  }

  declare filter: AnnotationFilter;
  declare caret: string;

  static styles = styles;

  static properties = {
    filter: { type: String },
    caret: { type: String },
  };

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    super.firstUpdated(_changedProperties);
    this.updateComplete.then(() => {
      importStyle.call(this, ['comments']);
    });
  }

  private selectClick = () => {
    this.caret = this.caret === 'down' ? 'up' : 'down';
  };

  private dropdownOptionsHandler = ({ detail }: CustomEvent) => {
    this.emitEvent('select', { filter: detail });
    this.selectClick();
  };

  protected render() {
    const selectedLabel =
      this.filter === AnnotationFilter.ALL ? options[0].label : options[1].label;

    options[0].active = this.filter === AnnotationFilter.ALL;
    options[1].active = this.filter === AnnotationFilter.RESOLVED;

    const textClasses = {
      text: true,
      'text-bold': true,
      'select-content': true,
      'comments__filter__selected-label': true,
      'sv-gray-500': this.caret === 'down',
      'sv-gray-700': this.caret === 'up',
    };

    return html`
      <div class="comments__filter-container">
        <div class="comments__filter">
          <superviz-dropdown
            options=${JSON.stringify(options)}
            position="bottom-left"
            right-offset="100px"
            @click=${this.selectClick}
            @selected=${this.dropdownOptionsHandler}
            @close=${this.selectClick}
            classesPrefix="comments__dropdown"
            parentComponent="comments"
          >
            <div class="comments__filter__toggle-button" slot="dropdown">
              <span class=${classMap(textClasses)}>${selectedLabel}</span>
              <div class="comments__filter__icon">
                <superviz-icon name=${this.caret} size="xs"></superviz-icon>
              </div>
            </div>
          </superviz-dropdown>
        </div>
      </div>
    `;
  }
}
