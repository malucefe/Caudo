import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const PROFILE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./profile').then(m => m.ProfileComponent), canActivate: [authGuard] }
];
