import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenStorageService } from './token-storage.service';

/**
 * Endpoints publics : ils ne doivent jamais porter de jeton.
 * Sinon une session periment en sessionStorage fait repondre 401 au serveur de
 * ressources avant meme d'atteindre le controleur, et l'utilisateur doit se
 * connecter deux fois de suite pour retrouver la main.
 */
const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);
  const token = storage.token;

  const isPublic = PUBLIC_PATHS.some((path) => request.url.includes(path));

  if (!token || isPublic) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        storage.clear();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
