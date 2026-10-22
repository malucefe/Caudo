import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

export enum UserRole {
  USUARIO = 'usuario',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  /** Ingreso mensual de referencia (COP), base del cálculo de endeudamiento. */
  @Column({
    name: 'ingreso_mensual',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  ingresoMensual: number | null;

  /** Aceptación de la política de tratamiento de datos personales (Ley 1581 de 2012). */
  @Column({ name: 'acepta_politica', default: false })
  aceptaPolitica: boolean;

  @Column({ name: 'fecha_consentimiento', type: 'timestamp', nullable: true })
  fechaConsentimiento: Date | null;

  /** Rol del actor: usuario final o administrador (el registro público siempre crea 'usuario'). */
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USUARIO })
  rol: UserRole;

  /** false = cuenta suspendida por un administrador (no puede iniciar sesión). */
  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'ultimo_acceso', type: 'timestamp', nullable: true })
  ultimoAcceso: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];
}
