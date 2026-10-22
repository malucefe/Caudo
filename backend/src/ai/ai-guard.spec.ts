import { isValidRewrite, numberTokens } from './ai-guard';

describe('ai-guard', () => {
  it('normaliza separadores de miles y decimales', () => {
    expect([...numberTokens('Gastaste $1.200.000 (85%) y 3,5 veces')].sort()).toEqual(['1200000', '35', '85'].sort());
  });

  const original = 'Llevas 85% del tope de Transporte: $85.000 de $100.000.';

  it('acepta una redacción que conserva todas las cifras', () => {
    expect(isValidRewrite(original, 'Ojo con Transporte: ya usaste $85.000 de $100.000, el 85% del tope.')).toBe(true);
  });

  it('rechaza si cambia una cifra', () => {
    expect(isValidRewrite(original, 'Llevas 90% del tope: $85.000 de $100.000.')).toBe(false);
  });

  it('rechaza si omite una cifra', () => {
    expect(isValidRewrite(original, 'Casi llegas al tope de Transporte.')).toBe(false);
  });

  it('rechaza si inventa una cifra nueva', () => {
    expect(isValidRewrite(original, 'Llevas 85%: $85.000 de $100.000; ahorra $20.000.')).toBe(false);
  });

  it('rechaza vacío, no-texto y textos demasiado largos', () => {
    expect(isValidRewrite('Sin cifras', '')).toBe(false);
    expect(isValidRewrite('Sin cifras', 42)).toBe(false);
    expect(isValidRewrite('Sin cifras', 'a'.repeat(401))).toBe(false);
  });
});
