import { PublicSourceOffer } from '../domain/model/public-source-offer';

/** Test data: an offer of a public source with every field, overridable. */
export function publicSourceOffer(overrides: Partial<PublicSourceOffer> = {}): PublicSourceOffer {
  return {
    offerId: 9001,
    title: 'Feria de libros usados',
    sourceName: 'Municipalidad de Lima',
    distanceMeters: 420,
    walkMinutes: 6,
    category: 'Librería y útiles',
    address: 'Jr. de la Unión 300, Cercado de Lima',
    imageUrl: null,
    location: { latitude: -12.0464, longitude: -77.0306 },
    price: 0,
    validTo: '2099-10-30',
    ...overrides,
  };
}
