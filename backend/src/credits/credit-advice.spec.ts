import { compareAbono, cop, describeCompraCartera, prioritizeCredits } from './credit-advice';
import { simulateCompraCartera } from './credit-math';

describe('credit-advice', () => {
  it('formatea pesos colombianos', () => {
    expect(cop(1654283.94)).toMatch(/^\$1[.,]654[.,]284$/);
  });

  describe('compareAbono', () => {
    const base = { saldo: 15_000_000, tasaEA: 24, cuota: 700_000, cuotasRestantes: 28, abono: 3_000_000 };

    it('recomienda reducir plazo porque ahorra más intereses y explica la contrapartida', () => {
      const r = compareAbono(base);
      expect(r.recomendada).toBe('reducir_plazo');
      expect(r.reducirPlazo.ahorroIntereses).toBeGreaterThan(r.reducirCuota.ahorroIntereses);
      expect(r.ventajaIntereses).toBeCloseTo(r.reducirPlazo.ahorroIntereses - r.reducirCuota.ahorroIntereses, 1);
      expect(r.mensaje).toContain('Reducir el plazo');
      expect(r.mensaje).toContain('liberar');
    });

    it('si el abono liquida el crédito no recomienda modalidad', () => {
      const r = compareAbono({ ...base, abono: 20_000_000 });
      expect(r.recomendada).toBeNull();
      expect(r.mensaje).toContain('liquidas el crédito');
    });
  });

  describe('prioritizeCredits', () => {
    const c = (id: string, tasaEA: number, saldoActual: number) => ({ id, nombre: `Crédito ${id}`, tasaEA, saldoActual, cuotaMensual: 100000 });

    it('devuelve null con menos de dos créditos', () => {
      expect(prioritizeCredits([c('a', 20, 1000)])).toBeNull();
    });

    it('ordena por tasa descendente (avalancha)', () => {
      const r = prioritizeCredits([c('a', 18, 5_000_000), c('b', 32, 2_000_000), c('c', 24, 9_000_000)])!;
      expect(r.orden.map((o) => o.id)).toEqual(['b', 'c', 'a']);
      expect(r.mensaje).toContain('Crédito b');
      expect(r.mensaje).toContain('fondo de emergencia');
    });

    it('con igual tasa prefiere el menor saldo', () => {
      const r = prioritizeCredits([c('a', 24, 9_000_000), c('b', 24, 2_000_000)])!;
      expect(r.orden[0].id).toBe('b');
    });

    it('ignora créditos sin saldo', () => {
      expect(prioritizeCredits([c('a', 24, 0), c('b', 20, 1000)])).toBeNull();
    });
  });

  describe('describeCompraCartera', () => {
    const sim = (nuevaTasa: number, plazo: number) =>
      simulateCompraCartera({ saldo: 15_000_000, tasaEAActual: 24, cuotaActual: 700_000, tasaEANueva: nuevaTasa, plazoMesesNuevo: plazo, gastosCierre: 150_000 });

    it('baja la cuota pero cuesta más en total (plazo mayor)', () => {
      const a = describeCompraCartera(sim(18, 36), 36);
      expect(a.tipo).toBe('baja_cuota_pero_cuesta_mas');
      expect(a.mensaje).toContain('más en total');
      expect(a.mensaje).toContain('a 36 cuotas');
    });

    it('ahorra y baja la cuota', () => {
      expect(describeCompraCartera(sim(12, 28)).tipo).toBe('ahorra_y_baja_cuota');
    });

    it('ahorra pero con cuota mayor (plazo más corto)', () => {
      expect(describeCompraCartera(sim(12, 12)).tipo).toBe('ahorra_con_cuota_mayor');
    });

    it('no conviene si sube cuota y total', () => {
      expect(describeCompraCartera(sim(40, 28)).tipo).toBe('no_conviene');
    });
  });
});
