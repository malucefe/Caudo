import {
  monthlyRate, paymentFor, principalFor, simulatePayoff, evaluateNewCredit,
  simulateAbono, simulateCompraCartera, nivelEndeudamiento, porcentajeComprometido,
} from './credit-math';

describe('credit-math', () => {
  it('convierte E.A. a tasa mensual', () => {
    expect(monthlyRate(12.682503)).toBeCloseTo(0.01, 6);
    expect(monthlyRate(0)).toBe(0);
  });

  it('calcula la cuota francesa (10M, 1% mensual, 12 meses ≈ 888.488)', () => {
    expect(paymentFor(10_000_000, 12.682503, 12)).toBeCloseTo(888_487.89, 0);
  });

  it('con tasa 0 la cuota es capital/plazo', () => {
    expect(paymentFor(1200, 0, 12)).toBe(100);
  });

  it('principalFor es la inversa de paymentFor', () => {
    const c = paymentFor(5_000_000, 24, 36);
    expect(principalFor(c, 24, 36)).toBeCloseTo(5_000_000, 2);
  });

  it('simulatePayoff liquida en el número de cuotas esperado y suma intereses', () => {
    const c = paymentFor(10_000_000, 18, 24);
    const r = simulatePayoff(10_000_000, 18, c);
    expect(r.cuotas).toBe(24);
    expect(r.totalIntereses).toBeCloseTo(c * 24 - 10_000_000, 0);
  });

  it('simulatePayoff rechaza cuotas que no cubren intereses', () => {
    expect(() => simulatePayoff(10_000_000, 30, 1000)).toThrow(RangeError);
  });

  it('clasifica el endeudamiento', () => {
    expect(nivelEndeudamiento(25)).toBe('saludable');
    expect(nivelEndeudamiento(30)).toBe('saludable');
    expect(nivelEndeudamiento(35)).toBe('precaucion');
    expect(nivelEndeudamiento(41)).toBe('riesgo');
    expect(porcentajeComprometido(500, 2000)).toBe(25);
    expect(porcentajeComprometido(500, 0)).toBe(0);
  });

  describe('evaluateNewCredit', () => {
    it('viable cuando el nuevo porcentaje queda ≤ 30%', () => {
      const r = evaluateNewCredit({ ingresoMensual: 5_000_000, cuotasActuales: 500_000, monto: 5_000_000, tasaEA: 20, plazoMeses: 36 });
      expect(r.veredicto).toBe('viable');
      expect(r.porcentajeNuevo).toBeLessThanOrEqual(30);
    });

    it('no recomendable cuando supera 40% y sugiere un monto menor', () => {
      const r = evaluateNewCredit({ ingresoMensual: 3_000_000, cuotasActuales: 900_000, monto: 30_000_000, tasaEA: 25, plazoMeses: 48 });
      expect(r.veredicto).toBe('no_recomendable');
      expect(r.montoMaximoSugerido).toBeLessThan(30_000_000);
      expect(r.cuotaMaximaSaludable).toBe(0);
      expect(r.montoMaximoSugerido).toBe(0);
    });
  });

  describe('simulateAbono', () => {
    const base = { saldo: 20_000_000, tasaEA: 22, cuota: 800_000, cuotasRestantes: 36 };

    it('reducir plazo ahorra cuotas e intereses', () => {
      const r = simulateAbono({ ...base, abono: 5_000_000, modalidad: 'reducir_plazo' });
      expect(r.cuotasNuevas).toBeLessThan(r.cuotasActuales);
      expect(r.ahorroIntereses).toBeGreaterThan(0);
      expect(r.cuotaNueva).toBe(800_000);
    });

    it('reducir cuota baja la cuota y mantiene el plazo', () => {
      const r = simulateAbono({ ...base, abono: 5_000_000, modalidad: 'reducir_cuota' });
      expect(r.cuotaNueva).toBeLessThan(800_000);
      expect(r.cuotasNuevas).toBe(r.cuotasActuales);
      expect(r.ahorroIntereses).toBeGreaterThan(0);
    });

    it('un abono mayor al saldo liquida el crédito', () => {
      const r = simulateAbono({ ...base, abono: 25_000_000, modalidad: 'reducir_plazo' });
      expect(r.liquidaElCredito).toBe(true);
      expect(r.saldoNuevo).toBe(0);
    });
  });

  describe('simulateCompraCartera', () => {
    it('conviene cuando la nueva tasa es mucho menor', () => {
      const r = simulateCompraCartera({ saldo: 15_000_000, tasaEAActual: 28, cuotaActual: 700_000, tasaEANueva: 18, plazoMesesNuevo: 24, gastosCierre: 150_000 });
      expect(r.conviene).toBe(true);
      expect(r.ahorroTotal).toBeGreaterThan(0);
    });

    it('no conviene si la nueva tasa es mayor', () => {
      const r = simulateCompraCartera({ saldo: 15_000_000, tasaEAActual: 18, cuotaActual: 700_000, tasaEANueva: 28, plazoMesesNuevo: 24, gastosCierre: 0 });
      expect(r.conviene).toBe(false);
    });
  });
});
