import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Ejecuciones de webhooks hacia n8n (resultado y duración, sin contenido). */
@Entity('webhook_runs')
export class WebhookRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 60 })
  flujo: string;

  @Column()
  exitoso: boolean;

  @Column({ name: 'duracion_ms', type: 'int' })
  duracionMs: number;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
