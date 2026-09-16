import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

export enum TransactionType {
  INGRESO = 'ingreso',
  EGRESO = 'egreso',
}

@Entity('transactions')
@Index(['userId', 'fecha'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  tipo: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  monto: number;

  @Column({ name: 'categoria_id' })
  categoriaId: string;

  @Column({ length: 500, nullable: true })
  descripcion: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ name: 'archivo_url', nullable: true, length: 500 })
  archivoUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.transactions)
  @JoinColumn({ name: 'categoria_id' })
  category: Category;
}
