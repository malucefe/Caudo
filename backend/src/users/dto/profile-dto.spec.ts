import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';
import { ChangePasswordDto } from './change-password.dto';
import { RegisterDto } from '../../auth/dto/register.dto';

const errorsOf = async <T extends object>(cls: new () => T, plain: object) =>
  validate(plainToInstance(cls, plain), { whitelist: true });

describe('Validación de DTO de perfil y registro', () => {
  describe('UpdateProfileDto', () => {
    it('accepts a valid ingresoMensual', async () => {
      expect(await errorsOf(UpdateProfileDto, { ingresoMensual: 2500000 })).toHaveLength(0);
    });

    it('rejects a negative ingresoMensual', async () => {
      expect(await errorsOf(UpdateProfileDto, { ingresoMensual: -1 })).toHaveLength(1);
    });

    it('rejects a non numeric ingresoMensual', async () => {
      expect(await errorsOf(UpdateProfileDto, { ingresoMensual: 'abc' })).toHaveLength(1);
    });
  });

  describe('ChangePasswordDto', () => {
    it('accepts a strong password', async () => {
      expect(
        await errorsOf(ChangePasswordDto, { passwordActual: 'x', passwordNueva: 'NuevaPass2@' }),
      ).toHaveLength(0);
    });

    it('rejects a weak new password', async () => {
      expect(
        await errorsOf(ChangePasswordDto, { passwordActual: 'x', passwordNueva: 'debil' }),
      ).toHaveLength(1);
    });
  });

  describe('RegisterDto (consentimiento, HU-01)', () => {
    const base = { nombre: 'Ana', email: 'ana@email.com', password: 'Password1!' };

    it('accepts aceptaPolitica = true', async () => {
      expect(await errorsOf(RegisterDto, { ...base, aceptaPolitica: true })).toHaveLength(0);
    });

    it('rejects aceptaPolitica = false', async () => {
      expect(await errorsOf(RegisterDto, { ...base, aceptaPolitica: false })).toHaveLength(1);
    });

    it('rejects when aceptaPolitica is missing', async () => {
      expect((await errorsOf(RegisterDto, base)).length).toBeGreaterThan(0);
    });
  });
});
