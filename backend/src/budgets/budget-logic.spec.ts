import { evaluateBudget, alertMessage } from './budget-logic';

describe('budget-logic (HU-12)', () => {
  it('ok por debajo de 80%', () => {
    expect(evaluateBudget(1000, 500)).toEqual({ porcentaje: 50, restante: 500, estado: 'ok' });
  });
  it('alerta desde 80% (inclusive)', () => {
    expect(evaluateBudget(1000, 800).estado).toBe('alerta');
    expect(evaluateBudget(1000, 999).estado).toBe('alerta');
  });
  it('excedido desde 100%', () => {
    const s = evaluateBudget(1000, 1200);
    expect(s.estado).toBe('excedido');
    expect(s.restante).toBe(-200);
  });
  it('tope en cero no divide por cero', () => {
    expect(evaluateBudget(0, 50).porcentaje).toBe(0);
  });
  it('genera mensajes distintos por estado', () => {
    expect(alertMessage('Transporte', evaluateBudget(1000, 1200), 1000)).toContain('Superaste');
    expect(alertMessage('Transporte', evaluateBudget(1000, 850), 1000)).toContain('85%');
  });
});
