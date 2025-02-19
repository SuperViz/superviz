import { css } from 'lit';

export const dropdownStyle = css`
  .dropdown {
    position: relative;
  }

  .who-is-online__extra-participant {
    display: flex;
    user-select: none;
    align-items: center;
    justify-items: start;
    gap: 4px;
    width: 100%;
    padding: 10px;
    border-radius: 2px;
    position: relative;
    cursor: pointer;
  }

  .who-is-online__extra-participant.disable-dropdown {
    cursor: default;
  }

  .who-is-online__extra-participant:hover,
  .who-is-online__extra-participant--selected {
    background-color: rgb(var(--sv-gray-200));
  }

  .who-is-online__participant {
    border-radius: 50%;
    box-sizing: border-box;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 2px solid #878291;
    border-radius: 50%;
    max-width: 40px;
    flex: 1 0 40px;
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
    font-weight: bold;
    color: #26242a;
    object-fit: contain;
  }

  .dropdown-list {
    position: relative;
    display: flex;
    flex-direction: column;
    z-index: 100;
  }

  .dropdown-list > div {
    padding: 4px;
    width: 216px;
    box-sizing: border-box;
  }

  .who-is-online__extras-dropdown {
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    opacity: 0;
    display: none;
    background: #fff;
    padding: 0;
    z-index: 1;
    transition: 0.2s;
    border-radius: 3px;
    max-height: 240px;
    overflow: auto;
  }

  .who-is-online__extras-dropdown superviz-dropdown:hover {
    z-index: 999;
    position: relative;
  }

  .who-is-online__extras__arrow-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu--bottom {
    top: 4px;
    min-width: 103px;
    position: absolute;
    right: 0;
  }

  .menu--top {
    bottom: 44px;
    min-width: 103px;
    position: absolute;
    right: 0px;
  }

  .menu-open {
    display: block;
    opacity: 1;
  }

  .superviz-who-is-online-dropdown__tooltip {
    background-color: rgb(var(--sv-gray-600));
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    position: absolute;
    top: 52px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 2px;
    opacity: 0;
    cursor: default;
    display: none;
    transition: opacity 0.2s ease-in-out display 0s;
  }

  .superviz-who-is-online-dropdown__tooltip-arrow {
    width: 13px;
    height: 13px;
    position: absolute;
    top: 0px;
    left: 50%;
    transform: rotate(45deg) translateX(-50%);
    background-color: rgb(var(--sv-gray-600));
    border-top-left-radius: 3px;
  }

  .dropdown-content:hover + .superviz-who-is-online-dropdown__tooltip {
    opacity: 1;
    display: block;
  }

  .tooltip-content {
    margin: 0;
    font-family: roboto;
    white-space: nowrap;
    text-align: center;
    color: white;
    font-size: 14px;
  }

  .who-is-online__extras__username {
    font-size: 14px;
    line-height: 20px;
    font-family: 'Open sans';
    color: rgb(var(--sv-gray-600));
  }

  .icon {
    flex: 1;
    justify-content: flex-end;
    display: flex;
  }

  .hide-icon {
    display: none;
  }

  @media (max-width: 780px) {
    .sv-icon,
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

    .dropdown-list > div {
      width: 192px;
    }

    .menu--top {
      bottom: 36px;
    }

    .superviz-who-is-online-dropdown__tooltip {
      top: 44px;
    }
  }
`;
