import { Injectable } from '@angular/core';
import { PushSubscriptionStorage } from '../domain/ports/push.provider';
const STORAGE_PREFIX = 'geops.push-subscription.';
@Injectable()
export class BrowserPushSubscriptionStorage implements PushSubscriptionStorage {
  read(userId: number): number | null {
    try { const value = Number(localStorage.getItem(STORAGE_PREFIX + userId)); return Number.isInteger(value) && value > 0 ? value : null; }
    catch { return null; }
  }
  write(userId: number, subscriptionId: number) { try { localStorage.setItem(STORAGE_PREFIX + userId, String(subscriptionId)); } catch { } }
  clear(userId: number) { try { localStorage.removeItem(STORAGE_PREFIX + userId); } catch { } }
}
