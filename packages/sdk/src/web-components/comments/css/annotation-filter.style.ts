import { css } from 'lit';

export const annotationFilterStyle = css`
  .comments__filter-container {
    display: flex;
    width: 100%;
    justify-content: flex-start;
    align-items: center;
  }

  .comments__filter {
    white-space: nowrap;
    padding: 12px;
    cursor: pointer;
    color: rgb(var(--sv-gray-500));
  }

  .content {
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }

  .comments__filter__toggle-button {
    display: flex;
    flex-direction: row;
    gap: 4px;
  }

  .comments__filter__icon {
    margin-top: -2px;
  }
`;
