import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const config = { getOrThrow: () => 'secret' } as any;
  const make = (user: unknown) => new JwtStrategy(config, { findById: jest.fn().mockResolvedValue(user) } as any);

  it('devuelve userId, email y rol leídos de la base', async () => {
    const s = make({ id: 'u1', email: 'a@b.co', rol: 'admin', activo: true });
    await expect(s.validate({ sub: 'u1', email: 'old@x.co' })).resolves.toEqual({ userId: 'u1', email: 'a@b.co', rol: 'admin' });
  });

  it('rechaza una cuenta suspendida aunque el token siga vigente', async () => {
    const s = make({ id: 'u1', email: 'a@b.co', rol: 'usuario', activo: false });
    await expect(s.validate({ sub: 'u1', email: 'a@b.co' })).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza si el usuario ya no existe', async () => {
    const s = make(null);
    await expect(s.validate({ sub: 'u1', email: 'a@b.co' })).rejects.toThrow(UnauthorizedException);
  });
});
