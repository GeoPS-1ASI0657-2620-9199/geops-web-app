/**
 * Campaign metrics helpers.
 *
 * CTR formula reference:
 *   CTR = (clicks / impressions) * 100
 * Example: (40 / 3000) * 100 = 1.3
 */
export function calculateCtr(
  clicks?: number | null,
  impressions?: number | null
): number {
  const safeClicks = Math.max(0, clicks ?? 0);
  const safeImpressions = Math.max(0, impressions ?? 0);

  if (safeImpressions === 0) {
    return 0;
  }

  const ctr = (safeClicks / safeImpressions) * 100;

  // Keep a single decimal place to match stakeholder expectation (e.g., 1.3%).
  return Number(ctr.toFixed(1));
}
