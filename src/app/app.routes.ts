import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout/layout';
import { authGuard } from './iam/infrastructure/auth.guard';
import { roleGuard } from './iam/infrastructure/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' },
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
      {
        path: 'offers',
        loadComponent: () =>
          import('./catalog/presentation/pages/nearby-offers/ofertas.component').then(
            (m) => m.OfertasComponent
          ),
        title: 'GeoPS - Ofertas cercanas',
      },
      {
        path: 'offers/:id',
        loadComponent: () =>
          import('./catalog/presentation/pages/offer-detail/ver-oferta.component').then(
            (m) => m.VerOfertaComponent
          ),
        title: 'GeoPS - Detalle de oferta',
      },
      {
        path: 'campaigns',
        canActivate: [authGuard, roleGuard('BUSINESS_OWNER')],
        loadComponent: () =>
          import('./catalog/presentation/pages/campaigns-panel/campaigns.component').then(
            (m) => m.CampaignsComponent
          ),
        title: 'GeoPS - Mis campañas',
      },
      {
        path: 'campaigns/new',
        canActivate: [authGuard, roleGuard('BUSINESS_OWNER')],
        loadComponent: () =>
          import('./catalog/presentation/pages/create-campaign/crear-campaign.component').then(
            (m) => m.CrearCampaignComponent
          ),
        title: 'GeoPS - Publicar campaña',
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
