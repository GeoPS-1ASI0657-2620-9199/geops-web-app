import { CampaignZone, PublishedCampaign, todayInLima } from '../domain/model/campaign';

const DAY_MONTH = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', timeZone: 'UTC' });

function dayMonth(isoDay: string): string {
  const [year, month, day] = isoDay.split('-').map(Number);
  return DAY_MONTH.format(new Date(Date.UTC(year, month - 1, day)));
}

/** "Hasta el 8 de diciembre", "Desde el 12 de octubre hasta el 8 de diciembre" or "Terminó el 31 de agosto". */
export function campaignPeriodLabel(campaign: PublishedCampaign, today: string = todayInLima()): string {
  const { start, end } = campaign.period;
  if (campaign.status === 'FINISHED' || end < today) {
    return `Terminó el ${dayMonth(end)}`;
  }
  if (start > today) {
    return `Desde el ${dayMonth(start)} hasta el ${dayMonth(end)}`;
  }
  return `Hasta el ${dayMonth(end)}`;
}

/** "800 m alrededor del local" or "Distrito de Miraflores". */
export function zoneLabel(zone: CampaignZone): string {
  return zone.type === 'DISTRICT' ? `Distrito de ${zone.district}` : `${zone.radiusMeters} m alrededor del local`;
}

/** Reach Catalog gives a district zone (CampaignZone.DISTRICT_COVERAGE_METERS in catalog-service). */
export const DISTRICT_COVERAGE_METERS = 2000;
