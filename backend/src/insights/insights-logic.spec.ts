import { buildRecommendations, computePatterns, detectAntExpenses, normalizeConcept, TxLite } from './insights-logic';

const tx = (fecha: string, monto: number, descripcion: string, categoria = 'Alimentación'): TxLite => ({ fecha, monto, descripcion, categoria });

describe('insights-logic', () => {
  it('normaliza conceptos (tildes, números, mayúsculas)', () => {
    expect(normalizeConcept('  Café #2 Juan Valdéz! ', 'X')).toBe('cafe juan valdez');
    expect(normalizeConcept('', 'Transporte')).toBe('transporte');
  });

  describe('detectAntExpenses (HU-11)', () => {
    const tintos = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-08'].map((f) => tx(f, 3500, 'Tinto'));
    it('agrupa consumos pequeños repetidos y proyecta al año', () => {
      const r = detectAntExpenses([...tintos, tx('2026-10-03', 150000, 'Mercado')]);
      expect(r.items).toHaveLength(1);
      expect(r.items[0]).toMatchObject({ concepto: 'tinto', ocurrencias: 5, total: 17500 });
      expect(r.proyeccionAnual).toBe(17500 * 12);
    });
    it('ignora conceptos con pocas ocurrencias o montos altos', () => {
      expect(detectAntExpenses(tintos.slice(0, 3)).items).toHaveLength(0);
      expect(detectAntExpenses(Array(6).fill(tx('2026-10-01', 50000, 'Cena'))).items).toHaveLength(0);
    });
  });

  describe('computePatterns (HU-10)', () => {
    const now = new Date('2026-10-15T12:00:00');
    const data = [
      tx('2026-09-10', 100000, 'Mercado'), tx('2026-10-10', 180000, 'Mercado'),
      tx('2026-08-12', 100000, 'Mercado'),
      tx('2026-10-12', 50000, 'Taxi', 'Transporte'),
    ];
    it('calcula top de categorías y porcentaje', () => {
      const p = computePatterns(data, now);
      expect(p.topCategorias[0]).toMatchObject({ categoria: 'Alimentación', total: 380000 });
      expect(p.topCategorias.reduce((s, c) => s + c.porcentaje, 0)).toBeCloseTo(100, 0);
    });
    it('detecta aumentos mes contra mes y recurrentes', () => {
      const p = computePatterns(data, now);
      expect(p.mayoresAumentos[0]).toMatchObject({ categoria: 'Alimentación', variacionPct: 80 });
      expect(p.recurrentes[0]).toMatchObject({ concepto: 'mercado', ocurrencias: 3, meses: 3 });
    });
    it('identifica el día de mayor gasto', () => {
      const p = computePatterns(data, now);
      expect(p.diaMayorGasto?.dia).toBe('sábado'); // 2026-10-10 es sábado
    });
    it('sin datos no falla', () => {
      const p = computePatterns([], now);
      expect(p.totalGasto).toBe(0);
      expect(p.diaMayorGasto).toBeNull();
    });
  });

  describe('buildRecommendations (HU-13)', () => {
    const empty = { ingresos: 4_000_000, egresos: 2_000_000, hormiga: { umbral: 0, minOcurrencias: 0, items: [], totalMensual: 0, proyeccionAnual: 0 },
      presupuestosExcedidos: [], presupuestosEnAlerta: [], credito: { porcentaje: 10, nivel: 'saludable' as const }, metasEnRiesgo: [], mayoresAumentos: [] };

    it('sin alertas devuelve un mensaje positivo', () => {
      expect(buildRecommendations(empty)[0].id).toBe('todo-bien');
    });
    it('prioriza déficit, riesgo crediticio y topes excedidos antes que el resto', () => {
      const r = buildRecommendations({
        ...empty, egresos: 4_500_000, credito: { porcentaje: 45, nivel: 'riesgo' },
        presupuestosExcedidos: [{ categoria: 'Ocio', porcentaje: 130 }],
        metasEnRiesgo: [{ nombre: 'Viaje', aporteMensualRequerido: 300000 }],
      });
      expect(r.slice(0, 3).every((x) => x.prioridad === 'alta')).toBe(true);
      expect(r.map((x) => x.id)).toEqual(expect.arrayContaining(['deficit', 'credito-riesgo', 'tope-Ocio', 'meta-Viaje']));
      expect(r[r.length - 1].prioridad).not.toBe('alta');
    });
    it('incluye gastos hormiga con monto proyectado', () => {
      const r = buildRecommendations({ ...empty, hormiga: { umbral: 20000, minOcurrencias: 4, items: [{ concepto: 'tinto', categoria: 'A', ocurrencias: 20, total: 70000, promedio: 3500, proyeccionAnual: 840000 }], totalMensual: 70000, proyeccionAnual: 840000 } });
      expect(r.find((x) => x.id === 'hormiga')?.mensaje).toContain('tinto');
    });
    it('avisa margen de ahorro bajo', () => {
      expect(buildRecommendations({ ...empty, egresos: 3_800_000 }).some((x) => x.id === 'ahorro-bajo')).toBe(true);
    });
  });
});
