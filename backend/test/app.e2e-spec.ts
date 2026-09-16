import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { ConfigModule } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Auth & Users (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-uuid-123',
    nombre: 'Juan Pérez',
    email: 'juan@email.com',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock UsersService
  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeAll(async () => {
    // JwtStrategy uses ConfigService.getOrThrow('JWT_SECRET')
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRATION = '24h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-jwt-secret',
          signOptions: { expiresIn: '24h' },
        }),
      ],
      controllers: [AuthController, UsersController],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const registerPayload = {
      nombre: 'Juan Pérez',
      email: 'juan@email.com',
      password: 'Password1!',
    };

    it('should create user and return 201 with token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUsersService.create.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerPayload)
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user).toMatchObject({
        id: 'user-uuid-123',
        nombre: 'Juan Pérez',
        email: 'juan@email.com',
      });
    });

    it('should return 409 for duplicate email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerPayload)
        .expect(409);

      expect(res.body.message).toContain('Ya existe una cuenta');
    });

    it('should return 400 for weak password', async () => {
      const weakPayload = {
        nombre: 'Juan Pérez',
        email: 'juan@email.com',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(weakPayload)
        .expect(400);
    });

    it('should return 400 for empty email', async () => {
      const badPayload = {
        nombre: 'Juan Pérez',
        email: '',
        password: 'Password1!',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(badPayload)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const loginPayload = {
      email: 'juan@email.com',
      password: 'Password1!',
    };

    it('should return 200 with token for valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginPayload)
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user).toMatchObject({
        id: 'user-uuid-123',
        nombre: 'Juan Pérez',
        email: 'juan@email.com',
      });
    });

    it('should return 401 for wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginPayload)
        .expect(401);

      expect(res.body.message).toContain('Credenciales inválidas');
    });

    it('should return 401 for non-existent user (same message to prevent enumeration)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginPayload)
        .expect(401);

      expect(res.body.message).toContain('Credenciales inválidas');
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/users/profile')
        .expect(401);
    });

    it('should return 200 with user data when authenticated', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const token = jwtService.sign({
        sub: mockUser.id,
        email: mockUser.email,
      });

      const res = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: mockUser.id,
        nombre: mockUser.nombre,
        email: mockUser.email,
      });
      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });
});
