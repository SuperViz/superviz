import { css } from 'lit';

export const annotationItemStyle = css`
  .comments__thread:hover:not(.comments__thread--selected) {
    background-color: rgba(var(--sv-gray-200), 0.3);
  }

  .avatars-comments {
    display: flex;
    position: absolute;
    bottom: 8px;
    padding: 0 8px;
    opacity: 1;
    transition: opacity 0.3s linear;
  }

  .avatars-comments.invisible {
    opacity: 0;
  }

  .avatar-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    overflow: hidden;
    background-color: rgb(var(--sv-gray-300));
    border: 1px solid rgb(var(--sv-gray-500));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
  }

  .avatar:not(:first-child) {
    margin-left: -6px;
  }

  .comments__thread--selected div:last-child {
    margin-inline: 8px;
  }

  .comments-container {
    display: flex;
    overflow: hidden;
    flex-direction: column;
  }

  .comments-container-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    overflow: hidden;
    transition: grid-template-rows 0.3s linear, opacity 0.3s linear;
  }

  .comments-container-wrapper.show {
    grid-template-rows: 1fr;
    opacity: 1;
  }

  .comments--expand {
    display: flex;
  }

  .comment-avatar--expand {
    display: block;
  }

  .hidden {
    overflow: hidden;
    opacity: 0;
  }

  .comments__thread {
    grid-row: 1 / span 2;
    padding: 8px;
    position: relative;
    cursor: pointer;
    transition: padding-bottom 0.3s linear, opacity 0.3s linear;
  }

  .extra-space-bottom {
    padding-bottom: 35px;
  }

  .comments__thread--selected {
    background-color: rgba(var(--sv-gray-200), 0.5);
    padding-bottom: 16px;
  }

  .hide-input {
    display: none;
  }

  .wrapper {
    margin-inline: 0;
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    width: 100%;
    transition: grid-template-rows 0.3s linear, opacity 0.3s linear;
  }

  .show-wrapper {
    grid-template-rows: 1fr;
    opacity: 1;
  }

  .comments__complete-annotation {
    position: relative;
    width: 100%;
  }

  .comments__hide-complete-annotation {
    min-height: 0;
    opacity: 0;
    animation: hide-annotation 10s linear;
  }

  @keyframes hide-annotation {
    0%,
    95% {
      min-height: 43px;
      opacity: 1;
    }

    100% {
      opacity: 0;
      min-height: 0;
    }
  }

  .comments__resolved-annotation-message {
    position: absolute;
    width: 100%;
    top: 0;
  }
`;
