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
          import('@app/views/private/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('@app/views/private/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('@app/views/private/roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('@app/views/private/subscriptions/subscriptions.component').then(
            (m) => m.SubscriptionsComponent,
          ),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('@app/views/private/properties/properties.component').then(
            (m) => m.PropertiesComponent,
          ),
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('@app/views/private/vehicles/vehicles.component').then((m) => m.VehiclesComponent),
      },
      {
        path: 'vehicle-makes',
        loadComponent: () =>
          import('@app/views/private/makes/makes.component').then((m) => m.MakesComponent),
      },
      {
        path: 'partners',
        loadComponent: () =>
          import('@app/views/private/partners/partners.component').then((m) => m.PartnersComponent),
      },
      {
        path: 'testimonials',
        loadComponent: () =>
          import('@app/views/private/testimonials/testimonials.component').then(
            (m) => m.TestimonialsComponent,
          ),
      },
      {
        path: 'adverts',
        loadComponent: () =>
          import('@app/views/private/adverts/adverts.component').then((m) => m.AdvertsComponent),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('@app/views/private/tickets/tickets.component').then((m) => m.TicketsComponent),
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('@app/views/private/pricing/pricing.component').then((m) => m.PricingComponent),
      },
      {
        path: 'makes',
        loadComponent: () =>
          import('@app/views/private/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('@app/views/private/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('@app/views/private/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'help',
        loadComponent: () =>
          import('@app/views/private/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('@app/views/private/logs/logs.component').then((m) => m.LogsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('@app/views/private/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
];
