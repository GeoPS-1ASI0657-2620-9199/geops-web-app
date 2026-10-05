import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout/layout';
import { LoginComponent } from './iam/presentation/pages/login/login.component';
import { RegisterComponent } from './iam/presentation/pages/register/register.component';
import { RegisterBusinessComponent } from './iam/presentation/pages/register-business/register-business.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  { path: 'login', component: LoginComponent, title: 'GeoPS - Iniciar sesión' },
  { path: 'register', component: RegisterComponent, title: 'GeoPS - Crear cuenta' },
  { path: 'register-business', component: RegisterBusinessComponent, title: 'GeoPS - Registrar negocio' },
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
        loadComponent: () =>
          import('./catalog/presentation/pages/campaigns-panel/campaigns.component').then(
            (m) => m.CampaignsComponent
          ),
        title: 'GeoPS - Mis campañas',
      },
      {
        path: 'campaigns/new',
        loadComponent: () =>
          import('./catalog/presentation/pages/create-campaign/crear-campaign.component').then(
            (m) => m.CrearCampaignComponent
          ),
        title: 'GeoPS - Publicar campaña',
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
