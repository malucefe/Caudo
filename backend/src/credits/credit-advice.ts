import { AbonoInput, AbonoResult, CompraCarteraResult, ModalidadAbono, round2, simulateAbono } from './credit-math';

/** Formato COP para mensajes: 1654284 → "$1.654.284". */
export const cop = (n: number): string => `$${Math.round(n).toLocaleString('es-CO')}`;

// ----------------------------------------------------------- Abono: comparar modalidades

export interface AbonoComparison {
  reducirPlazo: AbonoResult;
  reducirCuota: AbonoResult;
  /** Modalidad que más intereses ahorra (la que más reduce el costo total). */
  recomendada: ModalidadAbono | null;
  /** Diferencia de intereses entre ambas modalidades a favor de la recomendada. */
  ventajaIntereses: number;
  mensaje: string;
}

/**
 * Calcula el abono en las dos modalidades y recomienda la que ahorra más
 * intereses, explicando la contrapartida (alivio mensual vs. costo total).
 */
export function compareAbono(input: Omit<AbonoInput, 'modalidad'>): AbonoComparison {
  const reducirPlazo = simulateAbono({ ...input, modalidad: 'reducir_plazo' });
  const reducirCuota = simulateAbono({ ...input, modalidad: 'reducir_cuota' });

  if (reducirPlazo.liquidaElCredito) {
    return {
      reducirPlazo, reducirCuota, recomendada: null, ventajaIntereses: 0,
      mensaje: `Este abono cubre todo el saldo: liquidas el crédito y te ahorras ${cop(reducirPlazo.ahorroIntereses)} en intereses futuros.`,
    };
  }

  const diff = round2(reducirPlazo.ahorroIntereses - reducirCuota.ahorroIntereses);
  if (Math.abs(diff) < 1) {
    return {
      reducirPlazo, reducirCuota, recomendada: null, ventajaIntereses: 0,
      mensaje: 'Ambas modalidades ahorran lo mismo en intereses; elige según prefieras terminar antes o pagar menos cada mes.',
    };
  }

  const recomendada: ModalidadAbono = diff > 0 ? 'reducir_plazo' : 'reducir_cuota';
  const ventaja = Math.abs(diff);
  const mensaje =
    recomendada === 'reducir_plazo'
      ? `Reducir el plazo te ahorra ${cop(ventaja)} más en intereses que reducir la cuota (terminas ${reducirPlazo.cuotasAhorradas} cuotas antes). ` +
        `Reducir la cuota solo conviene si necesitas liberar ${cop(reducirCuota.cuotaActual - reducirCuota.cuotaNueva)} al mes.`
      : `Reducir la cuota te ahorra ${cop(ventaja)} más en intereses que reducir el plazo.`;
  return { reducirPlazo, reducirCuota, recomendada, ventajaIntereses: ventaja, mensaje };
}

// ----------------------------------------------------------- Qué crédito abonar primero

export interface CreditLite {
  id: string;
  nombre: string;
  entidad?: string | null;
  tasaEA: number;
  saldoActual: number;
  cuotaMensual: number;
}

export interface PrioridadAbono {
  orden: { posicion: number; id: string; nombre: string; tasaEA: number; saldoActual: number }[];
  mensaje: string;
}

/**
 * Estrategia de "avalancha": el dinero extra rinde más si va primero a la deuda
 * de mayor tasa. Con empate de tasa se prefiere el menor saldo. Requiere 2+ créditos.
 */
export function prioritizeCredits(credits: CreditLite[]): PrioridadAbono | null {
  const vigentes = credits.filter((c) => c.saldoActual > 0);
  if (vigentes.length < 2) return null;
  const sorted = [...vigentes].sort((a, b) => b.tasaEA - a.tasaEA || a.saldoActual - b.saldoActual);
  const orden = sorted.map((c, i) => ({ posicion: i + 1, id: c.id, nombre: c.nombre, tasaEA: c.tasaEA, saldoActual: c.saldoActual }));
  const [primero, segundo] = sorted;
  const mensaje =
    primero.tasaEA === segundo.tasaEA
      ? `Tus créditos más caros tienen la misma tasa (${primero.tasaEA}% E.A.); abona primero a ${primero.nombre}, que tiene el menor saldo. Conserva siempre un fondo de emergencia antes de hacer abonos.`
      : `Si dispones de dinero extra, abónalo primero a "${primero.nombre}" (${primero.tasaEA}% E.A.): es tu deuda más cara, y cada peso abonado ahí ahorra más intereses que en "${segundo.nombre}" (${segundo.tasaEA}% E.A.). Conserva siempre un fondo de emergencia antes de hacer abonos.`;
  return { orden, mensaje };
}

// ----------------------------------------------------------- Compra de cartera: lectura del resultado

export type TipoAnalisisCartera = 'ahorra_y_baja_cuota' | 'ahorra_con_cuota_mayor' | 'baja_cuota_pero_cuesta_mas' | 'no_conviene';

export interface AnalisisCartera {
  tipo: TipoAnalisisCartera;
  mensaje: string;
}

export function describeCompraCartera(r: CompraCarteraResult, plazoNuevo?: number): AnalisisCartera {
  const bajaCuota = r.ahorroCuotaMensual > 0;
  if (r.ahorroTotal > 0 && bajaCuota) {
    return { tipo: 'ahorra_y_baja_cuota', mensaje: `Conviene: ahorras ${cop(r.ahorroTotal)} en total y tu cuota baja ${cop(r.ahorroCuotaMensual)} al mes.` };
  }
  if (r.ahorroTotal > 0) {
    return { tipo: 'ahorra_con_cuota_mayor', mensaje: `Conviene en costo total: ahorras ${cop(r.ahorroTotal)}, pero tu cuota sube ${cop(-r.ahorroCuotaMensual)} al mes porque terminas de pagar antes.` };
  }
  if (bajaCuota) {
    return {
      tipo: 'baja_cuota_pero_cuesta_mas',
      mensaje: `La cuota baja ${cop(r.ahorroCuotaMensual)} al mes, pero pagarías ${cop(-r.ahorroTotal)} más en total${r.plazoNuevoMayor ? ` por alargar el plazo (de ${r.cuotasRestantesActual} a ${plazoNuevo ?? 'más'} cuotas)` : ''}. Solo tendría sentido si necesitas aliviar tu flujo mensual.`,
    };
  }
  return { tipo: 'no_conviene', mensaje: `No conviene: pagarías ${cop(-r.ahorroTotal)} más en total y tu cuota no baja.` };
}
