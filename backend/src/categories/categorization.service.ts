import { Injectable, Optional } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { CategoriesService } from './categories.service';
import { Category, CategoryType } from './entities/category.entity';
import { CATEGORY_KEYWORDS, DEFAULT_CATEGORY_NAME } from './category-keywords';

export interface CategorySuggestion {
  /** Categoría sugerida, o null si no hay coincidencias. */
  category: Category | null;
  /** Número de palabras clave que coincidieron con la descripción. */
  score: number;
  /** Palabras clave que explican la sugerencia. */
  matches: string[];
  /** Quién la propuso: reglas de palabras clave o IA (solo si está activada). */
  origen?: 'reglas' | 'ia';
}

/**
 * Categorización automática de transacciones (HU-05).
 *
 * Aplica reglas de palabras clave sobre la descripción. Está aislada en un
 * servicio propio para poder reemplazar o complementar el motor (por ejemplo,
 * con un flujo de n8n) sin tocar el resto del módulo de transacciones.
 */
@Injectable()
export class CategorizationService {
  constructor(
    private readonly categoriesService: CategoriesService,
    @Optional() private readonly ai?: AiService,
  ) {}

  /** Normaliza: minúsculas, sin tildes ni signos, con espacios simples. */
  normalize(text: string): string {
    return ` ${(text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()} `;
  }

  /** Devuelve los nombres de categoría con sus coincidencias, de mayor a menor. */
  rank(descripcion: string, tipo: CategoryType) {
    const text = this.normalize(descripcion);
    const rules = CATEGORY_KEYWORDS[tipo] ?? {};

    return Object.entries(rules)
      .map(([nombre, keywords]) => {
        const matches = keywords.filter((k) => text.includes(` ${k} `));
        return { nombre, matches, score: matches.length };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  async suggest(descripcion: string, tipo: CategoryType): Promise<CategorySuggestion> {
    if (!descripcion || !descripcion.trim()) {
      return { category: null, score: 0, matches: [] };
    }

    const best = this.rank(descripcion, tipo)[0];
    const categories = await this.categoriesService.findByType(tipo);

    if (!best) {
      // Respaldo opcional con IA (AI_CATEGORIZATION=true); siempre se valida contra la lista.
      const fallback = DEFAULT_CATEGORY_NAME[tipo];
      const nombres = categories.map((c) => c.nombre).filter((n) => n !== fallback);
      const elegido = await this.ai?.classify(descripcion, tipo, nombres);
      const category = elegido ? (categories.find((c) => c.nombre === elegido) ?? null) : null;
      return category
        ? { category, score: 0, matches: [], origen: 'ia' }
        : { category: null, score: 0, matches: [] };
    }

    const category = categories.find((c) => c.nombre === best.nombre) ?? null;
    return { category, score: best.score, matches: best.matches, origen: 'reglas' };
  }

  /**
   * Categoría a usar cuando el usuario no eligió una: la sugerida o, si no hay
   * coincidencias, la categoría por defecto ("Otros Gastos" / "Otros Ingresos").
   */
  async resolve(descripcion: string, tipo: CategoryType): Promise<Category | null> {
    const suggestion = await this.suggest(descripcion, tipo);
    if (suggestion.category) return suggestion.category;

    const categories = await this.categoriesService.findByType(tipo);
    return categories.find((c) => c.nombre === DEFAULT_CATEGORY_NAME[tipo]) ?? null;
  }
}
