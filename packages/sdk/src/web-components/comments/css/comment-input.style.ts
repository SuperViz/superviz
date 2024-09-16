import { css } from 'lit';

export const commentInputStyle = css`
  .comments__input {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: rgb(var(--sv-white));
    border-radius: 4px;
    border: 1px solid rgb(var(--sv-gray-300));
    position: relative;
    min-height: 40px;
    box-sizing: border-box;
  }

  .comments__input:focus-within {
    border: 1px solid rgb(var(--sv-gray-500));
  }

  .comments__input__textarea {
    border: 0px;
    text-align: left;
    border-radius: 4px;
    outline: none;
    font-size: 14px;
    color: rgb(var(--sv-gray-700));
    font-family: Roboto;
    white-space: pre-wrap;
    word-wrap: break-word;
    resize: none;
    line-height: 1.15rem;
    max-height: 5rem;
    appearance: none;
    height: 40px;
    width: 100%;
    box-sizing: border-box;

    padding-top: 7px;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 11px solid transparent;
    border-left: 11px solid transparent;
  }

  .fixed-width {
    width: 288px;
  }

  .comments__input__textarea:invalid {
    border-top: 15px solid transparent;
  }

  .comments__input__textarea::placeholder {
    color: rgb(var(--sv-gray-400));
    font-size: 14px;
    line-height: 14px;
  }

  .comments__input__options {
    display: flex;
    justify-content: space-between;
    box-sizing: border-box;
    overflow: hidden;
    height: 0;
    transition: 0.25s;
    border-radius: 0 0 4px 4px;
  }

  .active-textarea {
    height: 40px;
    padding: 4px 8px;
  }

  .sv-hr {
    border: none;
    width: 100%;
    opacity: 0;
    transition: 0.25s opacity linear, 0.25s visibility;
    visibility: hidden;
    height: 0;
    position: absolute;
  }

  .comments__input__divisor {
    border-top: 1px solid rgb(var(--sv-gray-300));
    opacity: 1;
    position: relative;
    visibility: visible;
  }

  .comment-actions {
    position: absolute;
    left: 8px;
    bottom: 3px;
    opacity: 0;
    transition: 0.25s opacity linear, 0.25s visibility;
    visibility: hidden;
  }

  .active-textarea > .comment-actions {
    opacity: 1;
    visibility: visible;
  }

  .mention:hover {
    background-color: rgb(var(--sv-gray-200));
  }

  .comments__input__button {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    width: 32px;
    height: 32px;
    border: 0px;
  }

  .comments__input__send-button {
    background: rgb(var(--sv-primary));
    color: rgba(var(--sv-white), 1);
  }

  .align-send-btn > superviz-icon {
    cursor: pointer;
  }

  .comments__input__button:disabled {
    background: rgb(var(--sv-gray-200));
    color: rgb(var(--sv-gray-600));
  }

  .comment-input-options {
    display: flex;
    gap: 4px;
    position: absolute;
    right: 8px;
    bottom: 4px;
  }

  .comments__input__textarea:focus,
  .comments__input__textarea.active-textarea {
    border-radius: 4px 4px 0 0;
  }

  .comments__input__textarea:focus::placeholder {
    color: transparent;
  }
`;
