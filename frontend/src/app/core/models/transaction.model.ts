import { Category } from './category.model';

export interface Transaction {
  id: string;
  userId: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  categoriaId: string;
  descripcion: string;
  fecha: string;
  archivoUrl: string | null;
  createdAt: string;
  category?: Category;
}

export interface CreateTransaction {
  tipo: 'ingreso' | 'egreso';
  monto: number;
  categoriaId: string;
  descripcion?: string;
  fecha: string;
  archivoUrl?: string;
}

export interface TransactionSummary {
  mes: number;
  anio: number;
  ingresos: number;
  egresos: number;
  balance: number;
  porCategoria: CategorySummary[];
}

export interface CategorySummary {
  categoria: string;
  icono: string;
  tipo: string;
  total: number;
  cantidad: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MonthlyTrend {
  mes: string;
  tipo: string;
  total: number;
}
