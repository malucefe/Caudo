import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const TRANSACTIONS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./transaction-list/transaction-list').then(m => m.TransactionListComponent), canActivate: [authGuard] },
  { path: 'new', loadComponent: () => import('./transaction-form/transaction-form').then(m => m.TransactionFormComponent), canActivate: [authGuard] }
];
