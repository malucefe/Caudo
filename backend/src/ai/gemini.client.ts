export interface GeminiConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Quita cercas de código Markdown (```json ... ```) por si el modelo las incluye. */
export function stripFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

/**
 * Llama a Gemini (REST generateContent) pidiendo una respuesta JSON y la
 * devuelve ya parseada. Lanza un Error si la API responde con fallo o si la
 * respuesta no es JSON válido; el llamador decide el plan B.
 */
export async function generateJson<T>(
  cfg: GeminiConfig,
  systemInstruction: string,
  prompt: string,
  fetchImpl: FetchLike = fetch as FetchLike,
): Promise<T> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`;
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
    }),
    signal: AbortSignal.timeout(cfg.timeoutMs),
  });
  if (!res.ok) throw new Error(`Gemini respondió ${res.status}`);

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) throw new Error('Gemini devolvió una respuesta vacía');
  try {
    return JSON.parse(stripFences(text)) as T;
  } catch {
    throw new Error('Gemini no devolvió JSON válido');
  }
}
