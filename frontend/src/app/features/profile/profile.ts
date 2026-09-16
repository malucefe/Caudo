import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User, Mail, Calendar, Check, Edit2 } from 'lucide-angular';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { User as UserModel } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, LoadingSpinnerComponent],
  template: `
    <div class="profile-page">
      <div class="profile-container animate-scale-in">
        <div class="profile-header">
          <div class="profile-avatar">
            {{ user.nombre.charAt(0).toUpperCase() || 'U' }}
          </div>
          <h1>Mi perfil</h1>
        </div>

        @if (loading()) {
          <div class="profile-loading">
            <app-loading-spinner></app-loading-spinner>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()" #form="ngForm">
            <div class="form-group">
              <label>
                <lucide-angular [img]="UserIcon" size="14"></lucide-angular>
                Nombre
              </label>
              <div class="input-wrapper">
                <input type="text" [(ngModel)]="user.nombre" name="nombre" required [disabled]="!editing" />
                <button type="button" class="btn-edit" (click)="editing = !editing" [disabled]="loadingSubmit">
                  <lucide-angular [img]="Edit2" size="16"></lucide-angular>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>
                <lucide-angular [img]="Mail" size="14"></lucide-angular>
                Email
              </label>
              <input type="email" [(ngModel)]="user.email" name="email" disabled class="input-disabled" />
              <span class="hint">El email no se puede cambiar</span>
            </div>

            @if (editing) {
              <button type="submit" class="btn-submit" [disabled]="!form.form.valid || loadingSubmit">
                @if (loadingSubmit) {
                  <span class="loading-spinner"></span>
                } @else {
                  <lucide-angular [img]="Check" size="18"></lucide-angular>
                  Guardar cambios
                }
              </button>
            }
          </form>

          <div class="account-info">
            <h3>Información de cuenta</h3>
            <div class="info-item">
              <lucide-angular [img]="Calendar" size="16"></lucide-angular>
              <span>Miembro desde {{ user.createdAt | date:'dd MMMM yyyy' }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: 100vh;
      background: #0a0e1a;
      padding: 2rem;
      color: white;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 3rem;
    }
    .profile-container {
      width: 100%;
      max-width: 520px;
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 2rem;
    }
    .profile-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .profile-avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 800;
      margin: 0 auto 1rem;
      border: 3px solid rgba(255,255,255,0.1);
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
    }
    .profile-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }
    .profile-loading { display: flex; justify-content: center; padding: 2rem; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label {
      display: flex; align-items: center; gap: 0.5rem;
      color: rgba(255,255,255,0.6); font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem;
    }
    .input-wrapper { display: flex; gap: 0.5rem; }
    .input-wrapper input { flex: 1; }
    .form-group input {
      width: 100%; padding: 0.85rem 1rem; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: white; font-size: 1rem; box-sizing: border-box;
      transition: all 0.2s;
    }
    .form-group input:focus:not(:disabled) { outline: none; border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    .form-group input:disabled { opacity: 0.5; cursor: not-allowed; }
    .input-disabled { cursor: not-allowed !important; }
    .hint { font-size: 0.75rem; color: rgba(255,255,255,0.3); margin-top: 0.25rem; display: block; }
    .btn-edit {
      width: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-edit:hover { background: rgba(255,255,255,0.1); color: white; }
    .btn-submit {
      width: 100%; padding: 0.95rem; background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border: none; border-radius: 12px; color: white; font-size: 1rem; font-weight: 600; cursor: pointer;
      transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.5rem;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading-spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .account-info { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.06); }
    .account-info h3 { font-size: 0.95rem; margin: 0 0 0.75rem; color: rgba(255,255,255,0.6); font-weight: 600; }
    .info-item { display: flex; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.4); font-size: 0.9rem; }
    @media (max-width: 768px) {
      .profile-page { padding: 1rem; padding-top: 1.5rem; }
      .profile-container { padding: 1.5rem; border-radius: 16px; }
    }
    @media (max-width: 400px) {
      .profile-page { padding: 0.75rem; padding-top: 1rem; }
      .profile-container { padding: 1.25rem; border-radius: 14px; }
      .profile-header h1 { font-size: 1.3rem; }
      .profile-avatar { width: 64px; height: 64px; font-size: 1.5rem; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  UserIcon = User;
  Mail = Mail;
  Calendar = Calendar;
  Check = Check;
  Edit2 = Edit2;

  loading = signal(true);
  user: UserModel = { id: '', nombre: '', email: '', createdAt: '' };
  editing = false;
  loadingSubmit = false;

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    this.loadingSubmit = true;
    this.authService.updateProfile({ nombre: this.user.nombre }).subscribe({
      next: (data) => {
        this.user = data;
        this.editing = false;
        this.loadingSubmit = false;
        this.toast.success('Perfil actualizado correctamente');
        localStorage.setItem('caudo_user', JSON.stringify(data));
      },
      error: () => {
        this.loadingSubmit = false;
        this.toast.error('Error al actualizar el perfil');
      }
    });
  }
}
