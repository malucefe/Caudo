import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    // On server, we can't check localStorage — allow the route to render
    // The client-side will handle the redirect on hydration
    return true;
  }

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
