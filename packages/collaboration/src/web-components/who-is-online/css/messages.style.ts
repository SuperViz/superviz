import { css } from 'lit';

export const messagesStyle = css`
  .who-is-online__controls-messages {
    position: absolute;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 4px;
  }

  .who-is-online__presence-control-message {
    box-sizing: border-box;
    font-size: 12px;
    padding: 8px 10px;
    font-family: 'Roboto';
    border-radius: 6px;
    background-color: #fff;
    color: rgb(var(--sv-gray-700));
    border: 2px solid #e0e0e0;
    white-space: nowrap;
  }

  .who-is-online__pcm__text {
    margin: 0;
  }

  .who-is-online__presence-control-message span {
    margin-left: 3px;
    text-decoration: underline;
    cursor: pointer;
  }

  .left-side {
    left: 0;
  }

  .right-side {
    right: 0;
  }

  .left-side .who-is-online__presence-control-message {
    align-self: flex-start;
  }

  .right-side .who-is-online__presence-control-message {
    align-self: flex-end;
  }

  .bottom-side {
    bottom: auto;
    top: calc(100% + 5px);
  }

  .top-side {
    top: auto;
    bottom: calc(100% + 5px);
  }
`;
