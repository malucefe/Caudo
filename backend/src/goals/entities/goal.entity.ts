import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { GoalContribution } from './goal-contribution.entity';

export enum GoalStatus {
  ACTIVA = 'activa',
  CUMPLIDA = 'cumplida',
}

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 120 })
  nombre: string;

  @Column({ name: 'monto_objetivo', type: 'decimal', precision: 15, scale: 2, transformer: decimalTransformer })
  montoObjetivo: number;

  @Column({ name: 'monto_ahorrado', type: 'decimal', precision: 15, scale: 2, default: 0, transformer: decimalTransformer })
  montoAhorrado: number;

  @Column({ name: 'fecha_limite', type: 'date' })
  fechaLimite: string;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.ACTIVA })
  estado: GoalStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => GoalContribution, (c) => c.goal)
  aportes: GoalContribution[];
}
