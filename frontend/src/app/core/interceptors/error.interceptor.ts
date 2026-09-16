import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isPlatformBrowser(platformId)) {
        localStorage.removeItem('caudo_token');
        localStorage.removeItem('caudo_user');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
