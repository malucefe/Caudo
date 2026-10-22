/**
 * Lógica pura de análisis (HU-10 patrones, HU-11 gastos hormiga, HU-13
 * recomendaciones). Basada en reglas determinísticas y auditables.
 */

export interface TxLite {
  /** 'YYYY-MM-DD' */
  fecha: string;
  monto: number;
  descripcion?: string | null;
  categoria: string;
}

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const UMBRAL_HORMIGA_DEFAULT = 20000; // COP por transacción
export const MIN_OCURRENCIAS_HORMIGA = 4; // en 30 días

export function normalizeConcept(descripcion: string | null | undefined, categoria: string): string {
  const base = (descripcion ?? '').trim() || categoria;
  return base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const monthKey = (fecha: string) => fecha.slice(0, 7);
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// -------------------------------------------------------------------- Patrones

export interface Patterns {
  periodoMeses: number;
  totalGasto: number;
  promedioDiario: number;
  topCategorias: { categoria: string; total: number; porcentaje: number }[];
  diaMayorGasto: { dia: string; total: number } | null;
  gastoPorDia: { dia: string; total: number }[];
  mayoresAumentos: { categoria: string; actual: number; anterior: number; variacionPct: number }[];
  recurrentes: { concepto: string; ocurrencias: number; meses: number; promedio: number }[];
}

export function computePatterns(egresos: TxLite[], now: Date, periodoMeses = 3): Patterns {
  const total = egresos.reduce((s, t) => s + t.monto, 0);
  const byCat = new Map<string, number>();
  const byDow = new Array(7).fill(0);
  for (const t of egresos) {
    byCat.set(t.categoria, (byCat.get(t.categoria) ?? 0) + t.monto);
    byDow[new Date(`${t.fecha}T00:00:00Z`).getUTCDay()] += t.monto;
  }

  const topCategorias = [...byCat.entries()]
    .map(([categoria, tot]) => ({ categoria, total: round2(tot), porcentaje: total ? round2((tot / total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);

  const gastoPorDia = DIAS.map((dia, i) => ({ dia, total: round2(byDow[i]) }));
  const maxDia = [...gastoPorDia].sort((a, b) => b.total - a.total)[0];

  // Variación mes actual vs. anterior por categoría
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const sum = (key: string) => {
    const m = new Map<string, number>();
    for (const t of egresos) if (monthKey(t.fecha) === key) m.set(t.categoria, (m.get(t.categoria) ?? 0) + t.monto);
    return m;
  };
  const curM = sum(cur);
  const prevM = sum(prev);
  const mayoresAumentos = [...curM.entries()]
    .filter(([c]) => (prevM.get(c) ?? 0) > 0)
    .map(([categoria, actual]) => {
      const anterior = prevM.get(categoria)!;
      return { categoria, actual: round2(actual), anterior: round2(anterior), variacionPct: round2(((actual - anterior) / anterior) * 100) };
    })
    .filter((x) => x.variacionPct > 10)
    .sort((a, b) => b.variacionPct - a.variacionPct)
    .slice(0, 3);

  // Gastos recurrentes: mismo concepto ≥3 veces en ≥2 meses distintos
  const groups = new Map<string, { n: number; total: number; months: Set<string> }>();
  for (const t of egresos) {
    const k = normalizeConcept(t.descripcion, t.categoria);
    const g = groups.get(k) ?? { n: 0, total: 0, months: new Set<string>() };
    g.n++; g.total += t.monto; g.months.add(monthKey(t.fecha));
    groups.set(k, g);
  }
  const recurrentes = [...groups.entries()]
    .filter(([, g]) => g.n >= 3 && g.months.size >= 2)
    .map(([concepto, g]) => ({ concepto, ocurrencias: g.n, meses: g.months.size, promedio: round2(g.total / g.n) }))
    .sort((a, b) => b.ocurrencias - a.ocurrencias)
    .slice(0, 8);

  const days = Math.max(1, periodoMeses * 30);
  return {
    periodoMeses,
    totalGasto: round2(total),
    promedioDiario: round2(total / days),
    topCategorias,
    diaMayorGasto: maxDia && maxDia.total > 0 ? maxDia : null,
    gastoPorDia,
    mayoresAumentos,
    recurrentes,
  };
}

// -------------------------------------------------------------- Gastos hormiga

export interface AntExpense {
  concepto: string;
  categoria: string;
  ocurrencias: number;
  total: number;
  promedio: number;
  proyeccionAnual: number;
}

export interface AntExpensesReport {
  umbral: number;
  minOcurrencias: number;
  items: AntExpense[];
  totalMensual: number;
  proyeccionAnual: number;
}

/**
 * Consumos pequeños (≤ umbral por transacción) que se repiten al menos
 * `minOcurrencias` veces en la ventana de 30 días recibida.
 */
export function detectAntExpenses(
  egresos30d: TxLite[],
  umbral = UMBRAL_HORMIGA_DEFAULT,
  minOcurrencias = MIN_OCURRENCIAS_HORMIGA,
): AntExpensesReport {
  const groups = new Map<string, { categoria: string; n: number; total: number }>();
  for (const t of egresos30d) {
    if (t.monto > umbral) continue;
    const k = normalizeConcept(t.descripcion, t.categoria);
    const g = groups.get(k) ?? { categoria: t.categoria, n: 0, total: 0 };
    g.n++; g.total += t.monto;
    groups.set(k, g);
  }
  const items = [...groups.entries()]
    .filter(([, g]) => g.n >= minOcurrencias)
    .map(([concepto, g]) => ({
      concepto, categoria: g.categoria, ocurrencias: g.n, total: round2(g.total),
      promedio: round2(g.total / g.n), proyeccionAnual: round2(g.total * 12),
    }))
    .sort((a, b) => b.total - a.total);
  const totalMensual = round2(items.reduce((s, i) => s + i.total, 0));
  return { umbral, minOcurrencias, items, totalMensual, proyeccionAnual: round2(totalMensual * 12) };
}

// ------------------------------------------------------------- Recomendaciones

export type PrioridadReco = 'alta' | 'media' | 'baja';

export interface Recommendation {
  id: string;
  prioridad: PrioridadReco;
  titulo: string;
  mensaje: string;
}

export interface RecoContext {
  ingresos: number;
  egresos: number;
  hormiga: AntExpensesReport;
  presupuestosExcedidos: { categoria: string; porcentaje: number }[];
  presupuestosEnAlerta: { categoria: string; porcentaje: number }[];
  credito: { porcentaje: number; nivel: 'saludable' | 'precaucion' | 'riesgo' | null };
  metasEnRiesgo: { nombre: string; aporteMensualRequerido: number }[];
  mayoresAumentos: Patterns['mayoresAumentos'];
}

const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const ORDEN: Record<PrioridadReco, number> = { alta: 0, media: 1, baja: 2 };

export function buildRecommendations(ctx: RecoContext): Recommendation[] {
  const out: Recommendation[] = [];

  if (ctx.credito.nivel === 'riesgo') {
    out.push({ id: 'credito-riesgo', prioridad: 'alta', titulo: 'Tus deudas comprometen demasiado tu ingreso',
      mensaje: `Tus cuotas representan ${ctx.credito.porcentaje}% de tu ingreso. Evita nuevos créditos y simula un abono a capital o una compra de cartera para bajar la carga.` });
  } else if (ctx.credito.nivel === 'precaucion') {
    out.push({ id: 'credito-precaucion', prioridad: 'media', titulo: 'Vigila tu nivel de endeudamiento',
      mensaje: `Comprometes ${ctx.credito.porcentaje}% de tu ingreso en cuotas. Antes de adquirir otra deuda, evalúa su impacto en el módulo de créditos.` });
  }

  if (ctx.ingresos > 0 && ctx.egresos > ctx.ingresos) {
    out.push({ id: 'deficit', prioridad: 'alta', titulo: 'Estás gastando más de lo que ingresa',
      mensaje: `Este mes tus gastos superan tus ingresos en ${cop(ctx.egresos - ctx.ingresos)}. Revisa las categorías con mayor peso y define topes.` });
  } else if (ctx.ingresos > 0) {
    const ahorro = ((ctx.ingresos - ctx.egresos) / ctx.ingresos) * 100;
    if (ahorro < 10) {
      out.push({ id: 'ahorro-bajo', prioridad: 'media', titulo: 'Tu margen de ahorro es bajo',
        mensaje: `Ahorras ${Math.max(0, Math.round(ahorro))}% de tus ingresos. Una referencia común es destinar al menos 10 %; intenta apartarlo apenas recibas tu ingreso.` });
    }
  }

  for (const b of ctx.presupuestosExcedidos) {
    out.push({ id: `tope-${b.categoria}`, prioridad: 'alta', titulo: `Superaste el tope de ${b.categoria}`,
      mensaje: `Llevas ${b.porcentaje}% del tope definido para ${b.categoria}. Reduce gastos en esta categoría lo que queda del mes o ajusta el tope si ya no es realista.` });
  }
  for (const b of ctx.presupuestosEnAlerta) {
    out.push({ id: `alerta-${b.categoria}`, prioridad: 'media', titulo: `${b.categoria} está cerca de su tope`,
      mensaje: `Has consumido ${b.porcentaje}% del tope de ${b.categoria}. Modera los gastos de esta categoría.` });
  }

  if (ctx.hormiga.items.length > 0) {
    const top = ctx.hormiga.items[0];
    out.push({ id: 'hormiga', prioridad: ctx.hormiga.totalMensual > ctx.ingresos * 0.05 && ctx.ingresos > 0 ? 'alta' : 'media',
      titulo: 'Tus gastos hormiga suman más de lo que parece',
      mensaje: `En los últimos 30 días gastaste ${cop(ctx.hormiga.totalMensual)} en consumos pequeños repetidos (${cop(ctx.hormiga.proyeccionAnual)} al año). El mayor es "${top.concepto}" con ${top.ocurrencias} compras.` });
  }

  for (const a of ctx.mayoresAumentos.slice(0, 2)) {
    out.push({ id: `aumento-${a.categoria}`, prioridad: 'baja', titulo: `${a.categoria} subió ${Math.round(a.variacionPct)}%`,
      mensaje: `Gastaste ${cop(a.actual)} frente a ${cop(a.anterior)} el mes anterior en ${a.categoria}. Verifica si fue un gasto puntual o un nuevo hábito.` });
  }

  for (const m of ctx.metasEnRiesgo) {
    out.push({ id: `meta-${m.nombre}`, prioridad: 'media', titulo: `Tu meta "${m.nombre}" va retrasada`,
      mensaje: `Para llegar a tiempo necesitas ahorrar ${cop(m.aporteMensualRequerido)} al mes. Programa el aporte al inicio del mes.` });
  }

  if (out.length === 0) {
    out.push({ id: 'todo-bien', prioridad: 'baja', titulo: 'Tus finanzas van en orden',
      mensaje: 'No detectamos alertas este mes. Considera aumentar el aporte a tus metas de ahorro.' });
  }
  return out.sort((a, b) => ORDEN[a.prioridad] - ORDEN[b.prioridad]);
}
