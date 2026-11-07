import { isIosWithoutInstall } from './fcm-push.provider';
describe('iPhone installation requirement', () => {
  it('requires installation on iPhone and desktop-mode iPad but not desktop browsers', () => {
    expect(isIosWithoutInstall('iPhone', false)).toBeTrue();
    expect(isIosWithoutInstall('iPhone', true)).toBeFalse();
    expect(isIosWithoutInstall('Macintosh', false, 5)).toBeTrue();
    expect(isIosWithoutInstall('Windows', false)).toBeFalse();
  });
});
