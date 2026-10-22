const pad = (n: number) => String(n).padStart(2, '0');

/** Primer y último día del mes como 'YYYY-MM-DD' (sin desfases de zona horaria). */
export function monthRange(mes: number, anio: number): { start: string; end: string } {
  const last = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return { start: `${anio}-${pad(mes)}-01`, end: `${anio}-${pad(mes)}-${pad(last)}` };
}

/** Mes y año actuales. */
export function currentMonth(now: Date = new Date()): { mes: number; anio: number } {
  return { mes: now.getMonth() + 1, anio: now.getFullYear() };
}

/** Suma `months` meses a una fecha (clamp al último día del mes). */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

/** Meses completos transcurridos entre dos fechas (mínimo 0). */
export function monthsBetween(from: Date, to: Date): number {
  const m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  return Math.max(0, to.getDate() < from.getDate() ? m - 1 : m);
}

export const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
