import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { AdminCategory, AdminMetrics, AdminSystem, AdminUser, AuditRow, ErrorRow, Page } from '../../core/models/admin.model';
import { UserRole } from '../../core/models/user.model';

type Tab = 'resumen' | 'usuarios' | 'categorias' | 'auditoria' | 'errores';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CopCurrencyPipe],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Panel de administración</h1>
        <p>Gestión de cuentas, catálogo global, métricas de uso y monitoreo. Solo se muestran datos agregados; no verás las finanzas de las personas.</p></div></div>

      <div class="tabs">
        @for (t of tabs; track t.id) {
          <button [class.active]="tab() === t.id" (click)="go(t.id)">{{ t.label }}</button>
        }
      </div>

      @switch (tab()) {
        @case ('resumen') {
          @if (metrics(); as m) {
            <div class="grid cols-3">
              <div class="card kpi"><div class="label">Cuentas</div><div class="value">{{ m.usuarios.total }}</div>
                <div class="muted">{{ m.usuarios.activos }} activas · {{ m.usuarios.suspendidos }} suspendidas · {{ m.usuarios.administradores }} admin</div></div>
              <div class="card kpi"><div class="label">Registros nuevos (30 días)</div><div class="value">{{ m.usuarios.nuevos30d }}</div>
                <div class="muted">{{ m.usuarios.conAcceso30d }} cuentas con acceso en 30 días</div></div>
              <div class="card kpi"><div class="label">Transacciones</div><div class="value">{{ m.transacciones.total }}</div>
                <div class="muted">{{ m.transacciones.ultimos30d.ingresos + m.transacciones.ultimos30d.egresos }} en los últimos 30 días</div></div>
              <div class="card kpi"><div class="label">Volumen 30 días · ingresos</div><div class="value pos">{{ m.transacciones.ultimos30d.volumenIngresos | copCurrency }}</div></div>
              <div class="card kpi"><div class="label">Volumen 30 días · egresos</div><div class="value neg">{{ m.transacciones.ultimos30d.volumenEgresos | copCurrency }}</div></div>
              <div class="card kpi"><div class="label">Errores de API (24 h)</div><div class="value" [class.neg]="m.errores24h > 0">{{ m.errores24h }}</div></div>
            </div>
            <div class="grid cols-2" style="margin-top:1rem">
              <div class="card"><h3>Uso de módulos</h3>
                <div class="row"><span>Presupuestos</span><strong>{{ m.modulos.presupuestos }}</strong></div>
                <div class="row"><span>Metas de ahorro</span><strong>{{ m.modulos.metas }}</strong></div>
                <div class="row"><span>Créditos registrados</span><strong>{{ m.modulos.creditos }}</strong></div></div>
              <div class="card"><h3>Categorías de egreso más usadas (30 días)</h3>
                @for (c of m.topCategoriasEgreso30d; track c.categoria) {
                  <div class="row"><span>{{ c.categoria }}</span><strong>{{ c.cantidad }}</strong></div>
                } @empty { <div class="muted">Sin movimientos en el periodo.</div> }</div>
            </div>
            <div class="card" style="margin-top:1rem"><h3>Registros por mes</h3>
              @for (r of m.registrosPorMes; track r.mes) {
                <div class="row"><span>{{ r.mes }}</span><span style="flex:1;margin:0 .75rem"><span class="bar"><span class="ok" [style.width.%]="barPct(r.total, m)"></span></span></span><strong>{{ r.total }}</strong></div>
              } @empty { <div class="muted">Sin registros recientes.</div> }</div>
          } @else { <div class="card empty">Cargando métricas…</div> }

          @if (system(); as s) {
            <h2 style="margin:1.5rem 0 .75rem">Estado del sistema</h2>
            <div class="grid cols-3">
              <div class="card"><h3>API REST (NestJS)</h3>
                <span class="badge ok">En línea</span>
                <p class="muted">Entorno {{ s.api.entorno }} · Node {{ s.api.nodeVersion }}<br>Activa hace {{ uptime(s.api.uptimeSegundos) }}</p></div>
              <div class="card"><h3>Base de datos</h3>
                <span class="badge" [ngClass]="s.baseDatos.ok ? 'ok' : 'excedido'">{{ s.baseDatos.ok ? 'Conectada' : 'Sin conexión' }}</span>
                <p class="muted">Latencia {{ s.baseDatos.latenciaMs }} ms</p></div>
              <div class="card"><h3>Automatización (n8n)</h3>
                @if (!s.n8n.configurado) { <span class="badge alerta">No configurado</span>
                  <p class="muted">Las recomendaciones usan el texto base; no hay webhook definido.</p> }
                @else { <span class="badge" [ngClass]="s.n8n.alcanzable ? 'ok' : 'excedido'">{{ s.n8n.alcanzable ? 'Disponible' : 'No responde' }}</span>
                  <p class="muted">{{ s.n8n.host }}@if (s.n8n.latenciaMs !== null) { · {{ s.n8n.latenciaMs }} ms }@if (s.n8n.detalle) { <br>{{ s.n8n.detalle }} }</p> }
              </div>
              <div class="card"><h3>IA generativa</h3>
                <span class="badge" [ngClass]="s.ia.configurada ? 'ok' : 'alerta'">{{ s.ia.configurada ? 'Activa' : 'Sin clave (usa reglas)' }}</span>
                <p class="muted">{{ s.ia.proveedor }} · {{ s.ia.modelo }}<br>Clasificación con IA: {{ s.ia.categorizacionActiva ? 'activada' : 'desactivada' }}</p></div>
            </div>
            <div class="card" style="margin-top:1rem"><h3>Ejecuciones de IA y automatización (últimas {{ s.webhooks.ventanaHoras }} h)</h3>
              <div class="row muted"><span>{{ s.webhooks.total }} ejecuciones · {{ s.webhooks.exitosos }} exitosas · {{ s.webhooks.fallidos }} fallidas</span><span>Promedio {{ s.webhooks.duracionPromedioMs }} ms</span></div>
              @for (w of s.webhooks.ultimas; track w.id) {
                <div class="row" style="margin-top:.4rem"><span>{{ w.createdAt | date:'dd/MM HH:mm:ss' }} · {{ w.flujo }}</span>
                  <span><span class="badge" [ngClass]="w.exitoso ? 'ok' : 'excedido'">{{ w.exitoso ? 'OK' : 'Falló' }}</span> <span class="muted">{{ w.duracionMs }} ms {{ w.error }}</span></span></div>
              }
            </div>
          }
        }

        @case ('usuarios') {
          <form class="card form-grid" (ngSubmit)="createUser()" #uf="ngForm">
            <label class="field">Nombre<input name="n" [(ngModel)]="newUser.nombre" required /></label>
            <label class="field">Correo<input name="e" type="email" [(ngModel)]="newUser.email" required /></label>
            <label class="field">Contraseña temporal<input name="p" type="text" [(ngModel)]="newUser.password" required /></label>
            <label class="field">Rol<select name="r" [(ngModel)]="newUser.rol"><option value="usuario">Usuario</option><option value="admin">Administrador</option></select></label>
            <button class="btn" type="submit" [disabled]="uf.invalid || busy()">Crear cuenta</button>
          </form>
          <p class="muted" style="margin:.5rem 0 1rem">La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo. La persona acepta la política de datos al usar su cuenta.</p>

          <div class="form-grid" style="margin-bottom:1rem">
            <label class="field">Buscar<input [(ngModel)]="filters.search" name="s" placeholder="Nombre o correo" (keyup.enter)="loadUsers(1)" /></label>
            <label class="field">Rol<select [(ngModel)]="filters.rol" name="fr" (change)="loadUsers(1)"><option value="">Todos</option><option value="usuario">Usuario</option><option value="admin">Administrador</option></select></label>
            <label class="field">Estado<select [(ngModel)]="filters.estado" name="fe" (change)="loadUsers(1)"><option value="">Todos</option><option value="activo">Activas</option><option value="suspendido">Suspendidas</option></select></label>
            <button class="btn ghost" (click)="loadUsers(1)">Buscar</button>
          </div>

          <div class="stack">
            @for (u of users()?.data ?? []; track u.id) {
              <div class="card">
                @if (editing()?.id === u.id) {
                  <div class="form-grid">
                    <label class="field">Nombre<input [(ngModel)]="editing()!.nombre" name="en" /></label>
                    <label class="field">Correo<input [(ngModel)]="editing()!.email" name="ee" type="email" /></label>
                    <label class="field">Rol<select [(ngModel)]="editing()!.rol" name="er" [disabled]="u.id === me()"><option value="usuario">Usuario</option><option value="admin">Administrador</option></select></label>
                    <span><button class="btn sm" (click)="saveEdit()" [disabled]="busy()">Guardar</button> <button class="btn ghost sm" (click)="editing.set(null)">Cancelar</button></span>
                  </div>
                } @else {
                  <div class="row">
                    <div><strong style="margin-right:.4rem">{{ u.nombre }}</strong> <span class="badge" [ngClass]="u.rol === 'admin' ? 'media' : 'ok'">{{ u.rol === 'admin' ? 'Administrador' : 'Usuario' }}</span>
                      <span class="badge" [ngClass]="u.activo ? 'ok' : 'excedido'" style="margin-left:.25rem">{{ u.activo ? 'Activa' : 'Suspendida' }}</span>
                      <div class="muted">{{ u.email }} · Creada {{ u.createdAt | date:'dd/MM/yyyy' }} · Último acceso {{ u.ultimoAcceso ? (u.ultimoAcceso | date:'dd/MM/yyyy HH:mm') : 'nunca' }}</div></div>
                    <span>
                      <button class="btn ghost sm" (click)="startEdit(u)">Editar</button>
                      @if (u.id !== me()) {
                        @if (u.activo) { <button class="btn danger sm" (click)="toggle(u)" style="margin-left:.4rem">Suspender</button> }
                        @else { <button class="btn sm" (click)="toggle(u)" style="margin-left:.4rem">Reactivar</button> }
                      }
                    </span>
                  </div>
                }
              </div>
            } @empty { <div class="card empty">No hay cuentas con esos filtros.</div> }
          </div>
          @if (users(); as p) {
            <div class="row" style="margin-top:1rem"><span class="muted">{{ p.total }} cuentas · página {{ p.page }} de {{ p.totalPages }}</span>
              <span><button class="btn ghost sm" [disabled]="p.page <= 1" (click)="loadUsers(p.page - 1)">Anterior</button>
                <button class="btn ghost sm" [disabled]="p.page >= p.totalPages" (click)="loadUsers(p.page + 1)" style="margin-left:.4rem">Siguiente</button></span></div>
          }
        }

        @case ('categorias') {
          <form class="card form-grid" (ngSubmit)="createCategory()" #cf="ngForm">
            <label class="field">Nombre<input name="cn" [(ngModel)]="newCat.nombre" required /></label>
            <label class="field">Tipo<select name="ct" [(ngModel)]="newCat.tipo"><option value="egreso">Egreso</option><option value="ingreso">Ingreso</option></select></label>
            <label class="field">Ícono (emoji)<input name="ci" [(ngModel)]="newCat.icono" maxlength="8" /></label>
            <button class="btn" type="submit" [disabled]="cf.invalid || busy()">Agregar categoría</button>
          </form>
          <p class="muted" style="margin:.5rem 0 1rem">Las categorías son globales: todas las personas las ven. Una categoría en uso no se puede eliminar; "Otros Gastos" y "Otros Ingresos" son del sistema.</p>
          <div class="stack">
            @for (c of categories(); track c.id) {
              <div class="card row">
                @if (editingCat()?.id === c.id) {
                  <div class="form-grid" style="flex:1">
                    <label class="field">Nombre<input [(ngModel)]="editingCat()!.nombre" name="ecn" [disabled]="c.protegida" /></label>
                    <label class="field">Ícono<input [(ngModel)]="editingCat()!.icono" name="eci" maxlength="8" /></label>
                    <span><button class="btn sm" (click)="saveCategory()" [disabled]="busy()">Guardar</button> <button class="btn ghost sm" (click)="editingCat.set(null)">Cancelar</button></span>
                  </div>
                } @else {
                  <div><strong style="margin-right:.4rem">{{ c.icono }} {{ c.nombre }}</strong> <span class="badge" [ngClass]="c.tipo === 'ingreso' ? 'ok' : 'alerta'">{{ c.tipo }}</span>
                    @if (c.protegida) { <span class="badge media" style="margin-left:.25rem">Sistema</span> }
                    <div class="muted">{{ c.transacciones }} transacciones</div></div>
                  <span><button class="btn ghost sm" (click)="startEditCategory(c)">Editar</button>
                    @if (!c.protegida) { <button class="btn danger sm" (click)="deleteCategory(c)" [disabled]="c.transacciones > 0" style="margin-left:.4rem">Eliminar</button> }</span>
                }
              </div>
            }
          </div>
        }

        @case ('auditoria') {
          <div class="form-grid" style="margin-bottom:1rem">
            <label class="field">Filtrar por acción<input [(ngModel)]="auditFilter" name="af" placeholder="user., category., auth." (keyup.enter)="loadAudit(1)" /></label>
            <button class="btn ghost" (click)="loadAudit(1)">Filtrar</button>
          </div>
          <div class="stack">
            @for (a of audit()?.data ?? []; track a.id) {
              <div class="card"><div class="row"><strong>{{ a.accion }}</strong><span class="muted">{{ a.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</span></div>
                <div class="muted">Por {{ a.actorEmail ?? 'anónimo' }}@if (a.entidad) { · {{ a.entidad }} }</div>
                @if (a.detalle) { <div class="muted" style="word-break:break-all">{{ a.detalle | json }}</div> }</div>
            } @empty { <div class="card empty">Sin registros de auditoría.</div> }
          </div>
          @if (audit(); as p) {
            <div class="row" style="margin-top:1rem"><span class="muted">{{ p.total }} registros · página {{ p.page }} de {{ p.totalPages }}</span>
              <span><button class="btn ghost sm" [disabled]="p.page <= 1" (click)="loadAudit(p.page - 1)">Anterior</button>
                <button class="btn ghost sm" [disabled]="p.page >= p.totalPages" (click)="loadAudit(p.page + 1)" style="margin-left:.4rem">Siguiente</button></span></div>
          }
        }

        @case ('errores') {
          <p class="muted" style="margin-bottom:1rem">Errores internos (5xx) de la API REST. No se guardan cuerpos de petición ni datos financieros.</p>
          <div class="stack">
            @for (e of errors()?.data ?? []; track e.id) {
              <div class="card"><div class="row"><strong><span class="badge excedido">{{ e.statusCode }}</span> {{ e.metodo }} {{ e.ruta }}</strong><span class="muted">{{ e.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</span></div>
                <div class="muted" style="word-break:break-word">{{ e.mensaje }}</div></div>
            } @empty { <div class="card empty">No hay errores registrados. 🎉</div> }
          </div>
          @if (errors(); as p) {
            <div class="row" style="margin-top:1rem"><span class="muted">{{ p.total }} errores · página {{ p.page }} de {{ p.totalPages }}</span>
              <span><button class="btn ghost sm" [disabled]="p.page <= 1" (click)="loadErrors(p.page - 1)">Anterior</button>
                <button class="btn ghost sm" [disabled]="p.page >= p.totalPages" (click)="loadErrors(p.page + 1)" style="margin-left:.4rem">Siguiente</button></span></div>
          }
        }
      }
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private admin = inject(AdminService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  tabs: { id: Tab; label: string }[] = [
    { id: 'resumen', label: 'Resumen y estado' },
    { id: 'usuarios', label: 'Cuentas' },
    { id: 'categorias', label: 'Categorías' },
    { id: 'auditoria', label: 'Auditoría' },
    { id: 'errores', label: 'Errores API' },
  ];
  tab = signal<Tab>('resumen');
  busy = signal(false);
  me = signal<string>(this.auth.getCurrentUser()?.id ?? '');

  metrics = signal<AdminMetrics | null>(null);
  system = signal<AdminSystem | null>(null);
  users = signal<Page<AdminUser> | null>(null);
  categories = signal<AdminCategory[]>([]);
  audit = signal<Page<AuditRow> | null>(null);
  errors = signal<Page<ErrorRow> | null>(null);

  filters = { search: '', rol: '', estado: '' };
  auditFilter = '';
  newUser: { nombre: string; email: string; password: string; rol: UserRole } = { nombre: '', email: '', password: '', rol: 'usuario' };
  newCat = { nombre: '', tipo: 'egreso', icono: '' };
  editing = signal<{ id: string; nombre: string; email: string; rol: UserRole } | null>(null);
  editingCat = signal<{ id: string; nombre: string; icono: string } | null>(null);

  ngOnInit(): void { this.go('resumen'); }

  go(t: Tab): void {
    this.tab.set(t);
    if (t === 'resumen') {
      this.admin.metrics().subscribe({ next: (m) => this.metrics.set(m), error: (e) => this.fail(e) });
      this.admin.system().subscribe({ next: (s) => this.system.set(s), error: (e) => this.fail(e) });
    }
    if (t === 'usuarios') this.loadUsers(1);
    if (t === 'categorias') this.loadCategories();
    if (t === 'auditoria') this.loadAudit(1);
    if (t === 'errores') this.loadErrors(1);
  }

  private fail(e: { error?: { message?: string | string[] } }, fallback = 'No se pudo completar la acción'): void {
    const m = e?.error?.message;
    this.toast.error(Array.isArray(m) ? m.join('. ') : m || fallback);
    this.busy.set(false);
  }

  barPct(v: number, m: AdminMetrics): number {
    const max = Math.max(...m.registrosPorMes.map((r) => r.total), 1);
    return Math.round((v / max) * 100);
  }

  uptime(sec: number): string {
    if (sec < 3600) return `${Math.floor(sec / 60)} min`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} h`;
    return `${Math.floor(sec / 86400)} d`;
  }

  // ---- Cuentas ----
  loadUsers(page: number): void {
    this.admin.users({ ...this.filters, page }).subscribe({ next: (p) => this.users.set(p), error: (e) => this.fail(e) });
  }
  createUser(): void {
    this.busy.set(true);
    this.admin.createUser(this.newUser).subscribe({
      next: () => { this.toast.success('Cuenta creada'); this.newUser = { nombre: '', email: '', password: '', rol: 'usuario' }; this.busy.set(false); this.loadUsers(1); },
      error: (e) => this.fail(e),
    });
  }
  startEdit(u: AdminUser): void { this.editing.set({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }); }
  saveEdit(): void {
    const e = this.editing();
    if (!e) return;
    this.busy.set(true);
    const body: { nombre: string; email: string; rol?: UserRole } = { nombre: e.nombre, email: e.email };
    if (e.id !== this.me()) body.rol = e.rol;
    this.admin.updateUser(e.id, body).subscribe({
      next: () => { this.toast.success('Cuenta actualizada'); this.editing.set(null); this.busy.set(false); this.loadUsers(this.users()?.page ?? 1); },
      error: (err) => this.fail(err),
    });
  }
  toggle(u: AdminUser): void {
    const call = u.activo ? this.admin.suspend(u.id) : this.admin.reactivate(u.id);
    call.subscribe({
      next: () => { this.toast.success(u.activo ? 'Cuenta suspendida' : 'Cuenta reactivada'); this.loadUsers(this.users()?.page ?? 1); },
      error: (err) => this.fail(err),
    });
  }

  // ---- Categorías ----
  loadCategories(): void { this.admin.categories().subscribe({ next: (c) => this.categories.set(c), error: (e) => this.fail(e) }); }
  createCategory(): void {
    this.busy.set(true);
    this.admin.createCategory({ ...this.newCat, icono: this.newCat.icono || undefined }).subscribe({
      next: () => { this.toast.success('Categoría creada'); this.newCat = { nombre: '', tipo: 'egreso', icono: '' }; this.busy.set(false); this.loadCategories(); },
      error: (e) => this.fail(e),
    });
  }
  startEditCategory(c: AdminCategory): void { this.editingCat.set({ id: c.id, nombre: c.nombre, icono: c.icono ?? '' }); }
  saveCategory(): void {
    const e = this.editingCat();
    if (!e) return;
    this.busy.set(true);
    this.admin.updateCategory(e.id, { nombre: e.nombre, icono: e.icono }).subscribe({
      next: () => { this.toast.success('Categoría actualizada'); this.editingCat.set(null); this.busy.set(false); this.loadCategories(); },
      error: (err) => this.fail(err),
    });
  }
  deleteCategory(c: AdminCategory): void {
    this.admin.deleteCategory(c.id).subscribe({
      next: () => { this.toast.success('Categoría eliminada'); this.loadCategories(); },
      error: (err) => this.fail(err),
    });
  }

  // ---- Monitoreo ----
  loadAudit(page: number): void { this.admin.audit(page, this.auditFilter.trim() || undefined).subscribe({ next: (p) => this.audit.set(p), error: (e) => this.fail(e) }); }
  loadErrors(page: number): void { this.admin.errors(page).subscribe({ next: (p) => this.errors.set(p), error: (e) => this.fail(e) }); }
}
