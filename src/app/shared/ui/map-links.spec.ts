import { walkingDirectionsUrl } from './map-links';

describe('walkingDirectionsUrl', () => {
  const offer = { latitude: -12.1211, longitude: -77.0297 };

  it('walks on Google Maps from the place of the search to the offer', () => {
    const url = new URL(walkingDirectionsUrl(offer, { latitude: -12.12, longitude: -77.03 }));

    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('origin')).toBe('-12.12,-77.03');
    expect(url.searchParams.get('destination')).toBe('-12.1211,-77.0297');
    expect(url.searchParams.get('travelmode')).toBe('walking');
  });

  it('leaves the origin to Google Maps when there is no place to start from', () => {
    const url = new URL(walkingDirectionsUrl(offer));

    expect(url.searchParams.has('origin')).toBeFalse();
    expect(url.searchParams.get('destination')).toBe('-12.1211,-77.0297');
  });
});
