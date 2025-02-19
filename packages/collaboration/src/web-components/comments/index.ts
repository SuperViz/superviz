import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';

import { classMap } from 'lit/directives/class-map.js';

import { ParticipantByGroupApi } from '../../common/types/participant.types';
import { Annotation, CommentsSide, Offset } from '../../components/comments/types';
import { WebComponentsBase } from '../base';
import importStyle from '../base/utils/importStyle';

import { AnnotationFilter } from './components/types';
import { commentsStyle, poweredByStyle } from './css/index';
import { waterMarkElementObserver } from './utils/watermark';
import { CreateElement } from '../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, commentsStyle, poweredByStyle];

@CreateElement('superviz-comments')
export class Comments extends WebComponentsBaseElement {
  static styles = styles;

  declare open: boolean;
  declare annotations: Annotation[];
  declare annotationFilter: AnnotationFilter;
  declare waterMarkState: boolean;
  declare side: CommentsSide;
  declare participantsList: ParticipantByGroupApi[];
  declare offset: Offset;

  static properties = {
    open: { type: Boolean },
    annotations: { type: Object },
    annotationFilter: { type: String },
    waterMarkState: { type: Boolean },
    side: { type: String },
    participantsList: { type: Object },
    offset: { type: Object },
  };

  constructor() {
    super();
    this.annotations = [];
    this.annotationFilter = AnnotationFilter.ALL;
    this.waterMarkState = false;
    this.participantsList = [];
    this.side = CommentsSide.LEFT;
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    super.firstUpdated(_changedProperties);
    this.updateComplete.then(() => {
      importStyle.call(this, ['comments']);
    });
  }

  protected updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    this.updateComplete.then(() => {
      if (this.waterMarkState) {
        waterMarkElementObserver(this.shadowRoot);
      }

      if (changedProperties.has('offset')) {
        this.applyOffset();
      }
    });
  }

  public participantsListed(participants: ParticipantByGroupApi[]) {
    this.participantsList = participants;
  }

  public updateAnnotations(data: Annotation[]) {
    this.annotations = data;
  }

  private close() {
    this.emitEvent('close-threads', {});
  }

  waterMarkStatus(waterMark: boolean) {
    this.waterMarkState = waterMark;
  }

  private setFilter({ detail }) {
    const {
      filter: { label },
    } = detail;
    this.annotationFilter = label;
  }

  private getOffset(offset: number) {
    if (offset === null || offset === undefined || offset < 0) {
      return '10px';
    }

    return `${offset}px`;
  }

  private applyOffset() {
    const supervizCommentsDiv: HTMLDivElement = this.shadowRoot.querySelector('.superviz-comments');
    if (!supervizCommentsDiv) return;

    const { left, right, top, bottom } = this.offset;

    supervizCommentsDiv.style.setProperty('--offset-top', this.getOffset(top));
    supervizCommentsDiv.style.setProperty('--offset-bottom', this.getOffset(bottom));
    supervizCommentsDiv.style.setProperty('--offset-right', this.getOffset(right));
    supervizCommentsDiv.style.setProperty('--offset-left', this.getOffset(left));
  }

  private get poweredBy() {
    if (!this.waterMarkState) return html``;

    return html` <div id="poweredby-footer" class="footer">
      <div class="powered-by powered-by--horizontal">
        <a href="https://superviz.com/" target="_blank" class="link">
          <div class="">
            Powered by
            <img
              width="48px"
              height="8.86px"
              src="https://production.cdn.superviz.com/static/superviz-gray-logo.svg"
            />
          </div>
        </a>
      </div>
    </div>`;
  }

  protected render() {
    const classes = {
      'superviz-comments': true,
      'threads-on-left-side': this.side === CommentsSide.LEFT,
      'threads-on-right-side': this.side === CommentsSide.RIGHT,
      'hide-at-right': this.side === CommentsSide.RIGHT && !this.open,
      'hide-at-left': this.side === CommentsSide.LEFT && !this.open,
    };

    return html`
      <div id="superviz-comments" class=${classMap(classes)}>
        <div class="header">
          <superviz-comments-topbar
            @close-threads=${this.close}
            side=${this.side.split(':')[0]}
          ></superviz-comments-topbar>
        </div>
        <superviz-comments-annotation-filter
          filter=${this.annotationFilter}
          @select=${this.setFilter}
        >
        </superviz-comments-annotation-filter>
        <superviz-comments-content
          annotations=${JSON.stringify(this.annotations)}
          annotationFilter=${this.annotationFilter}
          participantsList=${JSON.stringify(this.participantsList)}
          class="content"
        ></superviz-comments-content>
        ${this.poweredBy}
      </div>
    `;
  }
}
