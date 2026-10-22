import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { MonitoringService } from '../monitoring/monitoring.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let monitoring: { audit: jest.Mock };

  const mockUser = {
    id: 'user-uuid-123',
    nombre: 'Juan Pérez',
    email: 'juan@email.com',
    passwordHash: 'hashed-password',
    rol: 'usuario',
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockToken = 'mock-jwt-token-xxx';

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(null),
    };
    monitoring = { audit: jest.fn().mockResolvedValue(undefined) };

    jwtService = {
      sign: jest.fn().mockReturnValue(mockToken),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: MonitoringService, useValue: monitoring },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      nombre: 'Juan Pérez',
      email: 'juan@email.com',
      password: 'Password1!',
      aceptaPolitica: true,
    };

    it('should create a user, hash password, and return token + user data', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (usersService.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('juan@email.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password1!', 12);
      expect(usersService.create).toHaveBeenCalledWith({
        nombre: 'Juan Pérez',
        email: 'juan@email.com',
        passwordHash: 'hashed-password',
        rol: 'usuario',
        aceptaPolitica: true,
        fechaConsentimiento: expect.any(Date),
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-uuid-123',
        email: 'juan@email.com',
      });
      expect(result).toEqual({
        user: {
          id: 'user-uuid-123',
          nombre: 'Juan Pérez',
          email: 'juan@email.com',
          rol: 'usuario',
        },
        access_token: mockToken,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Ya existe una cuenta con este email',
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'juan@email.com',
      password: 'Password1!',
    };

    it('should return token for valid credentials', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('juan@email.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'Password1!',
        'hashed-password',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-uuid-123',
        email: 'juan@email.com',
      });
      expect(result).toEqual({
        user: {
          id: 'user-uuid-123',
          nombre: 'Juan Pérez',
          email: 'juan@email.com',
          rol: 'usuario',
        },
        access_token: mockToken,
      });
    });

    it('should throw UnauthorizedException for non-existent user (same message as wrong password)', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong password (same message to prevent enumeration)', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
    });
  });

  describe('login (roles y suspensión)', () => {
    const loginDto = { email: 'juan@email.com', password: 'Password1!' };

    it('rechaza con 403 una cuenta suspendida y lo audita', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({ ...mockUser, activo: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
      expect(monitoring.audit).toHaveBeenCalledWith(expect.objectContaining({ accion: 'auth.login_cuenta_suspendida' }));
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('audita el login fallido', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(monitoring.audit).toHaveBeenCalledWith(expect.objectContaining({ accion: 'auth.login_fallido' }));
    });

    it('devuelve el rol admin, registra último acceso y audita el login del admin', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({ ...mockUser, rol: 'admin' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.login(loginDto);
      expect(result.user.rol).toBe('admin');
      expect(usersService.update).toHaveBeenCalledWith('user-uuid-123', { ultimoAcceso: expect.any(Date) });
      expect(monitoring.audit).toHaveBeenCalledWith(expect.objectContaining({ accion: 'auth.login_admin' }));
    });
  });
});
