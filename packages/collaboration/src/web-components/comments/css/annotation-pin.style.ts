import { css } from 'lit';

export const annotationPinStyles = css`
  .preload {
    animation-duration: 0s !important;
  }

  .comments__annotation-pin,
  .comments__annotation-pin__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    pointer-events: auto;
    z-index: 10;
    transform-origin: bottom left;
  }

  .comments__annotation-pin:hover {
    transform: scale(1.2);
    animation: growing-spring 0.3s linear;
  }

  .comments__annotation-pin:not(:hover) {
    animation: shrinking-spring 0.3s linear;
  }

  .comments__annotation-pin--add {
    transform: scale(1) !important;
    animation: none !important;
  }

  .comments__annotation-pin {
    position: absolute;

    width: 32px;
    height: 32px;

    background-color: rgb(var(--sv-white));
    border-radius: 50%;
    border-bottom-left-radius: 2px;

    border: 2px solid rgb(var(--sv-white));
    box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.35);
    transition: border-color 0.2s ease-in-out opacity 0.2s ease-in-out;
    padding: 2px;
    box-sizing: border-box;
    cursor: pointer;
  }

  .comments__annotation-pin:hover,
  .comments__annotation-pin:focus,
  .comments__annotation-pin--active {
    border-color: rgb(var(--sv-primary));
  }

  .comments__cursor-pointer,
  .comments__cursor-pointer .comments__annotation-pin__avatar {
    pointer-events: none;
  }

  .comments__annotation-pin__avatar {
    width: 100%;
    height: 100%;

    background-color: rgb(var(--sv-gray-400));
    border-radius: 50%;

    color: rgb(var(--sv-white));
  }

  .comments__annotation-pin__avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: contain;
  }

  .comments__annotation-pin__avatar--add {
    color: rgb(var(--sv-gray-700));
    background-color: rgb(var(--sv-white));
  }

  .floating-input {
    position: absolute;
    top: -2px;
    opacity: 0;
  }

  .left .floating-input {
    right: auto;
    left: 0;
    transform: translateX(calc(-100% - 7px));
    opacity: 1;
  }

  .right .floating-input {
    left: auto;
    right: 0;
    transform: translateX(calc(100% + 7px));
    opacity: 1;
  }

  .comments__annotation-pin-wrapper {
    transform-origin: center;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    position: absolute;
  }

  .comments__annotation-pin-wrapper--new {
    animation: bounce 0.5s linear !important;
  }

  .comments__annotation-pin-wrapper--new .comments__annotation-pin__avatar {
    transform-origin: center;
    animation: avatar-bounce 0.5s linear !important;
  }

  @keyframes avatar-bounce {
    0%,
    40% {
      transform: scale(1);
    }

    48% {
      transform: scale(0.8);
    }

    55%,
    92% {
      transform: scale(1);
    }

    96% {
      transform: scale(0.9);
    }

    100% {
      transform: scale(1);
    }
  }
  @keyframes bounce {
    0% {
      transform: scale(1);
    }

    20% {
      transform: scale(1.3);
    }

    40%,
    55% {
      transform: scale(1);
    }

    75% {
      transform: scale(1.15);
    }

    92%,
    100% {
      transform: scale(1);
    }
  }

  @keyframes growing-spring {
    0% {
      transform: scale(1);
    }

    25% {
      transform: scale(1.3);
    }

    50% {
      transform: scale(1.2);
    }

    75% {
      transform: scale(1.25);
    }

    100% {
      transform: scale(1.2);
    }
  }

  @keyframes shrinking-spring {
    0% {
      transform: scale(1.2);
    }

    33% {
      transform: scale(1);
    }

    66% {
      transform: scale(1.1);
    }

    100% {
      transform: scale(1);
    }
  }
`;
