import { StoreType } from '../types/stores.types';

import { useStore } from './use-store';

describe('useStore', () => {
  test('should return an api to use a store', () => {
    const result = useStore.call(this, StoreType.GLOBAL);

    expect(result).toHaveProperty('subscribe');
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('publish');
  });
});
