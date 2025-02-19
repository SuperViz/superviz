import { css } from 'lit';

export const commentItemStyle = css`
  .reply {
    padding-left: 24px !important;
  }

  .comments__comment-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 8px;
    gap: 4px;
  }

  .comments__comment-item__header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    color: rgb(var(--sv-gray-500));
  }

  .comments__comment-item__actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .comments__comment-item__actions superviz-dropdown,
  .comments__comment-item__icons {
    width: 25px;
    height: 25px;
    border-radius: 50%;
  }

  .comments__comment-item__metadata {
    display: flex;
    width: 100%;
    gap: 8px;
    align-items: center;
  }

  .comments__comment-item__avatar-container {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    overflow: hidden;
    background-color: rgb(var(--sv-gray-300));
    border: 1px solid rgb(var(--sv-gray-500));
    color: #fff;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .comments__comment-item__avatar-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
  }

  .comments__comment-item__content {
    width: 100%;
    word-wrap: break-word;
  }

  .line-clamp {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .comments__comment-item__content__body {
    color: rgb(var(--sv-gray-700));
    position: relative;
    display: grid;
    grid-template-rows: 0px auto;
  }

  .comments__comment-item__content__body.editing-annotation {
    grid-template-rows: auto 0px;
  }

  .hidden {
    display: none;
  }

  .mentioned {
    display: inline-block;
  }

  .annotation-content {
    transition: opacity 0ms;
    opacity: 1;
    overflow: hidden;
  }

  .editing {
    transition: opacity 400ms;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }

  .comments__input--editable {
    transform: translateY(0);
    opacity: 1;
    overflow: hidden;
  }

  .hide-edit-input {
    transition: opacity 500ms, transform 0 linear 300ms;
    opacity: 0;
    pointer-events: none;
    width: 100%;
  }
`;
