import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Wallet, Mail, Lock, User as UserIcon, ArrowRight, Sparkles } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { RegisterRequest } from '../../../core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="auth-container">
      <div class="auth-bg-orb auth-bg-orb-1"></div>
      <div class="auth-bg-orb auth-bg-orb-2"></div>
      <div class="auth-card animate-scale-in">
        <div class="auth-header">
          <div class="auth-logo">
            <lucide-angular [img]="Wallet" size="28"></lucide-angular>
          </div>
          <h1 class="auth-title">Crea tu cuenta</h1>
          <p class="auth-subtitle">Empieza a controlar tus finanzas hoy</p>
        </div>
        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label for="nombre">
              <lucide-angular [img]="UserIcon" size="14"></lucide-angular>
              Nombre
            </label>
            <input type="text" id="nombre" [(ngModel)]="data.nombre" name="nombre" required placeholder="Tu nombre" />
          </div>
          <div class="form-group">
            <label for="email">
              <lucide-angular [img]="Mail" size="14"></lucide-angular>
              Email
            </label>
            <input type="email" id="email" [(ngModel)]="data.email" name="email" required placeholder="tu@email.com" />
          </div>
          <div class="form-group">
            <label for="password">
              <lucide-angular [img]="Lock" size="14"></lucide-angular>
              Contraseña
            </label>
            <input type="password" id="password" [(ngModel)]="data.password" name="password" required minlength="6" placeholder="Mínimo 6 caracteres" />
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading || !registerForm.form.valid">
            @if (loading) {
              <span class="loading-spinner"></span>
            } @else {
              Crear cuenta
              <lucide-angular [img]="ArrowRight" size="18"></lucide-angular>
            }
          </button>
        </form>
        <div class="auth-divider">
          <lucide-angular [img]="Sparkles" size="14"></lucide-angular>
        </div>
        <p class="auth-link">
          ¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0e1a;
      padding: 1rem;
      position: relative;
      overflow: hidden;
    }
    .auth-bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
      animation: float 6s ease-in-out infinite;
    }
    .auth-bg-orb-1 {
      width: 400px;
      height: 400px;
      background: #3b82f6;
      top: -100px;
      left: -100px;
    }
    .auth-bg-orb-2 {
      width: 300px;
      height: 300px;
      background: #8b5cf6;
      bottom: -50px;
      right: -50px;
      animation-delay: -3s;
    }
    .auth-card {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 1;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-logo {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin: 0 auto 1.25rem;
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
    }
    .auth-title {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0 0 0.5rem;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.7));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .auth-subtitle {
      color: rgba(255,255,255,0.4);
      margin: 0;
      font-size: 0.95rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.6);
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    .form-group input {
      width: 100%;
      padding: 0.85rem 1rem;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      box-sizing: border-box;
      transition: all 0.2s;
    }
    .form-group input:focus {
      outline: none;
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .form-group input::placeholder {
      color: rgba(255,255,255,0.2);
    }
    .btn-primary {
      width: 100%;
      padding: 0.95rem;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35);
    }
    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .auth-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 1.5rem 0;
      color: rgba(255,255,255,0.15);
    }
    .auth-link {
      text-align: center;
      color: rgba(255,255,255,0.4);
      font-size: 0.9rem;
      margin: 0;
    }
    .auth-link a {
      color: #3b82f6;
      font-weight: 600;
      transition: color 0.2s;
    }
    .auth-link a:hover {
      color: #60a5fa;
    }
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 480px) {
      .auth-card { padding: 1.75rem 1.5rem; border-radius: 20px; }
      .auth-title { font-size: 1.4rem; }
      .auth-subtitle { font-size: 0.85rem; }
      .auth-logo { width: 46px; height: 46px; }
    }
    @media (max-width: 360px) {
      .auth-card { padding: 1.5rem 1.15rem; border-radius: 16px; }
      .auth-title { font-size: 1.25rem; }
      .form-group input { padding: 0.75rem 0.85rem; font-size: 0.9rem; }
      .btn-primary { padding: 0.85rem; font-size: 0.9rem; }
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  Wallet = Wallet;
  UserIcon = UserIcon;
  Mail = Mail;
  Lock = Lock;
  ArrowRight = ArrowRight;
  Sparkles = Sparkles;

  data: RegisterRequest = { nombre: '', email: '', password: '' };
  loading = false;

  onSubmit(): void {
    this.loading = true;
    this.authService.register(this.data).subscribe({
      next: () => {
        this.toast.success('¡Cuenta creada exitosamente!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Error al crear la cuenta');
      }
    });
  }
}
