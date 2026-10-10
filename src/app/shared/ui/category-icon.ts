/**
 * Material Symbols Rounded glyph for an offer category (Figma Icono/* components). Catalog takes the
 * category as free text, so it matches by keywords and falls back to a tag.
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

export function categoryIcon(category: string | null | undefined): string {
  const match = ICON_BY_KEYWORD.find(([pattern]) => pattern.test(category ?? ''));
  return match ? match[1] : 'sell';
}
