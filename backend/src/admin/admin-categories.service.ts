import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { MonitoringService } from '../monitoring/monitoring.service';
import { Actor } from './admin-users.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/admin.dto';

/** Categorías de respaldo de la categorización automática; no se pueden renombrar ni borrar. */
export const PROTECTED_CATEGORIES = ['Otros Gastos', 'Otros Ingresos'];

@Injectable()
export class AdminCategoriesService {
  constructor(
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    @InjectRepository(Budget) private readonly budgets: Repository<Budget>,
    private readonly monitoring: MonitoringService,
  ) {}

  async list() {
    const rows = await this.categories
      .createQueryBuilder('c')
      .leftJoin('c.transactions', 't')
      .select(['c.id AS id', 'c.nombre AS nombre', 'c.tipo AS tipo', 'c.icono AS icono'])
      .addSelect('COUNT(t.id)', 'transacciones')
      .groupBy('c.id')
      .orderBy('c.tipo', 'ASC')
      .addOrderBy('c.nombre', 'ASC')
      .getRawMany<{ id: string; nombre: string; tipo: string; icono: string | null; transacciones: string }>();
    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
      icono: r.icono,
      transacciones: Number(r.transacciones),
      protegida: PROTECTED_CATEGORIES.includes(r.nombre),
    }));
  }

  async create(actor: Actor, dto: CreateCategoryDto) {
    const nombre = dto.nombre.trim();
    const dup = await this.categories
      .createQueryBuilder('c')
      .where('LOWER(c.nombre) = LOWER(:n) AND c.tipo = :t', { n: nombre, t: dto.tipo })
      .getOne();
    if (dup) throw new ConflictException('Ya existe una categoría con ese nombre y tipo');
    const saved = await this.categories.save(
      this.categories.create({ nombre, tipo: dto.tipo, icono: dto.icono?.trim() || undefined }),
    );
    await this.monitoring.audit({
      actorId: actor.userId, actorEmail: actor.email, accion: 'category.crear',
      entidad: 'category', entidadId: saved.id, detalle: { nombre, tipo: dto.tipo },
    });
    return saved;
  }

  async update(actor: Actor, id: string, dto: UpdateCategoryDto) {
    const cat = await this.findOrFail(id);
    const cambios: Record<string, unknown> = {};
    if (dto.nombre !== undefined && dto.nombre.trim() !== cat.nombre) {
      if (PROTECTED_CATEGORIES.includes(cat.nombre)) {
        throw new ConflictException(`"${cat.nombre}" es una categoría del sistema y no se puede renombrar`);
      }
      const nombre = dto.nombre.trim();
      const dup = await this.categories
        .createQueryBuilder('c')
        .where('LOWER(c.nombre) = LOWER(:n) AND c.tipo = :t AND c.id <> :id', { n: nombre, t: cat.tipo, id })
        .getOne();
      if (dup) throw new ConflictException('Ya existe una categoría con ese nombre y tipo');
      cambios.nombre = { de: cat.nombre, a: nombre };
      cat.nombre = nombre;
    }
    if (dto.icono !== undefined && dto.icono !== cat.icono) {
      cambios.icono = { de: cat.icono, a: dto.icono };
      cat.icono = dto.icono;
    }
    if (Object.keys(cambios).length === 0) return cat;
    const saved = await this.categories.save(cat);
    await this.monitoring.audit({
      actorId: actor.userId, actorEmail: actor.email, accion: 'category.editar',
      entidad: 'category', entidadId: id, detalle: cambios,
    });
    return saved;
  }

  async remove(actor: Actor, id: string) {
    const cat = await this.findOrFail(id);
    if (PROTECTED_CATEGORIES.includes(cat.nombre)) {
      throw new ConflictException(`"${cat.nombre}" es una categoría del sistema y no se puede eliminar`);
    }
    const [txs, buds] = await Promise.all([
      this.transactions.count({ where: { categoriaId: id } }),
      this.budgets.count({ where: { categoriaId: id } }),
    ]);
    if (txs > 0 || buds > 0) {
      throw new ConflictException(
        `No se puede eliminar: la categoría está en uso (${txs} transacciones, ${buds} presupuestos)`,
      );
    }
    await this.categories.remove(cat);
    await this.monitoring.audit({
      actorId: actor.userId, actorEmail: actor.email, accion: 'category.eliminar',
      entidad: 'category', entidadId: id, detalle: { nombre: cat.nombre, tipo: cat.tipo },
    });
    return { message: 'Categoría eliminada' };
  }

  private async findOrFail(id: string): Promise<Category> {
    const cat = await this.categories.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }
}
