import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  const setup = (isAdmin: boolean, platform = 'browser') => {
    const navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAdmin: () => isAdmin } },
        { provide: Router, useValue: { navigate } },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });
    return { navigate, run: () => TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never)) };
  };

  it('permite al administrador', () => {
    const { run, navigate } = setup(true);
    expect(run()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redirige al dashboard a un usuario normal', () => {
    const { run, navigate } = setup(false);
    expect(run()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('en el servidor (SSR) no bloquea; el navegador decide al hidratar', () => {
    const { run } = setup(false, 'server');
    expect(run()).toBe(true);
  });
});
