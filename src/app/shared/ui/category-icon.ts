/** Glyph of each category of the closed list of Catalog (OfferCategory, E2-06). */
const ICON_BY_CATEGORY: Readonly<Record<string, string>> = {
  'Gastronomía': 'restaurant',
  'Cafetería y panadería': 'bakery_dining',
  'Bodega y minimarket': 'storefront',
  'Salud y farmacia': 'medical_services',
  'Belleza y cuidado personal': 'content_cut',
  'Deporte': 'fitness_center',
  'Mascotas': 'pets',
  'Hogar y ferretería': 'home',
  'Librería y útiles': 'menu_book',
  'Servicios': 'local_laundry_service',
  'Cultura y entretenimiento': 'palette',
};

/**
 * Keywords for a category outside the list, such as the free text of offers published before the
 * list existed or of a public source.
 */
const ICON_BY_KEYWORD: ReadonlyArray<readonly [RegExp, string]> = [
  [/caf[eé]/i, 'coffee'],
  [/pan|pastel|torta|postre/i, 'bakery_dining'],
  [/belleza|barber|corte|spa|salud y belleza|u[ñn]as/i, 'content_cut'],
  [/salud|botica|farmacia|[óo]ptica/i, 'medical_services'],
  [/deporte|gimnasio|yoga|fitness/i, 'fitness_center'],
  [/mascota|veterinari/i, 'pets'],
  [/bodega|minimarket|market/i, 'storefront'],
  [/librer[ií]a|[úu]tiles/i, 'menu_book'],
  [/hogar|ferreter|flor/i, 'home'],
  [/cultura|taller|arte|cine/i, 'palette'],
  [/servicio|lavander/i, 'local_laundry_service'],
  [/gastronom|comida|men[úu]|restaurant|cevich|poller|chifa|pizza|buffet/i, 'restaurant'],
];

/** Material Symbols Rounded glyph for an offer category (Figma Icono/* components); a tag when unknown. */
export function categoryIcon(category: string | null | undefined): string {
  const direct = ICON_BY_CATEGORY[category?.trim() ?? ''];
  if (direct) {
    return direct;
  }
  const match = ICON_BY_KEYWORD.find(([pattern]) => pattern.test(category ?? ''));
  return match ? match[1] : 'sell';
}
