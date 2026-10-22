import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, data);
    return this.findById(id);
  }

  /**
   * Cambia la contraseña verificando la actual. Se responde 400 (y no 401)
   * cuando la contraseña actual es incorrecta, para no cerrar la sesión del
   * usuario en el frontend.
   */
  async changePassword(
    id: string,
    passwordActual: string,
    passwordNueva: string,
  ): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const isValid = await bcrypt.compare(passwordActual, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    if (passwordActual === passwordNueva) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    const passwordHash = await bcrypt.hash(passwordNueva, 12);
    await this.usersRepository.update(id, { passwordHash });
  }
}
