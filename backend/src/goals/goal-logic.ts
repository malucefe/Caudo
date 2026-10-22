import { addMonths, monthsBetween, toIsoDate } from '../common/utils/date.util';

export type Viabilidad = 'cumplida' | 'alta' | 'media' | 'baja';

export interface GoalProjection {
  porcentaje: number;
  faltante: number;
  mesesHastaLimite: number;
  /** Ahorro mensual necesario desde hoy para llegar a la fecha límite. */
  aporteMensualRequerido: number;
  /** Ritmo real: ahorrado / meses transcurridos desde la creación. */
  ritmoMensual: number;
  /** Fecha estimada de cumplimiento al ritmo actual (null si no hay ahorro aún). */
  fechaEstimada: string | null;
  viabilidad: Viabilidad;
  mensaje: string;
}

export interface GoalInput {
  montoObjetivo: number;
  montoAhorrado: number;
  fechaCreacion: Date;
  fechaLimite: Date;
  hoy?: Date;
}

/**
 * Seguimiento y proyección (HU de metas). La "viabilidad" es una estimación
 * determinista a partir del ritmo de ahorro, no una probabilidad estadística:
 *  - alta: la fecha estimada llega a tiempo;
 *  - media: se retrasa hasta un 25 % del plazo total;
 *  - baja: se retrasa más o no hay ahorro.
 */
export function projectGoal(g: GoalInput): GoalProjection {
  const hoy = g.hoy ?? new Date();
  const porcentaje = Math.min(100, Math.round((g.montoAhorrado / g.montoObjetivo) * 10000) / 100);
  const faltante = Math.max(0, Math.round((g.montoObjetivo - g.montoAhorrado) * 100) / 100);
  const mesesHastaLimite = Math.max(1, monthsBetween(hoy, g.fechaLimite));

  if (faltante === 0) {
    return { porcentaje: 100, faltante: 0, mesesHastaLimite, aporteMensualRequerido: 0, ritmoMensual: 0, fechaEstimada: null, viabilidad: 'cumplida', mensaje: '¡Meta cumplida!' };
  }

  const transcurridos = Math.max(1, monthsBetween(g.fechaCreacion, hoy));
  const ritmoMensual = Math.round((g.montoAhorrado / transcurridos) * 100) / 100;
  const aporteMensualRequerido = Math.round((faltante / mesesHastaLimite) * 100) / 100;

  if (ritmoMensual <= 0) {
    return { porcentaje, faltante, mesesHastaLimite, aporteMensualRequerido, ritmoMensual, fechaEstimada: null, viabilidad: 'baja', mensaje: `Aún no hay aportes. Necesitas ahorrar $${aporteMensualRequerido.toLocaleString('es-CO')} al mes para llegar a tiempo.` };
  }

  const mesesNecesarios = Math.ceil(faltante / ritmoMensual);
  const fechaEstimada = toIsoDate(addMonths(hoy, mesesNecesarios));
  const retraso = mesesNecesarios - mesesHastaLimite;
  const plazoTotal = Math.max(1, monthsBetween(g.fechaCreacion, g.fechaLimite));
  const viabilidad: Viabilidad = retraso <= 0 ? 'alta' : retraso <= plazoTotal * 0.25 ? 'media' : 'baja';

  const mensaje =
    viabilidad === 'alta'
      ? `Vas bien: al ritmo actual la alcanzarías hacia ${fechaEstimada}.`
      : `Al ritmo actual llegarías hacia ${fechaEstimada}; para cumplir a tiempo necesitas $${aporteMensualRequerido.toLocaleString('es-CO')} al mes.`;

  return { porcentaje, faltante, mesesHastaLimite, aporteMensualRequerido, ritmoMensual, fechaEstimada, viabilidad, mensaje };
}
