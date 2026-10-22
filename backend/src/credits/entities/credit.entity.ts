import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

export enum CreditType {
  LIBRE_INVERSION = 'libre_inversion',
  HIPOTECARIO = 'hipotecario',
  VEHICULO = 'vehiculo',
  TARJETA = 'tarjeta',
  EDUCATIVO = 'educativo',
  OTRO = 'otro',
}

export enum CreditStatus {
  ACTIVO = 'activo',
  PAGADO = 'pagado',
}

@Entity('credits')
export class Credit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 120 })
  nombre: string;

  @Column({ length: 120, nullable: true })
  entidad: string;

  @Column({ type: 'enum', enum: CreditType, default: CreditType.OTRO })
  tipo: CreditType;

  @Column({ name: 'monto_original', type: 'decimal', precision: 15, scale: 2, transformer: decimalTransformer })
  montoOriginal: number;

  @Column({ name: 'saldo_actual', type: 'decimal', precision: 15, scale: 2, transformer: decimalTransformer })
  saldoActual: number;

  /** Tasa Efectiva Anual en %. */
  @Column({ name: 'tasa_ea', type: 'decimal', precision: 6, scale: 2, transformer: decimalTransformer })
  tasaEA: number;

  @Column({ name: 'cuota_mensual', type: 'decimal', precision: 15, scale: 2, transformer: decimalTransformer })
  cuotaMensual: number;

  @Column({ name: 'cuotas_restantes', type: 'int' })
  cuotasRestantes: number;

  @Column({ type: 'enum', enum: CreditStatus, default: CreditStatus.ACTIVO })
  estado: CreditStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
