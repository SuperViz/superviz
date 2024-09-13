import * as utils from '.';

describe('utils', () => {
  it('should have exports', () => {
    expect(utils).toEqual(expect.any(Object));
  });

  it('should not have undefined exports', () => {
    for (const k of Object.keys(utils)) expect(utils).not.toHaveProperty(k, undefined);
  });
});
