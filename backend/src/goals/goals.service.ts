import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Goal, GoalStatus } from './entities/goal.entity';
import { GoalContribution } from './entities/goal-contribution.entity';
import { AddContributionDto, CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
import { projectGoal } from './goal-logic';
import { toIsoDate } from '../common/utils/date.util';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal) private readonly goals: Repository<Goal>,
    @InjectRepository(GoalContribution) private readonly contributions: Repository<GoalContribution>,
    private readonly dataSource: DataSource,
  ) {}

  private view(goal: Goal) {
    return {
      id: goal.id,
      nombre: goal.nombre,
      montoObjetivo: goal.montoObjetivo,
      montoAhorrado: goal.montoAhorrado,
      fechaLimite: goal.fechaLimite,
      estado: goal.estado,
      createdAt: goal.createdAt,
      ...projectGoal({
        montoObjetivo: goal.montoObjetivo,
        montoAhorrado: goal.montoAhorrado,
        fechaCreacion: goal.createdAt,
        fechaLimite: new Date(`${goal.fechaLimite}T00:00:00`),
      }),
    };
  }

  async create(userId: string, dto: CreateGoalDto) {
    if (dto.fechaLimite <= toIsoDate(new Date())) {
      throw new BadRequestException('La fecha límite debe ser posterior a hoy');
    }
    const goal = await this.goals.save(this.goals.create({ ...dto, userId }));
    return this.view(goal);
  }

  async findAll(userId: string) {
    const list = await this.goals.find({ where: { userId }, order: { fechaLimite: 'ASC' } });
    return list.map((g) => this.view(g));
  }

  private async getOwned(userId: string, id: string): Promise<Goal> {
    const goal = await this.goals.findOne({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    return goal;
  }

  async findOne(userId: string, id: string) {
    const goal = await this.getOwned(userId, id);
    const aportes = await this.contributions.find({ where: { goalId: id }, order: { fecha: 'DESC', createdAt: 'DESC' } });
    return { ...this.view(goal), aportes };
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const goal = await this.getOwned(userId, id);
    Object.assign(goal, dto);
    goal.estado = goal.montoAhorrado >= goal.montoObjetivo ? GoalStatus.CUMPLIDA : GoalStatus.ACTIVA;
    return this.view(await this.goals.save(goal));
  }

  /** Registra un aporte y actualiza el acumulado de forma atómica. */
  async addContribution(userId: string, id: string, dto: AddContributionDto) {
    await this.getOwned(userId, id);
    await this.dataSource.transaction(async (manager) => {
      const goal = await manager.findOne(Goal, { where: { id, userId }, lock: { mode: 'pessimistic_write' } });
      if (!goal) throw new NotFoundException('Meta no encontrada');
      await manager.save(manager.create(GoalContribution, { goalId: id, monto: dto.monto, fecha: dto.fecha ?? toIsoDate(new Date()) }));
      goal.montoAhorrado = Math.round((Number(goal.montoAhorrado) + dto.monto) * 100) / 100;
      if (goal.montoAhorrado >= goal.montoObjetivo) goal.estado = GoalStatus.CUMPLIDA;
      await manager.save(goal);
    });
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.goals.remove(await this.getOwned(userId, id));
  }
}
