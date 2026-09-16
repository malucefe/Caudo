import { Injectable, signal, computed } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = signal<Toast[]>([]);
  toastsList = computed(() => this.toasts());

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  show(type: Toast['type'], message: string, duration = 4000): void {
    const id = this.generateId();
    const toast: Toast = { id, type, message, duration };
    this.toasts.set([...this.toasts(), toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(message: string, duration = 4000): void {
    this.show('success', message, duration);
  }

  error(message: string, duration = 5000): void {
    this.show('error', message, duration);
  }

  warning(message: string, duration = 4000): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration = 4000): void {
    this.show('info', message, duration);
  }

  remove(id: string): void {
    this.toasts.set(this.toasts().filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
