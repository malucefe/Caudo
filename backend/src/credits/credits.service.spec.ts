import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreditsService } from './credits.service';

describe('CreditsService', () => {
  let credits: any, txs: any, users: any, service: CreditsService;
  const credit = (o = {}) => ({ id: 'c1', userId: 'u', nombre: 'Libre', tipo: 'libre_inversion', montoOriginal: 20_000_000, saldoActual: 15_000_000, tasaEA: 24, cuotaMensual: 700_000, cuotasRestantes: 30, estado: 'activo', ...o });

  beforeEach(() => {
    credits = { find: jest.fn(), findOne: jest.fn(), create: jest.fn((x) => x), save: jest.fn(async (x) => x), remove: jest.fn() };
    txs = { createQueryBuilder: jest.fn(() => ({ select: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getRawOne: jest.fn().mockResolvedValue({ total: null }) })) };
    users = { findById: jest.fn().mockResolvedValue({ ingresoMensual: 4_000_000 }) };
    service = new CreditsService(credits, txs, users);
  });

  it('rechaza saldo mayor al monto original', async () => {
    await expect(service.create('u', { nombre: 'x', tipo: 'otro', montoOriginal: 100, saldoActual: 200, tasaEA: 10, cuotaMensual: 10, cuotasRestantes: 5 } as any)).rejects.toThrow(BadRequestException);
  });

  it('summary calcula el porcentaje comprometido con el ingreso del perfil', async () => {
    credits.find.mockResolvedValue([credit({ cuotaMensual: 600_000 }), credit({ id: 'c2', cuotaMensual: 600_000 }), credit({ id: 'c3', estado: 'pagado', cuotaMensual: 999 })]);
    const s = await service.summary('u');
    expect(s.totalCuotas).toBe(1_200_000);
    expect(s.porcentajeComprometido).toBe(30);
    expect(s.nivel).toBe('saludable');
    expect(s.fuenteIngreso).toBe('perfil');
  });

  it('summary advierte cuando no hay ingreso', async () => {
    users.findById.mockResolvedValue({ ingresoMensual: null });
    credits.find.mockResolvedValue([credit()]);
    const s = await service.summary('u');
    expect(s.fuenteIngreso).toBe('sin_dato');
    expect(s.nivel).toBeNull();
    expect(s.advertencia).toContain('ingreso');
  });

  it('evaluate exige ingreso y devuelve veredicto', async () => {
    credits.find.mockResolvedValue([credit({ cuotaMensual: 500_000 })]);
    const r = await service.evaluate('u', { monto: 5_000_000, tasaEA: 20, plazoMeses: 36 });
    expect(r.veredicto).toBe('viable');
    users.findById.mockResolvedValue({ ingresoMensual: null });
    await expect(service.evaluate('u', { monto: 1, tasaEA: 1, plazoMeses: 1 })).rejects.toThrow(BadRequestException);
  });

  it('simula abono y compra de cartera sobre un crédito propio', async () => {
    credits.findOne.mockResolvedValue(credit());
    const a = await service.simulateAbono('u', 'c1', { abono: 3_000_000, modalidad: 'reducir_plazo' });
    expect(a.ahorroIntereses).toBeGreaterThan(0);
    const c = await service.simulateCompraCartera('u', 'c1', { tasaEANueva: 15, plazoMesesNuevo: 30 });
    expect(c.conviene).toBe(true);
  });

  it('no simula sobre créditos ajenos ni pagados; cuota que no cubre intereses → 400', async () => {
    credits.findOne.mockResolvedValue(null);
    await expect(service.simulateAbono('u', 'x', { abono: 1, modalidad: 'reducir_plazo' })).rejects.toThrow(NotFoundException);
    credits.findOne.mockResolvedValue(credit({ estado: 'pagado' }));
    await expect(service.simulateAbono('u', 'c1', { abono: 1, modalidad: 'reducir_plazo' })).rejects.toThrow(BadRequestException);
    credits.findOne.mockResolvedValue(credit({ cuotaMensual: 1000 }));
    await expect(service.simulateAbono('u', 'c1', { abono: 1000, modalidad: 'reducir_plazo' })).rejects.toThrow(BadRequestException);
  });

  it('marca como pagado al dejar saldo en cero', async () => {
    credits.findOne.mockResolvedValue(credit());
    const r = await service.update('u', 'c1', { saldoActual: 0 });
    expect(r.estado).toBe('pagado');
  });
});
