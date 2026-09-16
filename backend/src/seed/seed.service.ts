import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { CategoryType } from '../categories/entities/category.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  async onModuleInit() {
    await this.seedCategories();
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
