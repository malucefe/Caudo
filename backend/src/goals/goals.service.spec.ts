import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GoalsService } from './goals.service';

describe('GoalsService', () => {
  let goals: any, contributions: any, ds: any, service: GoalsService;
  const goal = () => ({ id: 'g1', userId: 'u', nombre: 'Viaje', montoObjetivo: 1000, montoAhorrado: 400, fechaLimite: '2030-01-01', estado: 'activa', createdAt: new Date('2026-01-01') });

  beforeEach(() => {
    goals = { findOne: jest.fn(), find: jest.fn(), create: jest.fn((x) => ({ ...x, createdAt: new Date() })), save: jest.fn(async (x) => x), remove: jest.fn() };
    contributions = { find: jest.fn().mockResolvedValue([]) };
    ds = { transaction: jest.fn(async (cb) => cb(manager)) };
    manager.findOne = jest.fn(); manager.save = jest.fn(async (x) => x); manager.create = jest.fn((_, x) => x);
    service = new GoalsService(goals, contributions, ds);
  });
  const manager: any = {};

  it('rechaza fechas límite pasadas', async () => {
    await expect(service.create('u', { nombre: 'x', montoObjetivo: 10, fechaLimite: '2020-01-01' })).rejects.toThrow(BadRequestException);
  });

  it('un aporte suma al acumulado y marca la meta como cumplida al llegar al objetivo', async () => {
    goals.findOne.mockResolvedValue(goal());
    const g = goal(); manager.findOne.mockResolvedValue(g);
    await service.addContribution('u', 'g1', { monto: 600 });
    expect(g.montoAhorrado).toBe(1000);
    expect(g.estado).toBe('cumplida');
  });

  it('un aporte parcial deja la meta activa', async () => {
    goals.findOne.mockResolvedValue(goal());
    const g = goal(); manager.findOne.mockResolvedValue(g);
    await service.addContribution('u', 'g1', { monto: 100 });
    expect(g.montoAhorrado).toBe(500);
    expect(g.estado).toBe('activa');
  });

  it('no permite tocar metas ajenas', async () => {
    goals.findOne.mockResolvedValue(null);
    await expect(service.findOne('u', 'g1')).rejects.toThrow(NotFoundException);
    await expect(service.addContribution('u', 'g1', { monto: 5 })).rejects.toThrow(NotFoundException);
  });
});
