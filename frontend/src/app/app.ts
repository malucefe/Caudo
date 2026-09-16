import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast';
import { NavbarComponent } from './shared/components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="app-content">
      <router-outlet></router-outlet>
    </main>
    <app-toast></app-toast>
  `,
  styles: [`
    .app-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-xl) var(--space-md);
    }
  `]
})
export class App {}
