import { AiService } from './ai.service';

const ok = (obj: unknown) => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }) }) as unknown as Response;

function make(env: Record<string, string | undefined>, fetchMock?: jest.Mock) {
  const config = { get: (k: string) => env[k] } as any;
  const monitoring = { recordWebhook: jest.fn() } as any;
  const svc = new AiService(config, monitoring);
  if (fetchMock) svc.fetchImpl = fetchMock as any;
  return { svc, monitoring };
}

const recos = [
  { id: 'a', prioridad: 'alta', titulo: 'Tope', mensaje: 'Llevas 85% del tope: $85.000 de $100.000.' },
  { id: 'b', prioridad: 'media', titulo: 'Hormiga', mensaje: 'Gastaste $54.000 en 3 compras pequeñas.' },
];

describe('AiService', () => {
  it('sin clave está deshabilitado y no llama a la red', async () => {
    const f = jest.fn();
    const { svc } = make({}, f);
    expect(svc.enabled).toBe(false);
    expect(await svc.rewriteRecommendations(recos)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it('acepta redacciones válidas y descarta las que alteran cifras', async () => {
    const f = jest.fn().mockResolvedValue(ok([
      { id: 'a', mensaje: 'Ya usaste $85.000 de $100.000, el 85% del tope.' },
      { id: 'b', mensaje: 'Gastaste $60.000 en 3 compras pequeñas.' }, // cifra cambiada
      { id: 'zzz', mensaje: 'id desconocido' },
    ]));
    const { svc, monitoring } = make({ GEMINI_API_KEY: 'k' }, f);
    const r = await svc.rewriteRecommendations(recos);
    expect([...r!.keys()]).toEqual(['a']);
    expect(monitoring.recordWebhook).toHaveBeenCalledWith(expect.objectContaining({ flujo: 'gemini-recomendaciones', exitoso: true }));
  });

  it('ante un fallo devuelve null, lo registra y pausa la IA un minuto', async () => {
    const f = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const { svc, monitoring } = make({ GEMINI_API_KEY: 'k' }, f);
    expect(await svc.rewriteRecommendations(recos)).toBeNull();
    expect(monitoring.recordWebhook).toHaveBeenCalledWith(expect.objectContaining({ exitoso: false }));
    expect(await svc.rewriteRecommendations(recos)).toBeNull();
    expect(f).toHaveBeenCalledTimes(1); // la segunda llamada ni siquiera sale
  });

  it('la clasificación es opt-in: sin AI_CATEGORIZATION no llama a la red', async () => {
    const f = jest.fn();
    const { svc } = make({ GEMINI_API_KEY: 'k' }, f);
    expect(await svc.classify('rappi', 'egreso', ['Alimentación'])).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it('clasifica solo con categorías de la lista y usa caché', async () => {
    const f = jest.fn().mockResolvedValue(ok({ categoria: 'Alimentación' }));
    const { svc } = make({ GEMINI_API_KEY: 'k', AI_CATEGORIZATION: 'true' }, f);
    expect(await svc.classify('Rappi', 'egreso', ['Alimentación', 'Salud'])).toBe('Alimentación');
    expect(await svc.classify('Rappi', 'egreso', ['Alimentación', 'Salud'])).toBe('Alimentación');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('descarta una categoría inventada por la IA', async () => {
    const f = jest.fn().mockResolvedValue(ok({ categoria: 'Criptomonedas' }));
    const { svc } = make({ GEMINI_API_KEY: 'k', AI_CATEGORIZATION: 'true' }, f);
    expect(await svc.classify('algo raro', 'egreso', ['Alimentación'])).toBeNull();
  });
});
