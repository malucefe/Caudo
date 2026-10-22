import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonitoringService } from '../monitoring/monitoring.service';
import { FetchLike, GeminiConfig, generateJson } from './gemini.client';
import { isValidRewrite } from './ai-guard';

export interface RecoInput {
  id: string;
  prioridad: string;
  titulo: string;
  mensaje: string;
}

const REWRITE_SYSTEM = `Eres el asistente de finanzas personales de Caudo, para personas en Colombia.
Recibes recomendaciones ya calculadas por el sistema y debes reescribir SOLO el campo "mensaje" para que suene claro, cercano y amable, en español colombiano.
Reglas estrictas:
- Conserva exactamente todas las cifras, porcentajes y montos del mensaje original; no agregues ni cambies ningún número.
- Máximo 280 caracteres por mensaje.
- No des asesoría legal, tributaria ni de inversión; no prometas resultados.
- No pidas datos personales ni menciones nombres.
Responde únicamente un arreglo JSON: [{"id":"...","mensaje":"..."}].`;

const CLASSIFY_SYSTEM = `Clasificas descripciones cortas de transacciones financieras de una persona en Colombia.
Elige exactamente UNA categoría de la lista permitida, o "ninguna" si no hay una razonable.
Responde únicamente JSON: {"categoria":"<nombre exacto de la lista o ninguna>"}.`;

/**
 * IA generativa (Gemini) como complemento de las reglas: redacta recomendaciones
 * y, si se activa, clasifica transacciones que las palabras clave no resolvieron.
 * Todo tiene plan B: ante cualquier fallo se devuelve null y el sistema usa las reglas.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private blockedUntil = 0;
  private readonly cache = new Map<string, string | null>();

  /** Permite sustituir fetch en pruebas. */
  fetchImpl?: FetchLike;

  constructor(
    private readonly config: ConfigService,
    private readonly monitoring: MonitoringService,
  ) {}

  private get apiKey(): string | undefined {
    return this.config.get<string>('GEMINI_API_KEY')?.trim() || undefined;
  }

  get enabled(): boolean {
    return Boolean(this.apiKey);
  }

  /** La clasificación envía la descripción de la transacción a Google: es opt-in. */
  get categorizationEnabled(): boolean {
    return this.enabled && this.config.get<string>('AI_CATEGORIZATION') === 'true';
  }

  get model(): string {
    return this.config.get<string>('GEMINI_MODEL')?.trim() || 'gemini-3.8-flash';
  }

  private cfg(): GeminiConfig {
    return { apiKey: this.apiKey as string, model: this.model, timeoutMs: 6000 };
  }

  /** Tras un fallo se pausa la IA 60 s para no demorar cada petición. */
  private available(): boolean {
    return this.enabled && Date.now() >= this.blockedUntil;
  }

  private async run<T>(flujo: string, system: string, prompt: string): Promise<T | null> {
    if (!this.available()) return null;
    const inicio = Date.now();
    try {
      const out = await generateJson<T>(this.cfg(), system, prompt, this.fetchImpl);
      void this.monitoring.recordWebhook({ flujo, exitoso: true, duracionMs: Date.now() - inicio });
      return out;
    } catch (e) {
      this.blockedUntil = Date.now() + 60_000;
      const msg = (e as Error).message;
      void this.monitoring.recordWebhook({ flujo, exitoso: false, duracionMs: Date.now() - inicio, error: msg });
      this.logger.warn(`IA no disponible (${flujo}): ${msg}`);
      return null;
    }
  }

  /**
   * Devuelve el mapa id → mensaje reescrito, solo con los mensajes válidos
   * (mismas cifras, largo razonable). null si la IA no está disponible.
   */
  async rewriteRecommendations(recos: RecoInput[]): Promise<Map<string, string> | null> {
    if (recos.length === 0) return null;
    const out = await this.run<{ id: string; mensaje: string }[]>(
      'gemini-recomendaciones',
      REWRITE_SYSTEM,
      JSON.stringify(recos.map(({ id, prioridad, titulo, mensaje }) => ({ id, prioridad, titulo, mensaje }))),
    );
    if (!Array.isArray(out)) return null;
    const originals = new Map(recos.map((r) => [r.id, r.mensaje]));
    const valid = new Map<string, string>();
    for (const item of out) {
      const original = originals.get(item?.id);
      if (original !== undefined && isValidRewrite(original, item.mensaje)) {
        valid.set(item.id, item.mensaje.trim());
      }
    }
    return valid;
  }

  /** Nombre de categoría elegido por la IA (validado contra la lista) o null. */
  async classify(descripcion: string, tipo: string, categorias: string[]): Promise<string | null> {
    if (!this.categorizationEnabled || !descripcion.trim() || categorias.length === 0) return null;
    const key = `${tipo}|${descripcion.trim().toLowerCase()}`;
    if (this.cache.has(key)) return this.cache.get(key) ?? null;

    const out = await this.run<{ categoria?: string }>(
      'gemini-categorizacion',
      CLASSIFY_SYSTEM,
      JSON.stringify({ tipo, descripcion: descripcion.slice(0, 120), categoriasPermitidas: categorias }),
    );
    if (out === null) return null; // fallo: no se cachea
    const name = categorias.find((c) => c === out?.categoria) ?? null;
    if (this.cache.size >= 500) this.cache.clear();
    this.cache.set(key, name);
    return name;
  }
}
