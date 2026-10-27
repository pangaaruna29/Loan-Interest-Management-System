import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const authenticatedRequest = request.clone({ withCredentials: true });

  return next(authenticatedRequest).pipe(catchError((error: HttpErrorResponse) => {
    if (
      isBrowser &&
      auth.isAuthenticated() &&
      error.status === 401 &&
      !['/api/login', '/api/session', '/api/logout'].includes(request.url)
    ) {
      auth.clearCurrentUser();
      void router.navigate(['/login']);
    }
    return throwError(() => error);
  }));
};