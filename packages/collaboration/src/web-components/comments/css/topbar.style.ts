import { css } from 'lit';

export const topbarStyle = css`
  .comments__topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgb(var(--sv-gray-200));
    height: 50px;
  }

  .comments__topbar__title {
    margin: 0 16px;
    color: rgb(var(--sv-gray-600));
  }

  .comments__topbar__close-threads {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.15s;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    box-sizing: border-box;
    margin-right: 8px;
    padding-right: 2px;
  }

  .comments__topbar__close-threads:hover {
    background: rgb(var(--sv-gray-300));
  }
`;
