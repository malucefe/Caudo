/**
 * Validaciones que protegen las cifras: la IA solo puede redactar, nunca
 * cambiar ni inventar números. Si el texto reescrito no cumple, se descarta
 * y se conserva el texto calculado por las reglas.
 */

/** Números del texto, sin separadores de miles/decimales ("1.200.000" → "1200000"). */
export function numberTokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.match(/\d[\d.,]*/g) ?? []) {
    const digits = m.replace(/[.,]+$/g, '').replace(/[.,]/g, '');
    if (digits) out.add(digits);
  }
  return out;
}

export const MAX_MESSAGE_LENGTH = 400;

export function isValidRewrite(original: string, rewritten: unknown): rewritten is string {
  if (typeof rewritten !== 'string') return false;
  const text = rewritten.trim();
  if (!text || text.length > MAX_MESSAGE_LENGTH) return false;
  const a = numberTokens(original);
  const b = numberTokens(text);
  for (const n of a) if (!b.has(n)) return false; // no puede perder cifras
  for (const n of b) if (!a.has(n)) return false; // no puede inventarlas
  return true;
}
