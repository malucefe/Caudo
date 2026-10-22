import { generateJson, stripFences } from './gemini.client';

const cfg = { apiKey: 'KEY', model: 'gemini-test', timeoutMs: 1000 };
const ok = (text: string) => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) }) as unknown as Response;

describe('gemini.client', () => {
  it('quita cercas de código', () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('envía la clave en el encabezado y devuelve el JSON parseado', async () => {
    const f = jest.fn().mockResolvedValue(ok('{"categoria":"Salud"}'));
    const r = await generateJson<{ categoria: string }>(cfg, 'sys', 'prompt', f);
    expect(r.categoria).toBe('Salud');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/models/gemini-test:generateContent');
    expect(init.headers['x-goog-api-key']).toBe('KEY');
    expect(url).not.toContain('KEY'); // la clave nunca va en la URL
    const body = JSON.parse(init.body);
    expect(body.systemInstruction.parts[0].text).toBe('sys');
    expect(body.generationConfig.responseMimeType).toBe('application/json');
  });

  it('lanza error si la API falla', async () => {
    const f = jest.fn().mockResolvedValue({ ok: false, status: 429 });
    await expect(generateJson(cfg, 's', 'p', f)).rejects.toThrow('Gemini respondió 429');
  });

  it('lanza error si la respuesta está vacía o no es JSON', async () => {
    await expect(generateJson(cfg, 's', 'p', jest.fn().mockResolvedValue(ok('')))).rejects.toThrow('vacía');
    await expect(generateJson(cfg, 's', 'p', jest.fn().mockResolvedValue(ok('hola')))).rejects.toThrow('JSON');
  });
});
