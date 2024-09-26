import { config } from '.';

describe('config', () => {
  test('should set config field based on key', () => {
    config.set('apiKey', '123');
    config.set('environment', 'dev');
    config.set('participant', { id: '123', name: 'John' });
    config.set('roomName', 'room1');

    expect(config['config']).toEqual({
      apiKey: '123',
      environment: 'dev',
      participant: { id: '123', name: 'John' },
      roomName: 'room1',
    });
  });

  test('should get config field based on key', () => {
    config.set('apiKey', '123');
    config.set('environment', 'dev');
    config.set('participant', { id: '123', name: 'John' });
    config.set('roomName', 'room1');

    expect(config.get('apiKey')).toBe('123');
    expect(config.get('environment')).toBe('dev');
    expect(config.get('participant')).toEqual({ id: '123', name: 'John' });
    expect(config.get('roomName')).toBe('room1');
  });
});
