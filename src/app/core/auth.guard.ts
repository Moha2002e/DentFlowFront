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
