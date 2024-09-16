import { css } from 'lit';

export const dropdownStyle = css`
  .superviz-who-is-online__tooltip {
    --host-height: 0px;
    --host-width: 0px;
    --vertical-offset: 12px;

    background-color: rgb(var(--sv-gray-600));
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    position: fixed;
    opacity: 0;
    border-radius: 2px;
    cursor: default;
    visibility: hidden;
    transition: opacity 0.2s ease-in-out display 0s;
    z-index: 100;
    overflow-x: clip;
  }

  .superviz-who-is-online__tooltip-arrow {
    width: 13px;
    height: 13px;
    position: absolute;
    background-color: rgb(var(--sv-gray-600));
    transform: rotate(45deg);
    border-top-left-radius: 1px;
    border-bottom-right-radius: 1px;
  }

  .show-tooltip {
    opacity: 1;
    visibility: visible;
  }

  .tooltip-name,
  .tooltip-action {
    margin: 0;
    font-family: roboto;
    white-space: nowrap;
    text-align: center;
    line-height: 1.2;
  }

  .tooltip-name {
    color: white;
    font-size: 14px;
  }

  .tooltip-action {
    color: rgb(var(--sv-gray-400));
    font-size: 12px;
  }

  .tooltip-top {
    bottom: calc(var(--host-height) + var(--vertical-offset));
  }

  .tooltip-bottom {
    bottom: auto;
  }

  .tooltip-center {
    right: auto;
  }

  .tooltip-bottom .superviz-who-is-online__tooltip-arrow {
    top: -6.5px;
  }

  .tooltip-top .superviz-who-is-online__tooltip-arrow {
    bottom: -6.5px;
  }

  .tooltip-center .superviz-who-is-online__tooltip-arrow {
    left: 0;
    margin-left: 50%;
    translate: -50% 0;
  }

  .tooltip-left .superviz-who-is-online__tooltip-arrow {
    translate: 50% 0;
    border-radius: 0;
    right: 0;
  }

  .tooltip-right .superviz-who-is-online__tooltip-arrow {
    translate: -50% 0;
    border-radius: 0;
    left: 0;
  }

  .shift-left {
    --vertical-offset: 2px;
  }
`;
