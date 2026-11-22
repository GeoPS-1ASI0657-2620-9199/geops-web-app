import { notificationProviders } from './notification/infrastructure/notification.providers';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { iamProviders } from './iam/infrastructure/iam.providers';
import { catalogProviders } from './catalog/infrastructure/catalog.providers';
import { engagementProviders } from './engagement/infrastructure/engagement.providers';
import { reservationProviders } from './reservation/infrastructure/reservation.providers';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/http/auth.interceptor';
import {provideTranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';
import { TranslatedDatepickerIntl } from './shared/ui/translated-datepicker-intl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
      fallbackLang: 'es'
    }),
    provideRouter(routes),
    // Every datepicker reads its buttons in the language of the app, Spanish by default.
    { provide: MatDatepickerIntl, useClass: TranslatedDatepickerIntl },
    ...iamProviders,
    ...catalogProviders,
    ...reservationProviders,
    ...engagementProviders,
    ...notificationProviders,
    // Material Symbols Rounded, the same icon set as the Figma Icono/* components.
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-rounded');
    }),
  ]
};
