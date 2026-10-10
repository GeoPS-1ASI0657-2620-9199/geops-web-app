import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout/layout';
import { SectionEmptyData } from './core/layout/section-empty/section-empty';
import { authGuard } from './iam/infrastructure/auth.guard';
import { roleGuard } from './iam/infrastructure/role.guard';

const owner = [authGuard, roleGuard('BUSINESS_OWNER')];
const consumer = [authGuard, roleGuard('CONSUMER')];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/inicio' },
  {
    path: 'login',
    loadComponent: () =>
      import('./iam/presentation/pages/login/login.component').then((m) => m.LoginComponent),
    title: 'GeoPS - Iniciar sesión',
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
      // Buyer tabs (Figma screens 1 to 10): Inicio, Ofertas, Categorías, Favoritos, Mis Cupones.
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
        title: 'GeoPS - Categorías',
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
        path: 'validate',
        canActivate: owner,
        loadComponent: () =>
          import('./reservation/presentation/pages/validate-code/validate-code.page').then((m) => m.ValidateCodePage),
        title: 'GeoPS - Validar código',
      },
      {
        path: 'campaigns',
        canActivate: owner,
        loadComponent: () =>
          import('./catalog/presentation/pages/campaigns-panel/campaigns.component').then((m) => m.CampaignsComponent),
        title: 'GeoPS - Mis campañas',
      },
      {
        path: 'campaigns/new',
        canActivate: owner,
        loadComponent: () =>
          import('./catalog/presentation/pages/create-campaign/create-campaign.page').then((m) => m.CreateCampaignPage),
        title: 'GeoPS - Nueva campaña',
      },
      {
        path: 'reports',
        canActivate: owner,
        loadComponent: () => import('./core/layout/section-empty/section-empty').then((m) => m.SectionEmpty),
        data: { i18n: 'reportsPage', icon: 'flag', actionRoute: '/validate' } satisfies SectionEmptyData,
        title: 'GeoPS - Reportes',
      },
      {
        path: 'comments',
        canActivate: owner,
        loadComponent: () => import('./core/layout/section-empty/section-empty').then((m) => m.SectionEmpty),
        data: { i18n: 'commentsPage', icon: 'forum', actionRoute: '/campaigns' } satisfies SectionEmptyData,
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
    title: 'GeoPS - Página no encontrada',
  },
];
