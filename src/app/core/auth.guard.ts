import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsersService } from '../services/users.service';

export const authGuard: CanActivateFn = () => {
  const usersService = inject(UsersService);
  const router = inject(Router);

  return usersService.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
  const usersService = inject(UsersService);
  const router = inject(Router);

  if (!usersService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return usersService.getUserRole() === 'ADMIN'
    ? true
    : router.createUrlTree(['/home']);
};

/**
 * Personnel du cabinet : administrateurs et praticiens.
 * Reflete le @PreAuthorize("hasAnyRole('ADMIN', 'DENTIST')") des controleurs
 * patients et rendez-vous, pour eviter d'afficher un ecran qui finirait en 403.
 */
export const staffGuard: CanActivateFn = () => {
  const usersService = inject(UsersService);
  const router = inject(Router);

  if (!usersService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const role = usersService.getUserRole();
  return role === 'ADMIN' || role === 'DENTIST'
    ? true
    : router.createUrlTree(['/home']);
};
