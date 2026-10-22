export const UMBRAL_ALERTA = 80;
export const UMBRAL_EXCEDIDO = 100;

export type EstadoPresupuesto = 'ok' | 'alerta' | 'excedido';

export interface BudgetStatus {
  porcentaje: number;
  restante: number;
  estado: EstadoPresupuesto;
}

/** Porcentaje consumido de un tope y su estado (HU-12: alertas de sobreconsumo). */
export function evaluateBudget(limite: number, consumido: number): BudgetStatus {
  const porcentaje = limite > 0 ? Math.round((consumido / limite) * 10000) / 100 : 0;
  const estado: EstadoPresupuesto =
    porcentaje >= UMBRAL_EXCEDIDO ? 'excedido' : porcentaje >= UMBRAL_ALERTA ? 'alerta' : 'ok';
  return { porcentaje, restante: Math.round((limite - consumido) * 100) / 100, estado };
}

export function alertMessage(categoria: string, status: BudgetStatus, limite: number): string {
  if (status.estado === 'excedido') {
    return `Superaste el tope de ${categoria}: llevas ${status.porcentaje}% de $${limite.toLocaleString('es-CO')}.`;
  }
  return `Llevas ${status.porcentaje}% del tope de ${categoria}; te quedan $${status.restante.toLocaleString('es-CO')}.`;
}
