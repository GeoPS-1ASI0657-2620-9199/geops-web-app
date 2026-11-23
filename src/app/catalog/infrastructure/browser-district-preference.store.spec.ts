import { BrowserDistrictPreferenceStore, DISTRICT_KEY } from './browser-district-preference.store';

const LINCE = { name: 'Lince', center: { latitude: -12.0836, longitude: -77.0365 } };

describe('BrowserDistrictPreferenceStore', () => {
  const store = new BrowserDistrictPreferenceStore();

  afterEach(() => sessionStorage.removeItem(DISTRICT_KEY));

  it('keeps the picked district for the rest of the tab and forgets it on null', () => {
    store.write(LINCE);
    expect(store.read()).toEqual(LINCE);

    store.write(null);
    expect(sessionStorage.getItem(DISTRICT_KEY)).toBeNull();
    expect(store.read()).toBeNull();
  });

  it('ignores a saved value that is not a district with a valid center', () => {
    sessionStorage.setItem(DISTRICT_KEY, '{"name":"Lince","center":{"latitude":200,"longitude":0}}');
    expect(store.read()).toBeNull();

    sessionStorage.setItem(DISTRICT_KEY, 'Lince');
    expect(store.read()).toBeNull();
  });

  it('never throws when the browser blocks the storage', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('SecurityError');
    spyOn(Storage.prototype, 'setItem').and.throwError('SecurityError');

    expect(store.read()).toBeNull();
    expect(() => store.write(LINCE)).not.toThrow();
  });
});
