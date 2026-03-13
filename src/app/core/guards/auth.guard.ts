import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';


export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const allowedRoles = ['SUPERADMIN', 'SUPPORT'];
  const hasAccess = user.roles.some((role) => allowedRoles.includes(role.name.toUpperCase()));

  if (!hasAccess) {
    return router.createUrlTree(['/unauthorized']);
  }

  return true;
};
