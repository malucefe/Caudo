import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const user = {
    id: 'user-1',
    nombre: 'Juan',
    email: 'juan@email.com',
    passwordHash: 'old-hash',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();
    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  describe('update (HU-03)', () => {
    it('persists nombre and ingresoMensual and returns the refreshed user', async () => {
      repo.findOne.mockResolvedValue({ ...user, ingresoMensual: 3500000 });

      const result = await service.update('user-1', {
        nombre: 'Juan P.',
        ingresoMensual: 3500000,
      });

      expect(repo.update).toHaveBeenCalledWith('user-1', {
        nombre: 'Juan P.',
        ingresoMensual: 3500000,
      });
      expect(result?.ingresoMensual).toBe(3500000);
    });
  });

  describe('changePassword (HU-03)', () => {
    it('hashes and stores the new password when the current one is valid', async () => {
      repo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      await service.changePassword('user-1', 'Password1!', 'NuevaPass2@');

      expect(bcrypt.compare).toHaveBeenCalledWith('Password1!', 'old-hash');
      expect(bcrypt.hash).toHaveBeenCalledWith('NuevaPass2@', 12);
      expect(repo.update).toHaveBeenCalledWith('user-1', {
        passwordHash: 'new-hash',
      });
    });

    it('rejects with 400 when the current password is wrong', async () => {
      repo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', 'Mala1!xx', 'NuevaPass2@'),
      ).rejects.toThrow('La contraseña actual es incorrecta');
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('rejects when the new password equals the current one', async () => {
      repo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.changePassword('user-1', 'Password1!', 'Password1!'),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });
});
