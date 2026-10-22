import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'budgets', loadComponent: () => import('./features/budgets/budgets').then(m => m.BudgetsComponent), canActivate: [authGuard] },
  { path: 'goals', loadComponent: () => import('./features/goals/goals').then(m => m.GoalsComponent), canActivate: [authGuard] },
  { path: 'credits', loadComponent: () => import('./features/credits/credits').then(m => m.CreditsComponent), canActivate: [authGuard] },
  { path: 'insights', loadComponent: () => import('./features/insights/insights').then(m => m.InsightsComponent), canActivate: [authGuard] },
  { path: 'admin', loadComponent: () => import('./features/admin/admin').then(m => m.AdminComponent), canActivate: [authGuard, adminGuard] },
  { path: 'transactions', loadChildren: () => import('./features/transactions/transactions.routes').then(m => m.TRANSACTIONS_ROUTES), canActivate: [authGuard] },
  { path: 'profile', loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES), canActivate: [authGuard] },
  { path: '**', redirectTo: 'auth/login' }
];
