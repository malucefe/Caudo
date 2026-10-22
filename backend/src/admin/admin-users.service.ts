import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { MonitoringService } from '../monitoring/monitoring.service';
import { CreateUserAdminDto, ListUsersQueryDto, UpdateUserAdminDto } from './dto/admin.dto';

export interface Actor {
  userId: string;
  email: string;
}

export function toPublicUser(u: User) {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    activo: u.activo,
    aceptaPolitica: u.aceptaPolitica,
    ultimoAcceso: u.ultimoAcceso,
    createdAt: u.createdAt,
  };
}

/**
 * Gestión de cuentas por el administrador. El administrador ve datos de la
 * cuenta (nombre, correo, rol, estado), nunca las transacciones ni la
 * información financiera de las personas (Ley 1581 de 2012).
 */
@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly monitoring: MonitoringService,
  ) {}

  async list(q: ListUsersQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.users.createQueryBuilder('u').orderBy('u.createdAt', 'DESC');
    if (q.search?.trim()) {
      qb.andWhere('(u.nombre ILIKE :s OR u.email ILIKE :s)', { s: `%${q.search.trim()}%` });
    }
    if (q.rol) qb.andWhere('u.rol = :rol', { rol: q.rol });
    if (q.estado) qb.andWhere('u.activo = :activo', { activo: q.estado === 'activo' });
    const [rows, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data: rows.map(toPublicUser), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async create(actor: Actor, dto: CreateUserAdminDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.findOne({ where: { email } })) {
      throw new ConflictException('Ya existe una cuenta con este email');
    }
    const user = await this.users.save(
      this.users.create({
        nombre: dto.nombre.trim(),
        email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        rol: dto.rol ?? UserRole.USUARIO,
        activo: true,
        // El consentimiento (Ley 1581) lo otorga la persona titular, no el administrador.
        aceptaPolitica: false,
        fechaConsentimiento: null,
      }),
    );
    await this.monitoring.audit({
      actorId: actor.userId,
      actorEmail: actor.email,
      accion: 'user.crear',
      entidad: 'user',
      entidadId: user.id,
      detalle: { email: user.email, rol: user.rol },
    });
    return toPublicUser(user);
  }

  async update(actor: Actor, id: string, dto: UpdateUserAdminDto) {
    const user = await this.findOrFail(id);
    const cambios: Record<string, unknown> = {};

    if (dto.rol !== undefined && dto.rol !== user.rol) {
      if (id === actor.userId) {
        throw new BadRequestException('No puede cambiar su propio rol');
      }
      cambios.rol = { de: user.rol, a: dto.rol };
      user.rol = dto.rol;
    }
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (email !== user.email) {
        const other = await this.users.findOne({ where: { email } });
        if (other && other.id !== id) throw new ConflictException('Ya existe una cuenta con este email');
        cambios.email = { de: user.email, a: email };
        user.email = email;
      }
    }
    if (dto.nombre !== undefined && dto.nombre.trim() !== user.nombre) {
      cambios.nombre = { de: user.nombre, a: dto.nombre.trim() };
      user.nombre = dto.nombre.trim();
    }

    if (Object.keys(cambios).length === 0) return toPublicUser(user);

    const saved = await this.users.save(user);
    await this.monitoring.audit({
      actorId: actor.userId,
      actorEmail: actor.email,
      accion: 'user.editar',
      entidad: 'user',
      entidadId: id,
      detalle: cambios,
    });
    return toPublicUser(saved);
  }

  async setActive(actor: Actor, id: string, activo: boolean) {
    if (id === actor.userId && !activo) {
      throw new BadRequestException('No puede suspender su propia cuenta');
    }
    const user = await this.findOrFail(id);
    if (user.activo === activo) return toPublicUser(user);
    user.activo = activo;
    const saved = await this.users.save(user);
    await this.monitoring.audit({
      actorId: actor.userId,
      actorEmail: actor.email,
      accion: activo ? 'user.reactivar' : 'user.suspender',
      entidad: 'user',
      entidadId: id,
      detalle: { email: user.email },
    });
    return toPublicUser(saved);
  }

  private async findOrFail(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
