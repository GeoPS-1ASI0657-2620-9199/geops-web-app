import { BrowserRadiusPreferenceStore, RADIUS_KEY } from './browser-radius-preference.store';

describe('BrowserRadiusPreferenceStore', () => {
  const store = new BrowserRadiusPreferenceStore();

  afterEach(() => localStorage.removeItem(RADIUS_KEY));

  it('keeps the radius across visits (US46)', () => {
    store.write(15);

    expect(localStorage.getItem(RADIUS_KEY)).toBe('15');
    expect(store.read()).toBe(15);
  });

  it('ignores a saved value outside 5 to 20 minutes or that is not a number', () => {
    localStorage.setItem(RADIUS_KEY, '30');
    expect(store.read()).toBeNull();

    localStorage.setItem(RADIUS_KEY, 'diez');
    expect(store.read()).toBeNull();

    localStorage.removeItem(RADIUS_KEY);
    expect(store.read()).toBeNull();
  });

  it('never throws when the browser blocks the storage', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('SecurityError');
    spyOn(Storage.prototype, 'setItem').and.throwError('SecurityError');

    expect(store.read()).toBeNull();
    expect(() => store.write(15)).not.toThrow();
  });
});
