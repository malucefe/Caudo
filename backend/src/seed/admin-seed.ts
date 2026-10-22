import { UserRole } from '../users/entities/user.entity';

export interface SeedAccount {
  email: string;
  password: string;
  nombre: string;
  rol: UserRole;
}

/**
 * Cuentas iniciales definidas por variables de entorno (ADMIN_* y DEMO_USER_*).
 * Si falta correo o contraseña, esa cuenta simplemente no se crea.
 */
export function accountsFromEnv(env: Record<string, string | undefined>): SeedAccount[] {
  const out: SeedAccount[] = [];
  const admin = { email: env.ADMIN_EMAIL?.trim().toLowerCase(), password: env.ADMIN_PASSWORD };
  if (admin.email && admin.password) {
    out.push({ ...admin, email: admin.email, password: admin.password, nombre: env.ADMIN_NOMBRE?.trim() || 'Administrador Caudo', rol: UserRole.ADMIN });
  }
  const demo = { email: env.DEMO_USER_EMAIL?.trim().toLowerCase(), password: env.DEMO_USER_PASSWORD };
  if (demo.email && demo.password) {
    out.push({ ...demo, email: demo.email, password: demo.password, nombre: env.DEMO_USER_NOMBRE?.trim() || 'Usuario Demo', rol: UserRole.USUARIO });
  }
  return out;
}
