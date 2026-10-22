import { ConflictException } from '@nestjs/common';
import { AdminCategoriesService } from './admin-categories.service';
import { CategoryType } from '../categories/entities/category.entity';

const actor = { userId: 'a1', email: 'admin@caudo.dev' };

describe('AdminCategoriesService', () => {
  const qb = (result: unknown) => ({ where: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(result) });
  let cats: any, txs: any, buds: any, monitoring: any, svc: AdminCategoriesService;

  beforeEach(() => {
    cats = { createQueryBuilder: jest.fn(), save: jest.fn(async (x) => ({ id: 'c1', ...x })), create: jest.fn((x) => x), findOne: jest.fn(), remove: jest.fn() };
    txs = { count: jest.fn().mockResolvedValue(0) };
    buds = { count: jest.fn().mockResolvedValue(0) };
    monitoring = { audit: jest.fn() };
    svc = new AdminCategoriesService(cats, txs, buds, monitoring);
  });

  it('crea una categoría y la audita', async () => {
    cats.createQueryBuilder.mockReturnValue(qb(null));
    const r = await svc.create(actor, { nombre: ' Gimnasio ', tipo: CategoryType.EGRESO, icono: '🏋️' });
    expect(r.nombre).toBe('Gimnasio');
    expect(monitoring.audit).toHaveBeenCalledWith(expect.objectContaining({ accion: 'category.crear' }));
  });

  it('rechaza nombre duplicado del mismo tipo', async () => {
    cats.createQueryBuilder.mockReturnValue(qb({ id: 'x' }));
    await expect(svc.create(actor, { nombre: 'Salud', tipo: CategoryType.EGRESO })).rejects.toThrow(ConflictException);
  });

  it('no renombra ni elimina las categorías de respaldo del sistema', async () => {
    cats.findOne.mockResolvedValue({ id: 'c9', nombre: 'Otros Gastos', tipo: CategoryType.EGRESO });
    await expect(svc.update(actor, 'c9', { nombre: 'Varios' })).rejects.toThrow(ConflictException);
    await expect(svc.remove(actor, 'c9')).rejects.toThrow(ConflictException);
  });

  it('no elimina una categoría en uso', async () => {
    cats.findOne.mockResolvedValue({ id: 'c2', nombre: 'Salud', tipo: CategoryType.EGRESO });
    txs.count.mockResolvedValue(3);
    await expect(svc.remove(actor, 'c2')).rejects.toThrow(/en uso/);
    expect(cats.remove).not.toHaveBeenCalled();
  });

  it('elimina una categoría sin uso', async () => {
    cats.findOne.mockResolvedValue({ id: 'c3', nombre: 'Nueva', tipo: CategoryType.EGRESO });
    await svc.remove(actor, 'c3');
    expect(cats.remove).toHaveBeenCalled();
    expect(monitoring.audit).toHaveBeenCalledWith(expect.objectContaining({ accion: 'category.eliminar' }));
  });
});
