import { InjectionToken } from '@angular/core';
import { isIosWithoutInstall } from './fcm-push.provider';

/** What this browser allows for push, read where the preferences page needs it (and faked in its specs). */
export interface PushEnvironment {
  /** iPhone or iPad Safari without GeoPS on the home screen: Safari only sends push to installed sites. */
  needsInstall(): boolean;
  /** The browser permission, or 'unsupported' when the browser has no notifications at all. */
  permission(): NotificationPermission | 'unsupported';
}

export function browserPushEnvironment(): PushEnvironment {
  return {
    needsInstall: () => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches === true ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      return isIosWithoutInstall(navigator.userAgent, standalone, navigator.maxTouchPoints);
    },
    permission: () => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission),
  };
}

export const PUSH_ENVIRONMENT = new InjectionToken<PushEnvironment>('PUSH_ENVIRONMENT', {
  providedIn: 'root',
  factory: browserPushEnvironment,
});
