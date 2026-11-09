import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout/layout';
import { authGuard } from './iam/infrastructure/auth.guard';
import { roleGuard } from './iam/infrastructure/role.guard';

const owner = [authGuard, roleGuard('BUSINESS_OWNER')];
const consumer = [authGuard, roleGuard('CONSUMER')];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/inicio' },
  { path: 'baja', loadComponent: () => import('./notification/presentation/pages/unsubscribe/unsubscribe.page').then(m => m.UnsubscribePage), title: 'GeoPS - Preferencias de correo' },
  {
    path: 'login',
    loadComponent: () =>
      import('./iam/presentation/pages/login/login.component').then((m) => m.LoginComponent),
    title: 'GeoPS - Iniciar sesiÃ³n',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./iam/presentation/pages/register/register.component').then((m) => m.RegisterComponent),
    title: 'GeoPS - Crear cuenta',
  },
  {
    path: 'register-business',
    loadComponent: () =>
      import('./iam/presentation/pages/register-business/register-business.component').then(
        (m) => m.RegisterBusinessComponent,
      ),
    title: 'GeoPS - Registrar negocio',
  },
  {
    path: '',
    component: Layout,
    children: [
      // Buyer tabs (Figma screens 1 to 10): Inicio, Ofertas, CategorÃ­as, Favoritos, Mis Cupones.
      {
        path: 'inicio',
        loadComponent: () => import('./catalog/presentation/pages/home/home.page').then((m) => m.HomePage),
        title: 'GeoPS - Inicio',
      },
      {
        path: 'offers',
        loadComponent: () =>
          import('./catalog/presentation/pages/nearby-offers/nearby-offers.page').then((m) => m.NearbyOffersPage),
        title: 'GeoPS - Ofertas',
      },
      {
        path: 'offers/:id',
        loadComponent: () =>
          import('./catalog/presentation/pages/offer-detail/offer-detail.page').then((m) => m.OfferDetailPage),
        title: 'GeoPS - Detalle de oferta',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./catalog/presentation/pages/categories/categories.page').then((m) => m.CategoriesPage),
        title: 'GeoPS - CategorÃ­as',
      },
      {
        path: 'follows',
        canActivate: consumer,
        loadComponent: () => import('./engagement/presentation/pages/follows/follows.page').then(m => m.FollowsPage),
        title: 'GeoPS - Comercios seguidos',
      },
      {
        path: 'preferences',
        canActivate: consumer,
        loadComponent: () => import('./notification/presentation/pages/preferences/preferences.page').then(m => m.PreferencesPage),
        title: 'GeoPS - Preferencias de avisos',
      },
      {
        path: 'favorites',
        canActivate: consumer,
        loadComponent: () =>
          import('./engagement/presentation/pages/favorites/favorites.page').then((m) => m.FavoritesPage),
        title: 'GeoPS - Favoritos',
      },
      {
        path: 'reservations',
        canActivate: consumer,
        loadComponent: () =>
          import('./reservation/presentation/pages/my-reservations/my-reservations.page').then(
            (m) => m.MyReservationsPage,
          ),
        title: 'GeoPS - Mis Cupones',
      },
      {
        path: 'reservations/:id',
        canActivate: consumer,
        loadComponent: () =>
          import('./reservation/presentation/pages/reservation-detail/reservation-detail.page').then(
            (m) => m.ReservationDetailPage,
          ),
        title: 'GeoPS - Mi reserva',
      },
      {
        path: 'reservations/:id/report',
        canActivate: consumer,
        loadComponent: () =>
          import('./reservation/presentation/pages/report/report.page').then((m) => m.ReportPage),
        title: 'GeoPS - Reportar un problema',
      },
      // Business tabs (Figma screens 7, 11, 12, 13, 34 and 36).
      {
        path: 'business',
        canActivate: owner,
        loadComponent: () =>
          import('./catalog/presentation/pages/business-summary/business-summary.page').then(
            (m) => m.BusinessSummaryPage,
          ),
        title: 'GeoPS - Resumen',
      },
      {
        path: 'business/verify',
        canActivate: owner,
        loadComponent: () =>
          import('./iam/presentation/pages/verify-business/verify-business.page').then((m) => m.VerifyBusinessPage),
        title: 'GeoPS - Verificar mi comercio',
      },
      {
        path: 'validate',
        canActivate: owner,
        loadComponent: () =>
          import('./reservation/presentation/pages/validate-code/validate-code.page').then((m) => m.ValidateCodePage),
        title: 'GeoPS - Validar cÃ³digo',
      },
      {
        path: 'campaigns',
        canActivate: owner,
        loadComponent: () =>
          import('./catalog/presentation/pages/campaigns-panel/campaigns.component').then((m) => m.CampaignsComponent),
        title: 'GeoPS - Mis campaÃ±as',
      },
      {
        path: 'campaigns/new',
        canActivate: owner,
        loadComponent: () =>
          import('./catalog/presentation/pages/create-campaign/create-campaign.page').then((m) => m.CreateCampaignPage),
        title: 'GeoPS - Nueva campaÃ±a',
      },
      {
        path: 'reports',
        canActivate: owner,
        loadComponent: () =>
          import('./reservation/presentation/pages/reports/reports.page').then((m) => m.ReportsPage),
        title: 'GeoPS - Reportes',
      },
      {
        path: 'comments',
        canActivate: owner,
        loadComponent: () => import('./engagement/presentation/pages/business-comments/business-comments.page').then(m => m.BusinessCommentsPage),
        title: 'GeoPS - Comentarios',
      },
      {
        path: 'forbidden',
        loadComponent: () => import('./core/layout/forbidden/forbidden').then((m) => m.Forbidden),
        title: 'GeoPS - Acceso denegado',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./core/layout/page-not-found/page-not-found').then((m) => m.PageNotFound),
    title: 'GeoPS - PÃ¡gina no encontrada',
  },
];
