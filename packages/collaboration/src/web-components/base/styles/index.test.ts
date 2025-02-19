import { svHr } from './sv-hr.style';
import { typography } from './typography.style';
import { variableStyle } from './variables.style';

import * as cssStyles from './index';

describe('css', () => {
  test('should be export svHr', () => {
    expect(cssStyles.svHr).toBeDefined();
    expect(cssStyles.svHr).toBe(svHr);
  });

  test('should be export typography', () => {
    expect(cssStyles.typography).toBeDefined();
    expect(cssStyles.typography).toBe(typography);
  });

  test('should be export variableStyle', () => {
    expect(cssStyles.variableStyle).toBeDefined();
    expect(cssStyles.variableStyle).toBe(variableStyle);
  });
});
