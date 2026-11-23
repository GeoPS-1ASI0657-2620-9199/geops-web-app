export interface RelativeTime { key: string; count: number }

/** Relative age of a notice as an i18n key plus the number it needs ("hace 5 min", "ayer"). */
export function relativeTime(createdAt: string, now: number = Date.now()): RelativeTime {
  const elapsed = (now - new Date(createdAt).getTime()) / 60000;
  const minutes = Number.isNaN(elapsed) ? 0 : Math.max(0, Math.floor(elapsed));
  if (minutes < 1) return { key: 'notificationBell.time.now', count: 0 };
  if (minutes < 60) return { key: 'notificationBell.time.minutes', count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { key: 'notificationBell.time.hours', count: hours };
  const days = Math.floor(hours / 24);
  if (days === 1) return { key: 'notificationBell.time.yesterday', count: 1 };
  return { key: 'notificationBell.time.days', count: days };
}
