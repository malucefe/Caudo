import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MonitoringService } from '../monitoring/monitoring.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly monitoring: MonitoringService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta con este email');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const user = await this.usersService.create({
      nombre: registerDto.nombre,
      email: registerDto.email,
      passwordHash,
      rol: UserRole.USUARIO,
      aceptaPolitica: true,
      fechaConsentimiento: new Date(),
    });

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      await this.monitoring.audit({
        accion: 'auth.login_fallido',
        actorEmail: loginDto.email,
        detalle: { motivo: 'usuario_inexistente' },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await this.monitoring.audit({
        actorId: user.id,
        actorEmail: user.email,
        accion: 'auth.login_fallido',
        detalle: { motivo: 'password_incorrecta' },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.activo) {
      await this.monitoring.audit({
        actorId: user.id,
        actorEmail: user.email,
        accion: 'auth.login_cuenta_suspendida',
      });
      throw new ForbiddenException(
        'Tu cuenta está suspendida. Comunícate con el administrador de Caudo.',
      );
    }

    await this.usersService.update(user.id, { ultimoAcceso: new Date() });
    if (user.rol === UserRole.ADMIN) {
      await this.monitoring.audit({
        actorId: user.id,
        actorEmail: user.email,
        accion: 'auth.login_admin',
      });
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
      access_token: token,
    };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
