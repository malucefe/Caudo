import { CategorizationService } from './categorization.service';
import { CategoryType } from './entities/category.entity';

describe('CategorizationService', () => {
  const cats = [
    { id: '1', nombre: 'Transporte', tipo: CategoryType.EGRESO },
    { id: '2', nombre: 'Alimentación', tipo: CategoryType.EGRESO },
    { id: '3', nombre: 'Otros Gastos', tipo: CategoryType.EGRESO },
    { id: '4', nombre: 'Otros Ingresos', tipo: CategoryType.INGRESO },
  ];
  const categoriesService = {
    findByType: jest.fn(async (t: CategoryType) => cats.filter((c) => c.tipo === t)),
  };
  const service = new CategorizationService(categoriesService as any);

  it('normaliza tildes, mayúsculas y signos', () => {
    expect(service.normalize('  ALMUERZO, Café!! ')).toBe(' almuerzo cafe ');
  });

  it('sugiere por palabra clave completa', async () => {
    const r = await service.suggest('Uber a casa', CategoryType.EGRESO);
    expect(r.category?.nombre).toBe('Transporte');
    expect(r.matches).toContain('uber');
  });

  it('no coincide con subcadenas (bus en autobuses sí no aplica a "busca")', async () => {
    const r = await service.suggest('busca algo', CategoryType.EGRESO);
    expect(r.category).toBeNull();
  });

  it('descripción vacía no sugiere nada', async () => {
    const r = await service.suggest('   ', CategoryType.EGRESO);
    expect(r).toEqual({ category: null, score: 0, matches: [] });
  });

  it('resolve usa la categoría por defecto si no hay coincidencias', async () => {
    expect((await service.resolve('zzz', CategoryType.EGRESO))?.nombre).toBe('Otros Gastos');
    expect((await service.resolve('zzz', CategoryType.INGRESO))?.nombre).toBe('Otros Ingresos');
  });

  it('resolve prefiere la sugerencia cuando existe', async () => {
    expect((await service.resolve('almuerzo restaurante', CategoryType.EGRESO))?.nombre).toBe('Alimentación');
  });

  describe('respaldo con IA', () => {
    const cats = [
      { id: '1', nombre: 'Alimentación', tipo: CategoryType.EGRESO },
      { id: '2', nombre: 'Otros Gastos', tipo: CategoryType.EGRESO },
    ];
    const mk = (classify: jest.Mock) => {
      const cs = { findByType: jest.fn().mockResolvedValue(cats) };
      return new CategorizationService(cs as any, { classify } as any);
    };

    it('usa la IA solo cuando las palabras clave no coinciden, sin ofrecer la categoría por defecto', async () => {
      const classify = jest.fn().mockResolvedValue('Alimentación');
      const r = await mk(classify).suggest('zzz qwerty', CategoryType.EGRESO);
      expect(classify).toHaveBeenCalledWith('zzz qwerty', 'egreso', ['Alimentación']);
      expect(r).toMatchObject({ origen: 'ia', category: { nombre: 'Alimentación' } });
    });

    it('si la IA no responde, resolve cae a la categoría por defecto', async () => {
      const r = await mk(jest.fn().mockResolvedValue(null)).resolve('zzz qwerty', CategoryType.EGRESO);
      expect(r?.nombre).toBe('Otros Gastos');
    });

    it('no consulta la IA cuando las reglas ya resolvieron', async () => {
      const classify = jest.fn();
      const r = await mk(classify).suggest('almuerzo restaurante', CategoryType.EGRESO);
      expect(classify).not.toHaveBeenCalled();
      expect(r.origen).toBe('reglas');
    });
  });
});
