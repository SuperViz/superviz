import { CSSResultGroup, LitElement, html } from 'lit';

import { repeat } from 'lit/directives/repeat.js';

import { ParticipantByGroupApi } from '../../../common/types/participant.types';
import { Annotation } from '../../../components/comments/types';
import { WebComponentsBase } from '../../base';
import { contentStyle } from '../css';

import { AnnotationFilter, PinMode } from './types';
import { CreateElement } from '../../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, contentStyle];

@CreateElement('superviz-comments-content')
export class CommentsContent extends WebComponentsBaseElement {
  static styles = styles;

  declare annotations: Annotation[];
  declare participantsList: ParticipantByGroupApi[];
  declare selectedAnnotation: string;
  declare annotationFilter: AnnotationFilter;
  private lastCommentId: string;

  static properties = {
    annotations: { type: Object },
    selectedAnnotation: { type: String },
    annotationFilter: { type: String },
    participantsList: { type: Object },
  };

  constructor() {
    super();
    this.annotations = [];
    this.participantsList = [];
  }

  private unselectAnnotation = () => {
    this.selectedAnnotation = null;
  };

  private unselectAnnotationEsc = (event?: KeyboardEvent) => {
    if (event && event?.key !== 'Escape') return;
    this.selectedAnnotation = null;
  };

  private selectAnnotation = ({ detail }: CustomEvent) => {
    const { uuid } = detail;

    if (this.selectedAnnotation === uuid) {
      this.selectedAnnotation = null;
      return;
    }

    this.selectedAnnotation = uuid;
  };

  updated(changedProperties) {
    super.updated(changedProperties);
    this.updateComplete.then(() => {
      const selectedAnnotation = this.shadowRoot.querySelector(
        `[uuid='${this.selectedAnnotation}']`,
      );
      if (!selectedAnnotation) return;

      const isLastComment = this.lastCommentId === this.selectedAnnotation;
      const offset = !isLastComment ? -150 : 0;

      const clientRects = selectedAnnotation.getClientRects()[0];

      if (!clientRects) return;

      this.scrollBy(0, clientRects.y + offset);

      // "Add Comment" is not yet rendered in screen
      // so we need an extra scroll to show it
      if (isLastComment) {
        setTimeout(() => {
          this.scrollBy(0, clientRects.y + offset);
        }, 200);
      }
    });
  }

  connectedCallback(): void {
    super.connectedCallback();

    window.document.body.addEventListener('select-annotation', this.selectAnnotation);
    window.document.body.addEventListener('keyup', this.unselectAnnotationEsc);
    window.document.body.addEventListener('unselect-annotation', this.unselectAnnotation);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    window.document.body.removeEventListener('select-annotation', this.selectAnnotation);
    window.document.body.removeEventListener('keyup', this.unselectAnnotationEsc);
    window.document.body.removeEventListener('unselect-annotation', this.unselectAnnotation);
  }

  private checkLastAnnotation = (uuid: string): boolean => {
    const resolvedList = this.annotations.filter((annotation) => annotation.resolved);
    const unresolvedList = this.annotations.filter((annotation) => !annotation.resolved);

    if (this.annotationFilter === AnnotationFilter.ALL) {
      return uuid === resolvedList[resolvedList.length - 1]?.uuid;
    }

    return uuid === unresolvedList[unresolvedList.length - 1]?.uuid;
  };

  protected render() {
    return html` ${repeat(
      this.annotations.filter((annotation) => annotation.comments?.length),
      (annotation: Annotation) => annotation.uuid,
      (annotation: Annotation) => html`
        <superviz-comments-annotation-item
          annotation=${JSON.stringify(annotation)}
          selected="${this.selectedAnnotation}"
          annotationFilter=${this.annotationFilter}
          uuid=${annotation.uuid}
          ?resolved=${annotation.resolved}
          isLastComment=${this.checkLastAnnotation(annotation.uuid)}
          participantsList=${JSON.stringify(this.participantsList)}
        >
        </superviz-comments-annotation-item>
      `,
    )}`;
  }
}
