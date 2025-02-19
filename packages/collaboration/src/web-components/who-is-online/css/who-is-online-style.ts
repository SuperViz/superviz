import { css } from 'lit';

export const whoIsOnlineStyle = css`
  .who-is-online__participant-list {
    display: flex;
    align-items: center;
    gap: 4px;
    position: relative;
  }

  .who-is-online {
    display: flex;
    flex-direction: column;
    position: fixed;
    z-index: 99;
  }

  .who-is-online__presence-control-message__text {
    margin: 0;
  }

  .who-is-online__participant {
    border-radius: 50%;
    box-sizing: border-box;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    cursor: pointer;
    transition: opacity 0.3s ease-in-out;
    border: 2px solid #878291;
    border-radius: 50%;
    max-width: 40px;
    flex: 1 0 40px;
  }

  .followed {
    border-style: dashed !important;
    animation: rotate 15s linear infinite;
  }

  .followed .who-is-online__participant__avatar {
    animation: nullifyRotate 15s linear infinite;
  }

  .private {
    opacity: 0.3;
  }

  @keyframes rotate {
    100% {
      transform: rotate(1turn);
    }
  }

  @keyframes nullifyRotate {
    100% {
      transform: rotate(-1turn);
    }
  }

  .who-is-online__participant.disable-dropdown {
    cursor: default;
  }

  .who-is-online__participant__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Open Sans';
    font-size: 14px;
    line-height: 14px;
    line-height: 14px;
    font-weight: bold;
    color: #26242a;
    object-fit: contain;
  }

  .superviz-who-is-online__excess {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Roboto;
    font-size: 14px;
    line-height: 16px;
    text-align: center;
    font-weight: bold;
    cursor: pointer;
    color: #aea9b8;
  }

  .excess_participants:hover,
  .excess_participants--open {
    background-color: #aea9b8 !important;
  }

  .excess_participants:hover > div,
  .excess_participants--open > div {
    color: #fff !important;
  }

  @media (max-width: 780px) {
    .who-is-online__participant {
      width: 32px;
      height: 32px;
    }

    .who-is-online__participant {
      flex: 1 0 32px;
      max-width: 32px;
    }

    .who-is-online__participant__avatar {
      width: 24px;
      height: 24px;
    }

    .who-is-online__participant-list {
      gap: 8px;
    }

    .superviz-who-is-online__excess {
      width: 24px;
      height: 24px;
      font-size: 12px;
      line-height: 12px;
    }
  }
`;
