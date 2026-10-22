import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

/** Solo deja pasar al rol administrador; la API vuelve a validar el rol en cada petición. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  if (auth.isAdmin()) return true;
  router.navigate(['/dashboard']);
  return false;
};
