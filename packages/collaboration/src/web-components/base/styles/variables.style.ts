import { css } from 'lit';

export const variableStyle = css`
  * {
    --sv-primary: 98, 16, 204;
    --sv-primary-900: 56, 7, 136;
    --sv-primary-200: 193, 161, 234;
    --sv-secondary: 193, 251, 223;
    --sv-gray: 126, 122, 136;
    --sv-success: 12, 185, 71;
    --sv-danger: 229, 65, 30;
    --sv-black: 19, 18, 21;
    --sv-white: 255, 255, 255;
    --sv-gray-100: 250, 250, 252;
    --sv-gray-200: 233, 229, 239;
    --sv-gray-300: 201, 196, 209;
    --sv-gray-400: 174, 169, 184;
    --sv-gray-500: 126, 122, 136;
    --sv-gray-600: 87, 83, 95;
    --sv-gray-700: 57, 54, 62;
    --sv-gray-800: 38, 36, 42;
  }

  .sv-gray-200 {
    color: rgb(var(--sv-gray-200));
  }

  .sv-gray-400 {
    color: rgb(var(--sv-gray-400));
  }

  .sv-gray-500 {
    color: rgb(var(--sv-gray-500));
  }

  .sv-gray-600 {
    color: rgb(var(--sv-gray-600));
  }

  .sv-gray-700 {
    color: rgb(var(--sv-gray-700));
  }
`;
