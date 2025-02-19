import { CSSResultGroup, LitElement, PropertyValueMap, html } from 'lit';

import { classMap } from 'lit/directives/class-map.js';

import { WebComponentsBase } from '../base';
import importStyle from '../base/utils/importStyle';

import { dropdownStyle } from './index.style';
import { Positions, PositionsEnum } from './types';
import { CreateElement } from '../global/decorators/create-element.decorator';

const WebComponentsBaseElement = WebComponentsBase(LitElement);
const styles: CSSResultGroup[] = [WebComponentsBaseElement.styles, dropdownStyle];

@CreateElement('superviz-tooltip')
export class Tooltip extends WebComponentsBaseElement {
  static styles = styles;

  declare tooltipData: { name: string; info: string };

  declare tooltip: HTMLElement;
  declare tooltipOnLeft: boolean;
  declare showTooltip: boolean;
  declare tooltipVerticalPosition: Positions;
  declare tooltipHorizontalPosition: Positions;
  declare shiftTooltipLeft: boolean;
  declare parentSizes: { height: number; width: number };
  declare classesPrefix: string;
  declare parentComponent: string;

  private canAnimate: boolean;
  private animationFrame: number;

  static properties = {
    tooltipData: { type: Object },
    tooltipOnLeft: { type: Boolean },
    showTooltip: { type: Boolean },
    tooltip: { type: Object },
    tooltipVerticalPosition: { type: String },
    tooltipHorizontalPosition: { type: String },
    parentSizes: { type: Object },
    shiftTooltipLeft: { type: Boolean },
    classesPrefix: { type: String },
    parentComponent: { type: String },
  };

  constructor() {
    super();
    this.tooltipVerticalPosition = PositionsEnum['TOOLTIP-BOTTOM'];
    this.tooltipHorizontalPosition = PositionsEnum['TOOLTIP-CENTER'];
    this.showTooltip = false;
    this.parentSizes = { height: 0, width: 0 };
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    const { parentElement } = this;
    parentElement?.addEventListener('mouseenter', this.show);
    parentElement?.addEventListener('mouseleave', this.hide);
    this.adjustTooltipPosition();
    importStyle.call(this, this.parentComponent);
  }

  private positionFixedTooltip = () => {
    if (!this.canAnimate || !this.parentElement) {
      this.hide();
      return;
    }

    this.adjustTooltipPosition();

    const {
      bottom: parentBottom,
      left: parentLeft,
      width: parentWidth,
      right: parentRight,
      top: parentTop,
    } = this.parentElement.getBoundingClientRect();
    const { width } = this.tooltip.getBoundingClientRect();

    let top = 'auto';
    let bottom = 'auto';
    let left = 'auto';
    let right = 'auto';
    let transform = '';

    const isLargeScreenSize = window.innerWidth > 780;
    let verticalOffset = isLargeScreenSize ? 14 : 12;

    if (this.tooltipHorizontalPosition.includes('right')) {
      left = `${parentLeft + parentWidth / 2}px`;
    }

    if (this.tooltipHorizontalPosition.includes('left')) {
      right = `${window.innerWidth - (parentRight - parentWidth / 2)}px`;
    }

    if (this.tooltipHorizontalPosition.includes('center')) {
      left = `${parentLeft}px`;

      transform = `translateX(-${(width - parentWidth) / 2}px)`;
    }

    if (this.tooltipVerticalPosition.includes('bottom')) {
      top = `${parentBottom + verticalOffset}px`;
      verticalOffset = -10;
    }

    if (this.tooltipVerticalPosition.includes('top')) {
      bottom = `${window.innerHeight - (parentTop - verticalOffset)}px`;
      verticalOffset = 10;
    }

    if (this.shiftTooltipLeft) {
      const horizontalOffset = isLargeScreenSize ? 18 : 10;
      transform = `translate(-${(width - horizontalOffset - 42) / 2}px, ${verticalOffset}px)`;
    }

    this.tooltip?.style.setProperty('top', top);
    this.tooltip?.style.setProperty('left', left);
    this.tooltip?.style.setProperty('right', right);
    this.tooltip?.style.setProperty('bottom', bottom);
    this.tooltip?.style.setProperty('transform', transform);

    this.animationFrame = window.requestAnimationFrame(this.positionFixedTooltip);
  };

  private hide = () => {
    this.canAnimate = false;
    this.showTooltip = false;
    window.cancelAnimationFrame(this.animationFrame);
  };

  private show = () => {
    this.canAnimate = true;
    this.showTooltip = true;
    this.positionFixedTooltip();
  };

  disconnectedCallback(): void {
    super.disconnectedCallback();

    const { parentElement } = this;

    parentElement?.removeEventListener('mouseenter', this.show);
    parentElement?.removeEventListener('mouseleave', this.hide);
  }

  protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (changedProperties.has('showTooltip') && this.showTooltip) {
      const { parentElement } = this;
      if (!parentElement) return;

      const { height, width } = parentElement.getBoundingClientRect();

      if (this.parentSizes.height !== height || this.parentSizes.width !== width) {
        this.parentSizes = { height, width };
      }
    }
  }

  private adjustTooltipVerticalPosition = () => {
    const { bottom, top, width } = this.tooltip.getBoundingClientRect();
    const maxY = window.innerHeight;

    if (this.tooltipVerticalPosition.includes('top') && top < 0) {
      this.tooltipVerticalPosition = this.tooltipVerticalPosition.replace(
        'top',
        'bottom',
      ) as Positions;
      return;
    }

    if (this.tooltipVerticalPosition.includes('bottom') && bottom > maxY) {
      this.tooltipVerticalPosition = this.tooltipVerticalPosition.replace(
        'bottom',
        'top',
      ) as Positions;
    }
  };

  private adjustTooltipHorizontalPosition = () => {
    const { left, right, width } = this.tooltip.getBoundingClientRect();
    const maxX = window.innerWidth;

    const {
      left: parentLeft,
      width: parentWidth,
      right: parentRight,
    } = this.parentElement.getBoundingClientRect();

    // check if both sides of tooltip would still be visible if it centered
    const wouldFitScreenLeft = parentLeft + parentWidth / 2 - width / 2 > 0;
    const wouldFitScreenRight = width / 2 + parentRight - parentWidth / 2 < maxX;

    if (wouldFitScreenLeft && wouldFitScreenRight) {
      this.tooltipHorizontalPosition = this.tooltipHorizontalPosition.replace(
        /left|right/,
        'center',
      ) as Positions;
      return;
    }

    if (left < 0) {
      this.tooltipHorizontalPosition = this.tooltipHorizontalPosition.replace(
        'center',
        'right',
      ) as Positions;
      return;
    }

    if (right > maxX) {
      this.tooltipHorizontalPosition = this.tooltipHorizontalPosition.replace(
        'center',
        'left',
      ) as Positions;
    }
  };

  private adjustTooltipPosition = () => {
    if (!this.parentElement) {
      this.hide();
      return;
    }

    if (!this.tooltip) {
      this.tooltip = this.shadowRoot.querySelector('.superviz-who-is-online__tooltip');
    }

    this.adjustTooltipVerticalPosition();
    this.adjustTooltipHorizontalPosition();
  };

  private getClass(suffix: string) {
    return suffix ? `${this.classesPrefix}__${suffix}` : this.classesPrefix;
  }

  private renderTooltip() {
    const verticalPosition = this.tooltipVerticalPosition;
    const horizontalPosition = this.tooltipHorizontalPosition;

    const classList = {
      'superviz-who-is-online__tooltip': true,
      [this.getClass('')]: true,
      [verticalPosition]: true,
      [horizontalPosition]: true,
      'tooltip-extras': this.tooltipOnLeft,
      'show-tooltip': this.showTooltip,
      'shift-left': this.shiftTooltipLeft,
    };

    return html`<div
      class=${classMap(classList)}
      style="--host-height: ${this.parentSizes?.height}px; --host-width: ${this.parentSizes
        ?.width}px;"
    >
      <p class="tooltip-name ${this.getClass('title')}">${this.tooltipData?.name}</p>
      ${this.tooltipData?.info
        ? html`<p class="tooltip-action ${this.getClass('action')}">${this.tooltipData?.info}</p>`
        : ''}
      <div class="superviz-who-is-online__tooltip-arrow ${this.getClass('')}"></div>
    </div>`;
  }

  protected render() {
    return html`${this.renderTooltip()}`;
  }
}
