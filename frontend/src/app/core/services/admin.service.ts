import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AdminCategory, AdminMetrics, AdminSystem, AdminUser, AuditRow, ErrorRow, Page } from '../models/admin.model';
import { UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = inject(ApiService);

  users(q: { search?: string; rol?: string; estado?: string; page?: number }): Observable<Page<AdminUser>> {
    const params: Record<string, string> = { page: String(q.page ?? 1), limit: '10' };
    if (q.search) params['search'] = q.search;
    if (q.rol) params['rol'] = q.rol;
    if (q.estado) params['estado'] = q.estado;
    return this.api.get('/admin/users', params);
  }
  createUser(b: { nombre: string; email: string; password: string; rol: UserRole }): Observable<AdminUser> { return this.api.post('/admin/users', b); }
  updateUser(id: string, b: { nombre?: string; email?: string; rol?: UserRole }): Observable<AdminUser> { return this.api.patch(`/admin/users/${id}`, b); }
  suspend(id: string): Observable<AdminUser> { return this.api.post(`/admin/users/${id}/suspend`, {}); }
  reactivate(id: string): Observable<AdminUser> { return this.api.post(`/admin/users/${id}/reactivate`, {}); }

  categories(): Observable<AdminCategory[]> { return this.api.get('/admin/categories'); }
  createCategory(b: { nombre: string; tipo: string; icono?: string }) { return this.api.post('/admin/categories', b); }
  updateCategory(id: string, b: { nombre?: string; icono?: string }) { return this.api.patch(`/admin/categories/${id}`, b); }
  deleteCategory(id: string) { return this.api.delete(`/admin/categories/${id}`); }

  metrics(): Observable<AdminMetrics> { return this.api.get('/admin/metrics'); }
  system(): Observable<AdminSystem> { return this.api.get('/admin/system'); }
  audit(page: number, accion?: string): Observable<Page<AuditRow>> {
    const params: Record<string, string> = { page: String(page), limit: '15' };
    if (accion) params['accion'] = accion;
    return this.api.get('/admin/audit', params);
  }
  errors(page: number): Observable<Page<ErrorRow>> { return this.api.get('/admin/errors', { page: String(page), limit: '15' }); }
}
