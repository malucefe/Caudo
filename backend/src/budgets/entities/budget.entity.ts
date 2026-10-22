import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('budgets')
@Unique(['userId', 'categoriaId', 'mes', 'anio'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'categoria_id' })
  categoriaId: string;

  @Column({ name: 'monto_limite', type: 'decimal', precision: 15, scale: 2, transformer: decimalTransformer })
  montoLimite: number;

  @Column({ type: 'smallint' })
  mes: number;

  @Column({ type: 'smallint' })
  anio: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoria_id' })
  category: Category;
}
