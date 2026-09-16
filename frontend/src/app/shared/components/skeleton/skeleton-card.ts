import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-card">
      @if (showHeader) {
        <div class="skeleton-header">
          <app-skeleton [width]="'40%'" height="1.2rem" />
        </div>
      }
      <div class="skeleton-body">
        <app-skeleton height="2rem" />
        <app-skeleton [width]="'70%'" height="1rem" style="margin-top: 0.5rem" />
      </div>
      @if (showFooter) {
        <div class="skeleton-footer">
          <app-skeleton [width]="'50%'" height="0.8rem" />
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .skeleton-header { margin-bottom: 1rem; }
    .skeleton-body { display: flex; flex-direction: column; gap: 0.5rem; }
    .skeleton-footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); }
  `]
})
export class SkeletonCardComponent {
  @Input() showHeader = true;
  @Input() showFooter = false;
}
