/**
 * Matemática financiera del módulo de créditos (sistema de amortización francés:
 * cuota fija). Todas las funciones son puras para poder probarlas aisladas.
 * Las tasas se expresan como Efectiva Anual (E.A.) en porcentaje, que es como
 * las informan las entidades financieras colombianas.
 */

/** Tasa efectiva mensual equivalente a una tasa E.A. (en %). */
export function monthlyRate(tasaEA: number): number {
  return Math.pow(1 + tasaEA / 100, 1 / 12) - 1;
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Cuota fija para amortizar `principal` en `n` meses a la tasa E.A. dada. */
export function paymentFor(principal: number, tasaEA: number, n: number): number {
  const r = monthlyRate(tasaEA);
  if (n <= 0) throw new RangeError('El plazo debe ser mayor que cero');
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Capital que una cuota mensual permite financiar a la tasa y plazo dados. */
export function principalFor(cuota: number, tasaEA: number, n: number): number {
  const r = monthlyRate(tasaEA);
  if (r === 0) return cuota * n;
  return (cuota * (1 - Math.pow(1 + r, -n))) / r;
}

export interface PayoffResult {
  /** Número de cuotas hasta saldar (la última puede ser menor). */
  cuotas: number;
  totalIntereses: number;
  totalPagado: number;
}

/**
 * Simula el pago de un saldo con una cuota fija hasta liquidarlo.
 * Lanza error si la cuota no alcanza a cubrir los intereses del primer mes.
 */
export function simulatePayoff(saldo: number, tasaEA: number, cuota: number): PayoffResult {
  const r = monthlyRate(tasaEA);
  if (saldo <= 0) return { cuotas: 0, totalIntereses: 0, totalPagado: 0 };
  if (cuota <= saldo * r) {
    throw new RangeError('La cuota no cubre los intereses mensuales; el saldo nunca se liquidaría');
  }
  let remaining = saldo;
  let cuotas = 0;
  let totalIntereses = 0;
  let totalPagado = 0;
  while (remaining > 0.005 && cuotas < 1200) {
    const interes = remaining * r;
    const pago = Math.min(cuota, remaining + interes);
    remaining = remaining + interes - pago;
    totalIntereses += interes;
    totalPagado += pago;
    cuotas++;
  }
  return {
    cuotas,
    totalIntereses: round2(totalIntereses),
    totalPagado: round2(totalPagado),
  };
}

export type NivelEndeudamiento = 'saludable' | 'precaucion' | 'riesgo';

/** Umbrales de referencia (% del ingreso mensual comprometido en cuotas). Configurables. */
export const UMBRAL_SALUDABLE = 30;
export const UMBRAL_PRECAUCION = 40;

export function nivelEndeudamiento(porcentaje: number): NivelEndeudamiento {
  if (porcentaje <= UMBRAL_SALUDABLE) return 'saludable';
  if (porcentaje <= UMBRAL_PRECAUCION) return 'precaucion';
  return 'riesgo';
}

export function porcentajeComprometido(totalCuotas: number, ingresoMensual: number): number {
  if (!ingresoMensual || ingresoMensual <= 0) return 0;
  return round2((totalCuotas / ingresoMensual) * 100);
}

// ---------------------------------------------------------------- Evaluación

export interface EvaluationInput {
  ingresoMensual: number;
  cuotasActuales: number;
  monto: number;
  tasaEA: number;
  plazoMeses: number;
}

export type Veredicto = 'viable' | 'precaucion' | 'no_recomendable';

export interface EvaluationResult {
  cuotaNueva: number;
  totalIntereses: number;
  totalPagar: number;
  porcentajeActual: number;
  porcentajeNuevo: number;
  nivelNuevo: NivelEndeudamiento;
  veredicto: Veredicto;
  /** Cuota máxima que mantiene el endeudamiento en el umbral saludable. */
  cuotaMaximaSaludable: number;
  /** Monto máximo financiable con esa cuota a la misma tasa y plazo. */
  montoMaximoSugerido: number;
}

export function evaluateNewCredit(input: EvaluationInput): EvaluationResult {
  const cuotaNueva = paymentFor(input.monto, input.tasaEA, input.plazoMeses);
  const totalPagar = cuotaNueva * input.plazoMeses;
  const porcentajeActual = porcentajeComprometido(input.cuotasActuales, input.ingresoMensual);
  const porcentajeNuevo = porcentajeComprometido(
    input.cuotasActuales + cuotaNueva,
    input.ingresoMensual,
  );
  const nivelNuevo = nivelEndeudamiento(porcentajeNuevo);
  const cuotaMaxima = Math.max(
    0,
    (input.ingresoMensual * UMBRAL_SALUDABLE) / 100 - input.cuotasActuales,
  );
  return {
    cuotaNueva: round2(cuotaNueva),
    totalIntereses: round2(totalPagar - input.monto),
    totalPagar: round2(totalPagar),
    porcentajeActual,
    porcentajeNuevo,
    nivelNuevo,
    veredicto:
      nivelNuevo === 'saludable' ? 'viable' : nivelNuevo === 'precaucion' ? 'precaucion' : 'no_recomendable',
    cuotaMaximaSaludable: round2(cuotaMaxima),
    montoMaximoSugerido: round2(principalFor(cuotaMaxima, input.tasaEA, input.plazoMeses)),
  };
}

// ------------------------------------------------------------ Abono a capital

export type ModalidadAbono = 'reducir_plazo' | 'reducir_cuota';

export interface AbonoInput {
  saldo: number;
  tasaEA: number;
  cuota: number;
  cuotasRestantes: number;
  abono: number;
  modalidad: ModalidadAbono;
}

export interface AbonoResult {
  modalidad: ModalidadAbono;
  saldoNuevo: number;
  cuotaActual: number;
  cuotaNueva: number;
  cuotasActuales: number;
  cuotasNuevas: number;
  interesesSinAbono: number;
  interesesConAbono: number;
  ahorroIntereses: number;
  cuotasAhorradas: number;
  liquidaElCredito: boolean;
}

export function simulateAbono(input: AbonoInput): AbonoResult {
  const { saldo, tasaEA, cuota, cuotasRestantes, abono, modalidad } = input;
  const base = simulatePayoff(saldo, tasaEA, cuota);

  if (abono >= saldo) {
    return {
      modalidad,
      saldoNuevo: 0,
      cuotaActual: round2(cuota),
      cuotaNueva: 0,
      cuotasActuales: base.cuotas,
      cuotasNuevas: 0,
      interesesSinAbono: base.totalIntereses,
      interesesConAbono: 0,
      ahorroIntereses: base.totalIntereses,
      cuotasAhorradas: base.cuotas,
      liquidaElCredito: true,
    };
  }

  const saldoNuevo = saldo - abono;
  if (modalidad === 'reducir_plazo') {
    const after = simulatePayoff(saldoNuevo, tasaEA, cuota);
    return {
      modalidad,
      saldoNuevo: round2(saldoNuevo),
      cuotaActual: round2(cuota),
      cuotaNueva: round2(cuota),
      cuotasActuales: base.cuotas,
      cuotasNuevas: after.cuotas,
      interesesSinAbono: base.totalIntereses,
      interesesConAbono: after.totalIntereses,
      ahorroIntereses: round2(base.totalIntereses - after.totalIntereses),
      cuotasAhorradas: base.cuotas - after.cuotas,
      liquidaElCredito: false,
    };
  }

  // reducir_cuota: se mantiene el plazo restante y baja la cuota.
  const n = Math.max(1, Math.min(cuotasRestantes, base.cuotas));
  const cuotaNueva = paymentFor(saldoNuevo, tasaEA, n);
  const interesesConAbono = cuotaNueva * n - saldoNuevo;
  return {
    modalidad,
    saldoNuevo: round2(saldoNuevo),
    cuotaActual: round2(cuota),
    cuotaNueva: round2(cuotaNueva),
    cuotasActuales: base.cuotas,
    cuotasNuevas: n,
    interesesSinAbono: base.totalIntereses,
    interesesConAbono: round2(interesesConAbono),
    ahorroIntereses: round2(base.totalIntereses - interesesConAbono),
    cuotasAhorradas: 0,
    liquidaElCredito: false,
  };
}

// ------------------------------------------------------------ Compra de cartera

export interface CompraCarteraInput {
  saldo: number;
  tasaEAActual: number;
  cuotaActual: number;
  tasaEANueva: number;
  plazoMesesNuevo: number;
  /** Costos de la operación (estudio, comisión, etc.) que se financian en el nuevo crédito. */
  gastosCierre: number;
}

export interface CompraCarteraResult {
  totalRestanteActual: number;
  cuotasRestantesActual: number;
  montoNuevoCredito: number;
  cuotaNueva: number;
  totalNuevoCredito: number;
  ahorroTotal: number;
  ahorroCuotaMensual: number;
  plazoNuevoMayor: boolean;
  conviene: boolean;
}

export function simulateCompraCartera(input: CompraCarteraInput): CompraCarteraResult {
  const actual = simulatePayoff(input.saldo, input.tasaEAActual, input.cuotaActual);
  const monto = input.saldo + input.gastosCierre;
  const cuotaNueva = paymentFor(monto, input.tasaEANueva, input.plazoMesesNuevo);
  const totalNuevo = cuotaNueva * input.plazoMesesNuevo;
  const ahorroTotal = actual.totalPagado - totalNuevo;
  return {
    totalRestanteActual: actual.totalPagado,
    cuotasRestantesActual: actual.cuotas,
    montoNuevoCredito: round2(monto),
    cuotaNueva: round2(cuotaNueva),
    totalNuevoCredito: round2(totalNuevo),
    ahorroTotal: round2(ahorroTotal),
    ahorroCuotaMensual: round2(input.cuotaActual - cuotaNueva),
    plazoNuevoMayor: input.plazoMesesNuevo > actual.cuotas,
    conviene: ahorroTotal > 0,
  };
}
