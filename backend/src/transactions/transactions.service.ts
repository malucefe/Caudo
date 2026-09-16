import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    const transaction = this.transactionsRepository.create({
      ...dto,
      userId,
    });
    const saved = await this.transactionsRepository.save(transaction);

    return this.findOne(userId, saved.id);
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 20,
    tipo?: TransactionType,
    mes?: number,
    anio?: number,
  ) {
    const query = this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .where('t.userId = :userId', { userId })
      .orderBy('t.fecha', 'DESC')
      .addOrderBy('t.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (tipo) {
      query.andWhere('t.tipo = :tipo', { tipo });
    }

    if (mes && anio) {
      const startDate = new Date(anio, mes - 1, 1);
      const endDate = new Date(anio, mes, 0);
      query.andWhere('t.fecha BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });
    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada');
    }
    return transaction;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(userId, id);
    Object.assign(transaction, dto);
    await this.transactionsRepository.save(transaction);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const transaction = await this.findOne(userId, id);
    await this.transactionsRepository.remove(transaction);
  }

  async getSummary(userId: string, mes: number, anio: number) {
    const startDate = new Date(anio, mes - 1, 1);
    const endDate = new Date(anio, mes, 0);

    const result = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('t.tipo', 'tipo')
      .addSelect('SUM(t.monto)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.fecha BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .groupBy('t.tipo')
      .getRawMany();

    const ingresos =
      result.find((r) => r.tipo === 'ingreso')?.total || 0;
    const egresos =
      result.find((r) => r.tipo === 'egreso')?.total || 0;

    // Gastos por categoría
    const porCategoria = await this.transactionsRepository
      .createQueryBuilder('t')
      .leftJoin('t.category', 'category')
      .select('category.nombre', 'categoria')
      .addSelect('category.icono', 'icono')
      .addSelect('t.tipo', 'tipo')
      .addSelect('SUM(t.monto)', 'total')
      .addSelect('COUNT(t.id)', 'cantidad')
      .where('t.userId = :userId', { userId })
      .andWhere('t.fecha BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .groupBy('category.nombre')
      .addGroupBy('category.icono')
      .addGroupBy('t.tipo')
      .orderBy('total', 'DESC')
      .getRawMany();

    return {
      mes,
      anio,
      ingresos: Number(ingresos),
      egresos: Number(egresos),
      balance: Number(ingresos) - Number(egresos),
      porCategoria,
    };
  }

  async getMonthlyTrend(userId: string, months = 6) {
    const result = await this.transactionsRepository
      .createQueryBuilder('t')
      .select("TO_CHAR(t.fecha, 'YYYY-MM')", 'mes')
      .addSelect('t.tipo', 'tipo')
      .addSelect('SUM(t.monto)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.fecha >= :startDate', {
        startDate: new Date(
          new Date().getFullYear(),
          new Date().getMonth() - months + 1,
          1,
        )
          .toISOString()
          .split('T')[0],
      })
      .groupBy("TO_CHAR(t.fecha, 'YYYY-MM')")
      .addGroupBy('t.tipo')
      .orderBy('mes', 'ASC')
      .getRawMany();

    return result;
  }
}
