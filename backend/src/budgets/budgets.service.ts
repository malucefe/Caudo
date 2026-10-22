import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { SetBudgetDto } from './dto/set-budget.dto';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { CategoriesService } from '../categories/categories.service';
import { CategoryType } from '../categories/entities/category.entity';
import { monthRange } from '../common/utils/date.util';
import { alertMessage, evaluateBudget } from './budget-logic';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget) private readonly budgets: Repository<Budget>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    private readonly categories: CategoriesService,
  ) {}

  /** Crea el tope de la categoría en el mes o lo actualiza si ya existe. */
  async set(userId: string, dto: SetBudgetDto): Promise<Budget> {
    const category = await this.categories.findById(dto.categoriaId);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    if (category.tipo !== CategoryType.EGRESO) {
      throw new BadRequestException('Solo se pueden definir topes para categorías de gasto');
    }
    const existing = await this.budgets.findOne({
      where: { userId, categoriaId: dto.categoriaId, mes: dto.mes, anio: dto.anio },
    });
    const entity = existing ?? this.budgets.create({ ...dto, userId });
    entity.montoLimite = dto.montoLimite;
    return this.budgets.save(entity);
  }

  private async spentByCategory(userId: string, mes: number, anio: number) {
    const { start, end } = monthRange(mes, anio);
    const rows = await this.transactions
      .createQueryBuilder('t')
      .select('t.categoriaId', 'categoriaId')
      .addSelect('SUM(t.monto)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.tipo = :tipo', { tipo: TransactionType.EGRESO })
      .andWhere('t.fecha BETWEEN :start AND :end', { start, end })
      .groupBy('t.categoriaId')
      .getRawMany();
    return new Map<string, number>(rows.map((r) => [r.categoriaId, Number(r.total)]));
  }

  async list(userId: string, mes: number, anio: number) {
    const [budgets, spent] = await Promise.all([
      this.budgets.find({ where: { userId, mes, anio }, relations: ['category'] }),
      this.spentByCategory(userId, mes, anio),
    ]);
    return budgets
      .map((b) => {
        const consumido = spent.get(b.categoriaId) ?? 0;
        return {
          id: b.id,
          categoriaId: b.categoriaId,
          categoria: b.category?.nombre,
          icono: b.category?.icono,
          mes: b.mes,
          anio: b.anio,
          montoLimite: b.montoLimite,
          consumido,
          ...evaluateBudget(b.montoLimite, consumido),
        };
      })
      .sort((a, b) => b.porcentaje - a.porcentaje);
  }

  /** Presupuestos en alerta (≥80%) o excedidos (≥100%) del mes. */
  async alerts(userId: string, mes: number, anio: number) {
    const items = await this.list(userId, mes, anio);
    return items
      .filter((i) => i.estado !== 'ok')
      .map((i) => ({
        ...i,
        mensaje: alertMessage(i.categoria ?? 'la categoría', i, i.montoLimite),
      }));
  }

  async remove(userId: string, id: string): Promise<void> {
    const budget = await this.budgets.findOne({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    await this.budgets.remove(budget);
  }
}
