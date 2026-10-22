import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credit, CreditStatus } from './entities/credit.entity';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { UsersService } from '../users/users.service';
import { CreateCreditDto, EvaluateCreditDto, SimulateAbonoDto, SimulateCompraCarteraDto, UpdateCreditDto } from './dto/credit.dto';
import {
  evaluateNewCredit, nivelEndeudamiento, porcentajeComprometido, round2,
  simulateAbono, simulateCompraCartera, UMBRAL_PRECAUCION, UMBRAL_SALUDABLE,
} from './credit-math';
import { currentMonth, monthRange } from '../common/utils/date.util';
import { compareAbono, describeCompraCartera, prioritizeCredits } from './credit-advice';

export type FuenteIngreso = 'perfil' | 'mes_actual' | 'sin_dato';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(Credit) private readonly credits: Repository<Credit>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    private readonly users: UsersService,
  ) {}

  async create(userId: string, dto: CreateCreditDto) {
    if (dto.saldoActual > dto.montoOriginal) {
      throw new BadRequestException('El saldo actual no puede superar el monto original');
    }
    return this.credits.save(this.credits.create({ ...dto, userId }));
  }

  findAll(userId: string) {
    return this.credits.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  private async getOwned(userId: string, id: string): Promise<Credit> {
    const credit = await this.credits.findOne({ where: { id, userId } });
    if (!credit) throw new NotFoundException('Crédito no encontrado');
    return credit;
  }

  findOne(userId: string, id: string) {
    return this.getOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateCreditDto) {
    const credit = await this.getOwned(userId, id);
    Object.assign(credit, dto);
    if (credit.saldoActual <= 0 || credit.cuotasRestantes === 0) credit.estado = CreditStatus.PAGADO;
    return this.credits.save(credit);
  }

  async remove(userId: string, id: string) {
    await this.credits.remove(await this.getOwned(userId, id));
  }

  /** Ingreso mensual de referencia: el del perfil o, si falta, el registrado en el mes actual. */
  async resolveIncome(userId: string): Promise<{ ingresoMensual: number; fuente: FuenteIngreso }> {
    const user = await this.users.findById(userId);
    if (user?.ingresoMensual && user.ingresoMensual > 0) {
      return { ingresoMensual: user.ingresoMensual, fuente: 'perfil' };
    }
    const { mes, anio } = currentMonth();
    const { start, end } = monthRange(mes, anio);
    const row = await this.transactions
      .createQueryBuilder('t')
      .select('SUM(t.monto)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.tipo = :tipo', { tipo: TransactionType.INGRESO })
      .andWhere('t.fecha BETWEEN :start AND :end', { start, end })
      .getRawOne();
    const total = Number(row?.total ?? 0);
    return total > 0 ? { ingresoMensual: total, fuente: 'mes_actual' } : { ingresoMensual: 0, fuente: 'sin_dato' };
  }

  /** Obligaciones vigentes y porcentaje del ingreso comprometido en cuotas. */
  async summary(userId: string) {
    const [all, income] = await Promise.all([this.findAll(userId), this.resolveIncome(userId)]);
    const activos = all.filter((c) => c.estado === CreditStatus.ACTIVO);
    const totalCuotas = round2(activos.reduce((s, c) => s + c.cuotaMensual, 0));
    const totalSaldo = round2(activos.reduce((s, c) => s + c.saldoActual, 0));
    const porcentaje = porcentajeComprometido(totalCuotas, income.ingresoMensual);
    return {
      creditos: activos,
      totalCuotas,
      totalSaldo,
      ingresoMensual: income.ingresoMensual,
      fuenteIngreso: income.fuente,
      porcentajeComprometido: porcentaje,
      nivel: income.ingresoMensual > 0 ? nivelEndeudamiento(porcentaje) : null,
      umbrales: { saludable: UMBRAL_SALUDABLE, precaucion: UMBRAL_PRECAUCION },
      prioridadAbono: prioritizeCredits(activos),
      advertencia:
        income.fuente === 'sin_dato'
          ? 'Registra tu ingreso mensual en el perfil para calcular el porcentaje comprometido.'
          : null,
    };
  }

  async evaluate(userId: string, dto: EvaluateCreditDto) {
    const summary = await this.summary(userId);
    if (summary.ingresoMensual <= 0) {
      throw new BadRequestException('Registra tu ingreso mensual en el perfil para evaluar un crédito');
    }
    return {
      ...evaluateNewCredit({
        ingresoMensual: summary.ingresoMensual,
        cuotasActuales: summary.totalCuotas,
        monto: dto.monto,
        tasaEA: dto.tasaEA,
        plazoMeses: dto.plazoMeses,
      }),
      ingresoMensual: summary.ingresoMensual,
      cuotasActuales: summary.totalCuotas,
    };
  }

  /** Simula un abono extraordinario a capital (pago anticipado, Ley 1555 de 2012). */
  async simulateAbono(userId: string, id: string, dto: SimulateAbonoDto) {
    const c = await this.getOwned(userId, id);
    if (c.estado === CreditStatus.PAGADO) throw new BadRequestException('El crédito ya está pagado');
    try {
      const base = {
        saldo: c.saldoActual, tasaEA: c.tasaEA, cuota: c.cuotaMensual,
        cuotasRestantes: c.cuotasRestantes, abono: dto.abono,
      };
      return {
        ...simulateAbono({ ...base, modalidad: dto.modalidad }),
        comparacion: compareAbono(base),
      };
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  async simulateCompraCartera(userId: string, id: string, dto: SimulateCompraCarteraDto) {
    const c = await this.getOwned(userId, id);
    if (c.estado === CreditStatus.PAGADO) throw new BadRequestException('El crédito ya está pagado');
    try {
      const result = simulateCompraCartera({
        saldo: c.saldoActual, tasaEAActual: c.tasaEA, cuotaActual: c.cuotaMensual,
        tasaEANueva: dto.tasaEANueva, plazoMesesNuevo: dto.plazoMesesNuevo, gastosCierre: dto.gastosCierre ?? 0,
      });
      return { ...result, analisis: describeCompraCartera(result, dto.plazoMesesNuevo) };
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }
}
