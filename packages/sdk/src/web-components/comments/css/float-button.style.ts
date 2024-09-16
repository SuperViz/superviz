import { css } from 'lit';

export const floatButtonStyle = css`
  .comments__floating-button {
    position: fixed;
    border-radius: 50%;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    gap: 4px;
    border: none;
    background-color: rgba(var(--sv-white));
    box-shadow: 2px 2px 15px 0px rgba(0, 0, 0, 0.2);
    color: rgb(var(--sv-gray-600));
    cursor: pointer;
    overflow: hidden;
    padding-left: 10px;
    z-index: 99;
    transition: width 300ms linear, border-radius 300ms linear;
  }

  .comments__floating-button:hover,
  .comments__floating-button.is-active {
    background-color: rgb(var(--sv-gray-400));
    color: rgba(var(--sv-white));
  }

  .comments-floating-button-hovered {
    transition: width 300ms linear 300ms, border-radius 300ms linear 300ms;
  }

  .comments__floating-button__text {
    text-align: left;
    overflow: hidden;
    position: relative;
    margin: 0;
    line-height: 1;
    right: 0px;
  }

  .not-hovered {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }

  .hide-button {
    display: none !important;
  }

  .is-inactive:hover {
    width: 110px;
    border-radius: 30px;
  }

  .is-active:hover {
    width: 92px;
    border-radius: 30px;
    animation: decrease-width 600ms linear;
  }

  .textInactive.cancel {
    position: absolute;
    bottom: -30px;
    animation: drop-cancel-text 600ms linear;
    right: auto;
  }

  .textInactive.comment {
    position: absolute;
    top: 0;
    animation: drop-comment-text 600ms linear;
  }

  .textActive.comment {
    position: absolute;
    top: -30px;
    animation: rise-comment-text 600ms linear;
    right: auto;
  }

  .textActive.cancel {
    position: absolute;
    bottom: 0;
    animation: rise-cancel-text 600ms linear;
  }

  .comments__floating-button .comments__floating-button-text-box {
    width: 0;
  }

  .comments__floating-button.is-inactive:hover .comments__floating-button-text-box {
    width: 61.45px;
  }

  .comments__floating-button.is-active:hover .comments__floating-button-text-box {
    width: 43.0833px;
  }

  .comments__floating-button-text-box {
    position: relative;
    height: 14px;
    overflow-x: clip;
    transition: width 300ms linear;
  }

  .comments__floating-button__icon {
    position: relative;
  }

  .cross {
    position: absolute;
    top: 9px;
    left: 5.3px;
    transform: translateY(-50%);
    transform-origin: center;
    transition: transform 300ms linear 300ms;
  }

  rect {
    fill: rgba(var(--sv-gray-600));
  }

  .comments__floating-button:hover rect,
  .is-active rect {
    fill: rgba(var(--sv-white));
  }

  .cross-bar-1 {
    transform-origin: center;
    transform: rotate(0deg);
  }

  .cross-bar-2 {
    transform-origin: center;
    transform: rotate(90deg);
  }

  .is-active .cross {
    transform: translateY(-50%) rotate(45deg);
  }

  @keyframes rise-cancel-text {
    0%,
    50% {
      opacity: 0;
      bottom: -35px;
    }

    75% {
      opacity: 0;
    }

    100% {
      opacity: 1;
      bottom: 0px;
    }
  }

  @keyframes rise-comment-text {
    0% {
      opacity: 1;
      top: 0px;
    }

    35% {
      opacity: 0;
    }

    50%,
    100% {
      opacity: 0;
      top: -35px;
    }
  }

  @keyframes drop-cancel-text {
    0% {
      opacity: 1;
      bottom: 0px;
    }

    35% {
      opacity: 0;
    }

    50%,
    100% {
      opacity: 0;
      bottom: -30px;
    }
  }

  @keyframes drop-comment-text {
    0%,
    50% {
      opacity: 0;
      top: -30px;
    }

    75% {
      opacity: 0;
    }

    100% {
      opacity: 1;
      top: 0px;
    }
  }
`;
