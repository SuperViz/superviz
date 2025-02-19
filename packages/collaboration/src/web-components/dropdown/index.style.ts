import { css } from 'lit';

export const dropdownStyle = css`
  .dropdown {
    position: relative;
    z-index: 100;
  }

  .dropdown-content {
    display: flex;
  }

  .select-clicked {
    border: 2px #26489a solid;
  }

  .dropdown-list {
    position: relative;
    z-index: 101;
  }

  .header {
    display: grid;
    grid-template-rows: 1fr 1px;
    align-items: center;
    padding: 0 10px;
    min-height: 42px;
    font-size: 16px;
    color: rgb(var(--sv-gray-600));
  }

  .menu {
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    opacity: 0;
    display: none;
    background: #fff;
    padding: 0;
    z-index: 1;
    transition: 0.2s;
    border-radius: 3px;
  }

  .items {
    list-style: none;
    padding: 0;
    color: #9fa5b5;
    margin: 0;
  }

  .text.username {
    font-size: 14px;
    text-align: left;

    display: inline-block;
    vertical-align: middle;
    line-height: normal;
    padding: 8px 0;
  }

  .items li {
    color: rgb(var(--sv-gray-600));
    text-transform: uppercase;
    padding: 0 10px;
    cursor: pointer;
    min-width: 103px;
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 5px;
    height: 42px;
  }

  .sv-icon {
    width: 40px;
    height: 40px;
    background-color: red;
  }

  .active {
    background: rgb(var(--sv-gray-200));
  }

  .items li:hover {
    background: rgb(var(--sv-gray-200));
  }

  .menu-open {
    display: block;
    opacity: 1;
    position: fixed;
  }

  .sv-hr {
    width: 100%;
    height: 1px;
    background: rgb(var(--sv-gray-300));
    padding: 0px;
    margin: 0px;
    justify-self: flex-end;
  }

  .option-label {
    white-space: nowrap;
    line-height: 1;
  }

  .who-is-online__controls__item__icon {
    line-height: 1;
  }

  .who-is-online__controls__item {
    align-items: center;
  }

  @media (max-width: 780px) {
    .menu--top-left,
    .menu--top-center,
    .menu--top-right {
      bottom: 36px;
    }
  }
`;
