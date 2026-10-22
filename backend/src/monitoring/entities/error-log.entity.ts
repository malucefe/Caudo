import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Errores 5xx de la API REST (sin cuerpos de petición ni datos financieros). */
@Entity('error_logs')
export class ErrorLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'status_code', type: 'int' })
  statusCode: number;

  @Column({ length: 10 })
  metodo: string;

  @Column({ length: 300 })
  ruta: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
