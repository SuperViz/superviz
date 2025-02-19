import { css } from 'lit';

export const mentionListStyle = css`
  #mention-list {
    position: fixed;
    z-index: 1;
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: white;
    display: none;
    width: 216px;
    text-align: -webkit-center;
    border-radius: 2px;
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.3);
    padding-top: 4px;
    padding-bottom: 4px;
    /* Stiling scroll WebKit (Firefox) */
    scrollbar-width: 6px; /* Firefox */
    scrollbar-color: #888; /* Firefox */
    /* Style scroll WebKit (Chrome, Safari, Edge) */
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #888;
    }
  }

  .mention-item {
    cursor: pointer;
    align-items: center;
    display: flex;
    height: 48px;
    width: 208px;
    margin-left: 4px;
    margin-right: 4px;
  }

  .mention-item:hover {
    background: rgb(var(--sv-gray-200));
  }

  .avatar {
    width: 32px;
    height: 32px;
    object-fit: contain;
    border-radius: 32%;
    margin-right: 14px;
    margin-left: 12px;
  }

  .default-avatar {
    width: 32px;
    height: 32px;
    margin-right: 14px;
    margin-left: 12px;
    border-radius: 50%;
    overflow: hidden;
    background-color: rgb(var(--sv-gray-300));
    border: 1px solid rgb(var(--sv-gray-500));
    color: #fff;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-type {
    font-family: Roboto;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    color: rgb(var(--sv-gray-600));
  }
`;
