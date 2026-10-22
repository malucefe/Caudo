export type EstadoPresupuesto = 'ok' | 'alerta' | 'excedido';
export type Nivel = 'saludable' | 'precaucion' | 'riesgo';

export interface Budget {
  id: string; categoriaId: string; categoria: string; icono?: string;
  mes: number; anio: number; montoLimite: number; consumido: number;
  porcentaje: number; restante: number; estado: EstadoPresupuesto; mensaje?: string;
}

export interface Goal {
  id: string; nombre: string; montoObjetivo: number; montoAhorrado: number; fechaLimite: string;
  estado: 'activa' | 'cumplida'; porcentaje: number; faltante: number; mesesHastaLimite: number;
  aporteMensualRequerido: number; ritmoMensual: number; fechaEstimada: string | null;
  viabilidad: 'cumplida' | 'alta' | 'media' | 'baja'; mensaje: string;
}

export type CreditType = 'libre_inversion' | 'hipotecario' | 'vehiculo' | 'tarjeta' | 'educativo' | 'otro';

export interface Credit {
  id: string; nombre: string; entidad?: string; tipo: CreditType; montoOriginal: number;
  saldoActual: number; tasaEA: number; cuotaMensual: number; cuotasRestantes: number; estado: 'activo' | 'pagado';
}

export type NewCredit = Omit<Credit, 'id' | 'estado'>;

export interface CreditSummary {
  creditos: Credit[]; totalCuotas: number; totalSaldo: number; ingresoMensual: number;
  fuenteIngreso: 'perfil' | 'mes_actual' | 'sin_dato'; porcentajeComprometido: number;
  nivel: Nivel | null; umbrales: { saludable: number; precaucion: number }; advertencia: string | null;
  prioridadAbono: PrioridadAbono | null;
}

export interface PrioridadAbono {
  orden: { posicion: number; id: string; nombre: string; tasaEA: number; saldoActual: number }[];
  mensaje: string;
}

export interface CreditEvaluation {
  cuotaNueva: number; totalIntereses: number; totalPagar: number; porcentajeActual: number;
  porcentajeNuevo: number; nivelNuevo: Nivel; veredicto: 'viable' | 'precaucion' | 'no_recomendable';
  cuotaMaximaSaludable: number; montoMaximoSugerido: number; ingresoMensual: number; cuotasActuales: number;
}

export interface AbonoResult {
  modalidad: string; saldoNuevo: number; cuotaActual: number; cuotaNueva: number; cuotasActuales: number;
  cuotasNuevas: number; interesesSinAbono: number; interesesConAbono: number; ahorroIntereses: number;
  cuotasAhorradas: number; liquidaElCredito: boolean;
  comparacion?: {
    reducirPlazo: AbonoResult; reducirCuota: AbonoResult;
    recomendada: 'reducir_plazo' | 'reducir_cuota' | null; ventajaIntereses: number; mensaje: string;
  };
}

export interface CompraCarteraResult {
  totalRestanteActual: number; cuotasRestantesActual: number; montoNuevoCredito: number; cuotaNueva: number;
  totalNuevoCredito: number; ahorroTotal: number; ahorroCuotaMensual: number; plazoNuevoMayor: boolean; conviene: boolean;
  analisis?: { tipo: string; mensaje: string };
}

export interface Recommendation { id: string; prioridad: 'alta' | 'media' | 'baja'; titulo: string; mensaje: string; }

export interface Patterns {
  periodoMeses: number; totalGasto: number; promedioDiario: number;
  topCategorias: { categoria: string; total: number; porcentaje: number }[];
  diaMayorGasto: { dia: string; total: number } | null;
  gastoPorDia: { dia: string; total: number }[];
  mayoresAumentos: { categoria: string; actual: number; anterior: number; variacionPct: number }[];
  recurrentes: { concepto: string; ocurrencias: number; meses: number; promedio: number }[];
}

export interface AntExpenses {
  umbral: number; minOcurrencias: number; totalMensual: number; proyeccionAnual: number;
  items: { concepto: string; categoria: string; ocurrencias: number; total: number; promedio: number; proyeccionAnual: number }[];
}

export interface DashboardData {
  mes: number; anio: number;
  resumen: { ingresos: number; egresos: number; balance: number; tasaAhorro: number | null };
  porCategoria: { categoria: string; icono: string; tipo: string; total: string | number; cantidad: string | number }[];
  tendencia: { mes: string; tipo: string; total: string | number }[];
  alertas: Budget[]; metas: Goal[];
  deuda: { totalCuotas: number; totalSaldo: number; porcentajeComprometido: number; nivel: Nivel | null; cantidad: number };
  recomendaciones: Recommendation[];
}
