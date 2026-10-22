import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Registro de auditoría de acciones administrativas y eventos de seguridad. */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Quién ejecutó la acción (null si fue un intento anónimo, p. ej. login fallido). */
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ name: 'actor_email', type: 'varchar', length: 255, nullable: true })
  actorEmail: string | null;

  @Index()
  @Column({ length: 60 })
  accion: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  entidad: string | null;

  @Column({ name: 'entidad_id', type: 'varchar', length: 60, nullable: true })
  entidadId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  detalle: Record<string, unknown> | null;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
