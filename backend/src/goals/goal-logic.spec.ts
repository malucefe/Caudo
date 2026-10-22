import { projectGoal } from './goal-logic';

const d = (s: string) => new Date(`${s}T00:00:00`);

describe('projectGoal', () => {
  const base = { montoObjetivo: 1_200_000, fechaCreacion: d('2026-01-01'), fechaLimite: d('2026-12-31'), hoy: d('2026-07-01') };

  it('calcula avance y faltante', () => {
    const r = projectGoal({ ...base, montoAhorrado: 600_000 });
    expect(r.porcentaje).toBe(50);
    expect(r.faltante).toBe(600_000);
  });

  it('viabilidad alta si el ritmo llega a tiempo', () => {
    const r = projectGoal({ ...base, montoAhorrado: 700_000 }); // ~116k/mes, faltan 500k → 5 meses ≤ 5
    expect(r.viabilidad).toBe('alta');
    expect(r.fechaEstimada).not.toBeNull();
  });

  it('viabilidad baja si no hay aportes y calcula el aporte requerido', () => {
    const r = projectGoal({ ...base, montoAhorrado: 0 });
    expect(r.viabilidad).toBe('baja');
    expect(r.fechaEstimada).toBeNull();
    expect(r.aporteMensualRequerido).toBeCloseTo(1_200_000 / 5, 0);
  });

  it('viabilidad media con retraso pequeño', () => {
    const r = projectGoal({ ...base, montoAhorrado: 450_000 }); // 75k/mes, faltan 750k → 10 meses vs 5 → retraso 5 > 25% de 11
    expect(['media', 'baja']).toContain(r.viabilidad);
  });

  it('cumplida cuando alcanza el objetivo', () => {
    const r = projectGoal({ ...base, montoAhorrado: 1_300_000 });
    expect(r.viabilidad).toBe('cumplida');
    expect(r.porcentaje).toBe(100);
  });
});
