import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main class="app-content">
      <div style="text-align: center; margin-top: 50px; font-family: sans-serif; color: white;">
        <h1>🚀 Caudo Frontend Base - Fase 1</h1>
        <p>Estructura inicial funcionando correctamente.</p>
        <p>Aún no hay rutas definidas (Módulo Auth, Fase 2).</p>
      </div>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .app-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-xl) var(--space-md);
    }
  `]
})
export class App { }
