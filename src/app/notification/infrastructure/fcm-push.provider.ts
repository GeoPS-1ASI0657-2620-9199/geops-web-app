import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PushProvider } from '../domain/ports/push.provider';
import { PushNeedsInstallError, PushNotSupportedError, PushDeniedError, PushUnavailableError } from '../domain/model/push-errors';

export function isIosWithoutInstall(userAgent: string, standalone: boolean, touchPoints = 0): boolean {
  return (/iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1)) && !standalone;
}

@Injectable()
export class FcmPushProvider implements PushProvider {
  private stopForeground: (() => void) | null = null;
  async enable(): Promise<string> {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isIosWithoutInstall(navigator.userAgent, standalone, navigator.maxTouchPoints)) throw new PushNeedsInstallError();
    if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator)) throw new PushNotSupportedError();
    const config = environment.firebase;
    if (!config) throw new PushUnavailableError();
    const sdk = await import('firebase/messaging');
    if (!(await sdk.isSupported())) throw new PushNotSupportedError();
    if ((await Notification.requestPermission()) !== 'granted') throw new PushDeniedError();
    const firebase = await import('firebase/app');
    const { vapidKey, ...options } = config;
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js?config=' + encodeURIComponent(JSON.stringify(options)));
    await navigator.serviceWorker.ready;
    const app = firebase.getApps().length ? firebase.getApp() : firebase.initializeApp(options);
    const messaging = sdk.getMessaging(app);
    const token = await sdk.getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) throw new PushUnavailableError();
    this.stopForeground?.();
    this.stopForeground = sdk.onMessage(messaging, payload => {
      if (Notification.permission === 'granted' && payload.notification?.title) void registration.showNotification(payload.notification.title, { body: payload.notification.body, icon: '/favicon.ico' }).catch(() => {});
    });
    return token;
  }
  async disable(): Promise<void> {
    this.stopForeground?.(); this.stopForeground = null;
    if (!environment.firebase) return;
    const firebase = await import('firebase/app');
    if (!firebase.getApps().length) return;
    const sdk = await import('firebase/messaging');
    await sdk.deleteToken(sdk.getMessaging(firebase.getApp()));
  }
}
