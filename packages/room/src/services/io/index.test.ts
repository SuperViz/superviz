import { IOC } from '.';

describe('io', () => {
  let instance: IOC | null = null;

  beforeEach(() => {
    instance = new IOC({ id: 'unit-test-participant-id', name: 'unit-test-participant-name' });
  });

  afterEach(() => {
    instance?.destroy();
    instance = null;
  });

  test('should create an instance', () => {
    expect(instance).toBeInstanceOf(IOC);
  });

  test('should create a room', () => {
    const room = instance?.createRoom('test');

    expect(room).toBeDefined();
    expect(room).toHaveProperty('on');
    expect(room).toHaveProperty('off');
    expect(room).toHaveProperty('emit');
  });
});
