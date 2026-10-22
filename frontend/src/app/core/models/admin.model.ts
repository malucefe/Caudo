import { UserRole } from './user.model';

export interface Page<T> { data: T[]; total: number; page: number; limit: number; totalPages: number; }

export interface AdminUser {
  id: string; nombre: string; email: string; rol: UserRole; activo: boolean;
  aceptaPolitica: boolean; ultimoAcceso: string | null; createdAt: string;
}

export interface AdminCategory {
  id: string; nombre: string; tipo: 'ingreso' | 'egreso'; icono: string | null;
  transacciones: number; protegida: boolean;
}

export interface AdminMetrics {
  usuarios: { total: number; activos: number; suspendidos: number; administradores: number; nuevos30d: number; conAcceso30d: number };
  registrosPorMes: { mes: string; total: number }[];
  transacciones: { total: number; ultimos30d: { ingresos: number; egresos: number; volumenIngresos: number; volumenEgresos: number } };
  modulos: { presupuestos: number; metas: number; creditos: number };
  topCategoriasEgreso30d: { categoria: string; cantidad: number }[];
  errores24h: number;
}

export interface WebhookRunRow { id: string; flujo: string; exitoso: boolean; duracionMs: number; error: string | null; createdAt: string; }

export interface AdminSystem {
  api: { estado: string; entorno: string; nodeVersion: string; uptimeSegundos: number; errores24h: number };
  baseDatos: { ok: boolean; latenciaMs: number };
  n8n: { configurado: boolean; host: string | null; alcanzable: boolean | null; latenciaMs: number | null; detalle?: string };
  ia: { configurada: boolean; proveedor: string; modelo: string; categorizacionActiva: boolean };
  webhooks: { ventanaHoras: number; total: number; exitosos: number; fallidos: number; duracionPromedioMs: number; ultimas: WebhookRunRow[] };
}

export interface AuditRow {
  id: string; actorId: string | null; actorEmail: string | null; accion: string;
  entidad: string | null; entidadId: string | null; detalle: Record<string, unknown> | null; createdAt: string;
}

export interface ErrorRow { id: string; statusCode: number; metodo: string; ruta: string; mensaje: string; createdAt: string; }
