import { PublicLayout } from '@app/layouts/public/public.layout';

export const PUBLIC_ROUTES = [
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: 'login',
        title: 'Sign In | Musondosi Admin',
        loadComponent: () =>
          import('@app/views/public/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'otp',
        title: 'MFA Verification | Musondosi Admin',
        loadComponent: () =>
          import('@app/views/public/otp/otp.component').then((m) => m.OtpComponent),
      }
    ],
  },
];
