import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LucideAngularModule, User, LogOut, Wallet, Menu, X, ArrowLeftRight } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <div class="brand-icon">
          <lucide-angular [img]="Wallet" size="20"></lucide-angular>
        </div>
        <a routerLink="/dashboard" (click)="mobileMenuOpen = false">Caudo</a>
      </div>

      <div class="navbar-links" [class.open]="mobileMenuOpen">
        <a routerLink="/transactions" routerLinkActive="active" class="nav-link" (click)="mobileMenuOpen = false">
          <lucide-angular [img]="ArrowLeftRight" size="18"></lucide-angular>
          <span>Transacciones</span>
        </a>
        <a routerLink="/profile" routerLinkActive="active" class="nav-link" (click)="mobileMenuOpen = false">
          <lucide-angular [img]="User" size="18"></lucide-angular>
          <span>Perfil</span>
        </a>
      </div>

      <div class="navbar-actions">
        <button class="btn-hamburger" (click)="mobileMenuOpen = !mobileMenuOpen" aria-label="Menú">
          <lucide-angular [img]="mobileMenuOpen ? X : Menu" size="20"></lucide-angular>
        </button>
        <div class="user-avatar">
          {{ getUserInitial() }}
        </div>
        <button class="btn-logout" (click)="logout()" title="Cerrar sesión">
          <lucide-angular [img]="LogOut" size="18"></lucide-angular>
        </button>
      </div>

      @if (mobileMenuOpen) {
        <div class="mobile-overlay" (click)="mobileMenuOpen = false"></div>
      }
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 1.5rem;
      background: rgba(10, 14, 26, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      position: sticky;
      top: 0;
      z-index: 100;
      animation: fadeInDown 0.4s ease-out;
      gap: 1rem;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-shrink: 0;
      z-index: 102;
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #10B981, #059669);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .navbar-brand a {
      font-size: 1.2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #10B981, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }
    .navbar-links {
      display: flex;
      gap: 0.25rem;
      background: rgba(255,255,255,0.03);
      padding: 0.3rem;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.85rem;
      border-radius: 7px;
      color: rgba(255,255,255,0.5);
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .nav-link:hover {
      color: rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.05);
    }
    .nav-link.active {
      color: #10B981;
      background: rgba(16, 185, 129, 0.12);
    }
    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
      z-index: 102;
    }
    .btn-hamburger {
      display: none;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.6);
      width: 36px;
      height: 36px;
      border-radius: 8px;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
    }
    .btn-hamburger:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      color: white;
      border: 2px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
    }
    .btn-logout {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.5);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
    }
    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
    .mobile-overlay {
      display: none;
    }

    @media (max-width: 768px) {
      .navbar { padding: 0.5rem 1rem; }
      .btn-hamburger { display: flex; }
      .navbar-links {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(10, 14, 26, 0.98);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        flex-direction: column;
        padding: 5rem 1.5rem 1.5rem;
        border-radius: 0 0 16px 16px;
        border: none;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        gap: 0.25rem;
        z-index: 101;
        transform: translateY(-100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }
      .navbar-links.open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }
      .nav-link {
        padding: 0.85rem 1rem;
        font-size: 1rem;
        border-radius: 10px;
      }
      .mobile-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10;
        animation: fadeIn 0.2s ease-out;
      }
      .btn-logout { display: none; }
    }

    @media (max-width: 400px) {
      .navbar-brand a { font-size: 1.05rem; }
      .brand-icon { width: 30px; height: 30px; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  User = User;
  LogOut = LogOut;
  Wallet = Wallet;
  Menu = Menu;
  X = X;
  ArrowLeftRight = ArrowLeftRight;

  mobileMenuOpen = false;

  getUserInitial(): string {
    return this.authService.getCurrentUser()?.nombre?.charAt(0)?.toUpperCase() || 'U';
  }

  logout(): void {
    this.mobileMenuOpen = false;
    this.authService.logout();
    this.toast.info('Sesión cerrada');
    this.router.navigate(['/auth/login']);
  }
}
