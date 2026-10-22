import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { accountsFromEnv } from './admin-seed';
import { CategoriesService } from '../categories/categories.service';
import { CategoryType } from '../categories/entities/category.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedCategories();
    await this.seedAccounts();
  }

  /**
   * Crea las cuentas iniciales de ADMIN_* / DEMO_USER_*. Si el correo ya existe
   * no toca su contraseña; solo asegura el rol y que la cuenta esté activa.
   */
  private async seedAccounts() {
    const env = {
      ADMIN_EMAIL: this.config.get<string>('ADMIN_EMAIL'),
      ADMIN_PASSWORD: this.config.get<string>('ADMIN_PASSWORD'),
      ADMIN_NOMBRE: this.config.get<string>('ADMIN_NOMBRE'),
      DEMO_USER_EMAIL: this.config.get<string>('DEMO_USER_EMAIL'),
      DEMO_USER_PASSWORD: this.config.get<string>('DEMO_USER_PASSWORD'),
      DEMO_USER_NOMBRE: this.config.get<string>('DEMO_USER_NOMBRE'),
    };
    for (const acc of accountsFromEnv(env)) {
      const existing = await this.usersService.findByEmail(acc.email);
      if (existing) {
        if (existing.rol !== acc.rol || !existing.activo) {
          await this.usersService.update(existing.id, { rol: acc.rol, activo: true });
          this.logger.log(`Cuenta ${acc.email} actualizada (rol ${acc.rol})`);
        }
        continue;
      }
      await this.usersService.create({
        nombre: acc.nombre,
        email: acc.email,
        passwordHash: await bcrypt.hash(acc.password, 12),
        rol: acc.rol,
        activo: true,
        aceptaPolitica: false,
      });
      this.logger.log(`Cuenta ${acc.rol} creada: ${acc.email}`);
    }
  }

  private async seedCategories() {
    const count = await this.categoriesService.count();
    if (count > 0) {
      this.logger.log('Categorías ya existen, omitiendo seed');
      return;
    }

    this.logger.log('Sembrando categorías para el consumidor colombiano...');

    const categoriasEgreso = [
      { nombre: 'Transporte', tipo: CategoryType.EGRESO, icono: '🚌' },
      { nombre: 'Alimentación', tipo: CategoryType.EGRESO, icono: '🍽️' },
      { nombre: 'Arriendo', tipo: CategoryType.EGRESO, icono: '🏠' },
      { nombre: 'Servicios Públicos', tipo: CategoryType.EGRESO, icono: '💡' },
      { nombre: 'Entretenimiento', tipo: CategoryType.EGRESO, icono: '🎬' },
      { nombre: 'Salud', tipo: CategoryType.EGRESO, icono: '🏥' },
      { nombre: 'Educación', tipo: CategoryType.EGRESO, icono: '📚' },
      { nombre: 'Ropa', tipo: CategoryType.EGRESO, icono: '👕' },
      { nombre: 'Tecnología', tipo: CategoryType.EGRESO, icono: '💻' },
      { nombre: 'Ahorro', tipo: CategoryType.EGRESO, icono: '🏦' },
      { nombre: 'Mascota', tipo: CategoryType.EGRESO, icono: '🐾' },
      { nombre: 'Cuidado Personal', tipo: CategoryType.EGRESO, icono: '💆' },
      { nombre: 'Suscripciones', tipo: CategoryType.EGRESO, icono: '📺' },
      { nombre: 'Otros Gastos', tipo: CategoryType.EGRESO, icono: '📦' },
    ];

    const categoriasIngreso = [
      { nombre: 'Salario', tipo: CategoryType.INGRESO, icono: '💰' },
      { nombre: 'Freelance', tipo: CategoryType.INGRESO, icono: '💼' },
      { nombre: 'Inversiones', tipo: CategoryType.INGRESO, icono: '📈' },
      { nombre: 'Ventas', tipo: CategoryType.INGRESO, icono: '💰' },
      { nombre: 'Bonificaciones', tipo: CategoryType.INGRESO, icono: '🎁' },
      { nombre: 'Otros Ingresos', tipo: CategoryType.INGRESO, icono: '💵' },
    ];

    const todas = [...categoriasEgreso, ...categoriasIngreso];

    for (const cat of todas) {
      await this.categoriesService.create(cat);
    }

    this.logger.log(`${todas.length} categorías creadas exitosamente`);
  }
}
