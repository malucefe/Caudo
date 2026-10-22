import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/entities/user.entity';

const ctx = (user: unknown): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  it('permite cuando la ruta no exige roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(ctx({ rol: UserRole.USUARIO }))).toBe(true);
  });

  it('permite al admin en una ruta de admin', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(ctx({ rol: UserRole.ADMIN }))).toBe(true);
  });

  it('bloquea con 403 a un usuario normal', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(ctx({ rol: UserRole.USUARIO }))).toThrow(ForbiddenException);
  });

  it('bloquea cuando no hay rol en la petición', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(ctx(undefined))).toThrow(ForbiddenException);
  });
});
