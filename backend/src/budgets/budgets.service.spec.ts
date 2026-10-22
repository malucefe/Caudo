import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CategoryType } from '../categories/entities/category.entity';

describe('BudgetsService', () => {
  const qb = (rows: any[]) => ({
    select: jest.fn().mockReturnThis(), addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(), getRawMany: jest.fn().mockResolvedValue(rows),
  });
  let budgets: any, txs: any, cats: any, service: BudgetsService;

  beforeEach(() => {
    budgets = { findOne: jest.fn(), find: jest.fn(), create: jest.fn((x) => ({ ...x })), save: jest.fn(async (x) => x), remove: jest.fn() };
    txs = { createQueryBuilder: jest.fn(() => qb([{ categoriaId: 'c1', total: '850' }])) };
    cats = { findById: jest.fn() };
    service = new BudgetsService(budgets, txs, cats);
  });

  it('rechaza categorías inexistentes y de ingreso', async () => {
    cats.findById.mockResolvedValueOnce(null);
    await expect(service.set('u', { categoriaId: 'x', montoLimite: 1, mes: 1, anio: 2026 })).rejects.toThrow(NotFoundException);
    cats.findById.mockResolvedValueOnce({ id: 'x', tipo: CategoryType.INGRESO });
    await expect(service.set('u', { categoriaId: 'x', montoLimite: 1, mes: 1, anio: 2026 })).rejects.toThrow(BadRequestException);
  });

  it('actualiza el tope existente en vez de duplicarlo', async () => {
    cats.findById.mockResolvedValue({ id: 'c1', tipo: CategoryType.EGRESO });
    budgets.findOne.mockResolvedValue({ id: 'b1', montoLimite: 500 });
    const r = await service.set('u', { categoriaId: 'c1', montoLimite: 900, mes: 1, anio: 2026 });
    expect(r.montoLimite).toBe(900);
    expect(budgets.create).not.toHaveBeenCalled();
  });

  it('lista con consumo y devuelve solo alertas en /alerts', async () => {
    budgets.find.mockResolvedValue([
      { id: 'b1', categoriaId: 'c1', montoLimite: 1000, mes: 1, anio: 2026, category: { nombre: 'Transporte', icono: '🚌' } },
      { id: 'b2', categoriaId: 'c2', montoLimite: 1000, mes: 1, anio: 2026, category: { nombre: 'Ocio', icono: 'x' } },
    ]);
    const list = await service.list('u', 1, 2026);
    expect(list[0]).toMatchObject({ categoria: 'Transporte', consumido: 850, estado: 'alerta' });
    const alerts = await service.alerts('u', 1, 2026);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].mensaje).toContain('85%');
  });

  it('remove lanza NotFound si no es del usuario', async () => {
    budgets.findOne.mockResolvedValue(null);
    await expect(service.remove('u', 'b')).rejects.toThrow(NotFoundException);
  });
});
