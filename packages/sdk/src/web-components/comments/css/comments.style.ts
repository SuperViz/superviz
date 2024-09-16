import { css } from 'lit';

export const commentsStyle = css`
  .superviz-comments {
    --offset-left: 10px;
    --offset-right: 10px;
    --offset-top: 10px;
    --offset-bottom: 10px;

    display: flex;
    flex-direction: column;
    width: 320px;
    position: fixed;
    color: rgb(var(--sv-gray-700));
    background: rgb(var(--sv-white));
    top: 0px;
    bottom: 0;
    box-shadow: -2px 0 4px 0 rgba(0, 0, 0, 0.1);
    z-index: 100;
    overflow: hidden;
    transition: right 0.3s ease-out;
  }

  .header {
    width: 100%;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .toggle {
    display: flex;
    position: fixed;
    width: 100px;
    color: rgb(var(--sv-gray-700));
    background: rgb(var(--sv-white));
    top: 0;
    right: 0;
    bottom: 0;
  }

  .threads-on-left-side {
    left: var(--offset-left);
    top: var(--offset-top);
    bottom: var(--offset-bottom);
    border-radius: 8px;
  }

  .threads-on-right-side {
    right: var(--offset-right);
    top: var(--offset-top);
    bottom: var(--offset-bottom);
    border-radius: 8px;
  }

  #superviz-comments.threads-on-right-side.hide-at-right {
    right: -330px;
  }

  #superviz-comments.threads-on-left-side.hide-at-left {
    left: -330px;
  }

  .hide-at-right,
  .hide-at-left {
    animation: keep-opacity 0.3s ease-out;
    opacity: 0;
    visibility: hidden;
  }

  @keyframes keep-opacity {
    0%,
    99% {
      visibility: visible;
      opacity: 1;
    }

    100% {
      visibility: hidden;
      opacity: 0;
    }
  }
`;
