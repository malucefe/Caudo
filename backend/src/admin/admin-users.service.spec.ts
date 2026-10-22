import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { UserRole } from '../users/entities/user.entity';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('HASH') }));

const actor = { userId: 'admin-1', email: 'admin@caudo.dev' };
const baseUser = () => ({ id: 'u1', nombre: 'Ana', email: 'ana@x.co', rol: UserRole.USUARIO, activo: true, passwordHash: 'h', aceptaPolitica: true, ultimoAcceso: null, createdAt: new Date() });

describe('AdminUsersService', () => {
  let repo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let monitoring: { audit: jest.Mock };
  let svc: AdminUsersService;

  beforeEach(() => {
    repo = { findOne: jest.fn(), save: jest.fn(async (x) => x), create: jest.fn((x) => ({ id: 'new', createdAt: new Date(), ultimoAcceso: null, ...x })) };
    monitoring = { audit: jest.fn() };
    svc = new AdminUsersService(repo as any, monitoring as any);
  });

  it('crea cuenta con contraseña hasheada, correo en minúsculas y sin consentimiento', async () => {
    repo.findOne.mockResolvedValue(null);
    const r = await svc.create(actor, { nombre: ' Luis ', email: 'LUIS@X.co', password: 'Password1!' });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'luis@x.co', nombre: 'Luis', passwordHash: 'HASH', rol: UserRole.USUARIO, aceptaPolitica: false }));
    expect(r).not.toHaveProperty('passwordHash');
    expect(monitoring.audit).toHaveBeenCalledWith(expect.objectContaining({ accion: 'user.crear' }));
  });

  it('rechaza correo duplicado al crear', async () => {
    repo.findOne.mockResolvedValue(baseUser());
    await expect(svc.create(actor, { nombre: 'A', email: 'ana@x.co', password: 'Password1!' })).rejects.toThrow(ConflictException);
  });

  it('no permite cambiar el propio rol', async () => {
    repo.findOne.mockResolvedValue({ ...baseUser(), id: 'admin-1', rol: UserRole.ADMIN });
    await expect(svc.update(actor, 'admin-1', { rol: UserRole.USUARIO })).rejects.toThrow(BadRequestException);
  });

  it('promueve a otro usuario y audita el cambio de rol', async () => {
    repo.findOne.mockResolvedValue(baseUser());
    const r = await svc.update(actor, 'u1', { rol: UserRole.ADMIN });
    expect(r.rol).toBe(UserRole.ADMIN);
    expect(monitoring.audit).toHaveBeenCalledWith(expect.objectContaining({ accion: 'user.editar', detalle: { rol: { de: 'usuario', a: 'admin' } } }));
  });

  it('no suspende la propia cuenta', async () => {
    await expect(svc.setActive(actor, 'admin-1', false)).rejects.toThrow(BadRequestException);
  });

  it('suspende y reactiva a otro usuario', async () => {
    repo.findOne.mockResolvedValue(baseUser());
    expect((await svc.setActive(actor, 'u1', false)).activo).toBe(false);
    expect(monitoring.audit).toHaveBeenLastCalledWith(expect.objectContaining({ accion: 'user.suspender' }));
    repo.findOne.mockResolvedValue({ ...baseUser(), activo: false });
    expect((await svc.setActive(actor, 'u1', true)).activo).toBe(true);
    expect(monitoring.audit).toHaveBeenLastCalledWith(expect.objectContaining({ accion: 'user.reactivar' }));
  });

  it('404 si la cuenta no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(svc.setActive(actor, 'zzz', true)).rejects.toThrow(NotFoundException);
  });
});
