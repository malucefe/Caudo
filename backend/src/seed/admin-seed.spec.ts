import { accountsFromEnv } from './admin-seed';
import { UserRole } from '../users/entities/user.entity';

describe('accountsFromEnv', () => {
  it('no crea cuentas si faltan variables', () => {
    expect(accountsFromEnv({})).toEqual([]);
    expect(accountsFromEnv({ ADMIN_EMAIL: 'a@b.co' })).toEqual([]);
  });

  it('crea admin y usuario demo normalizando el correo', () => {
    const r = accountsFromEnv({ ADMIN_EMAIL: ' Admin@Caudo.dev ', ADMIN_PASSWORD: 'x', DEMO_USER_EMAIL: 'user@caudo.dev', DEMO_USER_PASSWORD: 'y' });
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ email: 'admin@caudo.dev', rol: UserRole.ADMIN });
    expect(r[1]).toMatchObject({ email: 'user@caudo.dev', rol: UserRole.USUARIO });
  });
});
