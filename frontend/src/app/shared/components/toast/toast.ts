import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';
import { LucideAngularModule, CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toastsList(); track toast.id) {
        <div class="toast toast-{{toast.type}}" [@slideIn]>
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <lucide-angular [img]="CheckCircle" size="20"></lucide-angular> }
              @case ('error') { <lucide-angular [img]="XCircle" size="20"></lucide-angular> }
              @case ('warning') { <lucide-angular [img]="AlertTriangle" size="20"></lucide-angular> }
              @case ('info') { <lucide-angular [img]="Info" size="20"></lucide-angular> }
            }
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.remove(toast.id)">
            <lucide-angular [img]="X" size="16"></lucide-angular>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 420px;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      min-width: 300px;
    }
    .toast-success {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.3);
    }
    .toast-success .toast-icon { color: #10B981; }
    .toast-error {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
    }
    .toast-error .toast-icon { color: #ef4444; }
    .toast-warning {
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.3);
    }
    .toast-warning .toast-icon { color: #F59E0B; }
    .toast-info {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
    }
    .toast-info .toast-icon { color: #3b82f6; }
    .toast-icon { flex-shrink: 0; }
    .toast-message {
      flex: 1;
      color: rgba(255,255,255,0.9);
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .toast-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.4);
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      transition: color 0.2s;
    }
    .toast-close:hover { color: rgba(255,255,255,0.8); }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @media (max-width: 768px) {
      .toast-container { top: auto; bottom: 1rem; right: 1rem; left: 1rem; max-width: none; }
      .toast { min-width: auto; }
    }
    @media (max-width: 360px) {
      .toast-container { bottom: 0.75rem; right: 0.75rem; left: 0.75rem; gap: 0.5rem; }
      .toast { padding: 0.85rem 1rem; border-radius: 10px; }
      .toast-message { font-size: 0.85rem; }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  CheckCircle = CheckCircle;
  XCircle = XCircle;
  AlertTriangle = AlertTriangle;
  Info = Info;
  X = X;
}
