import { PushProvider, PushSubscriptionStorage, PushSubscriptionsRepository } from '../domain/ports/push.provider';
import { FcmPushProvider } from './fcm-push.provider';
import { HttpPushSubscriptionsRepository } from './http-push-subscriptions.repository';
import { BrowserPushSubscriptionStorage } from './browser-push-subscription.storage';
import { Provider, inject } from '@angular/core';
import { LOCATION_READING_OBSERVER } from '../../catalog/application/location-reading-observer';
import { RecordLastLocationUseCase } from '../application/record-last-location.use-case';
import { NotificationRepository } from '../domain/ports/notification.repository';
import { HttpNotificationRepository } from './http-notification.repository';
export const notificationProviders: Provider[] = [
  { provide: PushProvider, useClass: FcmPushProvider },
  { provide: PushSubscriptionsRepository, useClass: HttpPushSubscriptionsRepository },
  { provide: PushSubscriptionStorage, useClass: BrowserPushSubscriptionStorage },
  { provide: NotificationRepository, useClass: HttpNotificationRepository },
  { provide: LOCATION_READING_OBSERVER, useFactory: () => {
    const record = inject(RecordLastLocationUseCase);
    return (reading: import('../../catalog/domain/model/location-reading').GrantedReading) => record.execute({ ...reading.point, accuracyMeters: Math.max(1, Math.round(reading.accuracyMeters)), capturedAt: new Date().toISOString() });
  } },
];
