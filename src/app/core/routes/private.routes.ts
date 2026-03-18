import { DashboardLayout } from '@app/layouts/dashboard/dashboard.layout';
import { authGuard } from '../guards/auth.guard';

export  const PRIVATE_ROUTES = [
  {
    path: '',
    component: DashboardLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('@app/views/pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('@app/views/pages/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('@app/views/pages/roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('@app/views/pages/subscriptions/subscriptions.component').then(
            (m) => m.SubscriptionsComponent,
          ),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('@app/views/pages/properties/properties.component').then(
            (m) => m.PropertiesComponent,
          ),
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('@app/views/pages/vehicles/vehicles.component').then((m) => m.VehiclesComponent),
      },
      {
        path: 'vehicle-makes',
        loadComponent: () =>
          import('@app/views/pages/makes/makes.component').then((m) => m.MakesComponent),
      },
      {
        path: 'partners',
        loadComponent: () =>
          import('@app/views/pages/partners/partners.component').then((m) => m.PartnersComponent),
      },
      {
        path: 'testimonials',
        loadComponent: () =>
          import('@app/views/pages/testimonials/testimonials.component').then(
            (m) => m.TestimonialsComponent,
          ),
      },
      {
        path: 'adverts',
        loadComponent: () =>
          import('@app/views/pages/adverts/adverts.component').then((m) => m.AdvertsComponent),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('@app/views/pages/tickets/tickets.component').then((m) => m.TicketsComponent),
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('@app/views/pages/pricing/pricing.component').then((m) => m.PricingComponent),
      },
      {
        path: 'makes',
        loadComponent: () =>
          import('@app/views/pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('@app/views/pages/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('@app/views/pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'help',
        loadComponent: () =>
          import('@app/views/pages/help/help.component').then((m) => m.HelpComponent),
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('@app/views/pages/logs/logs.component').then((m) => m.LogsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('@app/views/pages/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
];
