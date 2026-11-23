/**
 * Districts of Lima Metropolitana and Callao, the area where Identity looks up the address of a business.
 * The owner picks one instead of typing it, so the address always carries its district and the map
 * lookup does not fail for a street name that exists in several districts (US38).
 */
export const ADDRESS_DISTRICTS: readonly string[] = [
  'Ancón', 'Ate', 'Barranco', 'Bellavista', 'Breña', 'Callao', 'Carabayllo', 'Carmen de la Legua Reynoso',
  'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina',
  'La Perla', 'La Punta', 'La Victoria', 'Lima', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar',
  'Mi Perú', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra',
  'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis',
  'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco',
  'Surquillo', 'Ventanilla', 'Villa El Salvador', 'Villa María del Triunfo',
];

/** Street and number on one side, district on the other. */
export interface AddressParts {
  readonly street: string;
  readonly district: string | null;
}

function comparable(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** The district as listed, ignoring case and accents, or null when it is not one of the list. */
export function knownDistrict(text: string): string | null {
  const wanted = comparable(text);
  return ADDRESS_DISTRICTS.find((district) => comparable(district) === wanted) ?? null;
}

/** Splits "Av. Larco 345, Miraflores" into its street and its district, when the last part is a known district. */
export function splitAddress(address: string): AddressParts {
  const cut = address.lastIndexOf(',');
  const district = cut >= 0 ? knownDistrict(address.slice(cut + 1)) : null;
  return district ? { street: address.slice(0, cut).trim(), district } : { street: address.trim(), district: null };
}

/** "street, district", without repeating the district when the street already ends with it. */
export function composeAddress(street: string, district: string): string {
  const parts = splitAddress(street);
  const base = parts.district === district ? parts.street : street.trim();
  return `${base.replace(/[\s,]+$/, '')}, ${district}`;
}
