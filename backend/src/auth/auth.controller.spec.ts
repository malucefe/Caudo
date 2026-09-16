import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockToken = 'mock-jwt-token-xxx';

  const mockAuthResponse = {
    user: {
      id: 'user-uuid-123',
      nombre: 'Juan Pérez',
      email: 'juan@email.com',
    },
    access_token: mockToken,
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      nombre: 'Juan Pérez',
      email: 'juan@email.com',
      password: 'Password1!',
    };

    it('should call authService.register with DTO and return result', async () => {
      (authService.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'juan@email.com',
      password: 'Password1!',
    };

    it('should call authService.login with DTO and return result', async () => {
      (authService.login as jest.Mock).mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAuthResponse);
    });
  });
});
