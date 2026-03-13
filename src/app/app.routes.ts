import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '',
    loadChildren: () => import('@app/core/routes/public.routes').then((m) => m.PUBLIC_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('@app/core/routes/private.routes').then((m) => m.PRIVATE_ROUTES),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('@app/views/public/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('@app/views/public/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
