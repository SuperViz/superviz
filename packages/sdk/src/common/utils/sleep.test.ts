import sleep from './sleep';

describe('sleep', () => {
  test('should resolve after the specified time', async () => {
    const start = Date.now();
    await sleep(1000);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(1000);
  });
});
