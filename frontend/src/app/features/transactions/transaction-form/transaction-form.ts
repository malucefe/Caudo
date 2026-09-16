import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, ArrowLeftRight, Tag, DollarSign, Calendar, FileText, ArrowLeft, Check, Paperclip, X } from 'lucide-angular';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Category } from '../../../core/models/category.model';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="form-page">
      <div class="form-container animate-scale-in">
        <div class="form-header">
          <a routerLink="/transactions" class="btn-back">
            <lucide-angular [img]="ArrowLeft" size="18"></lucide-angular>
          </a>
          <h1>Nueva transacción</h1>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="tipo-selector">
            <button type="button" class="tipo-btn" [class.active]="form.controls.tipo.value === 'egreso'" [class.egreso]="form.controls.tipo.value === 'egreso'" (click)="onTipoChange('egreso')">
              <lucide-angular [img]="ArrowLeftRight" size="18"></lucide-angular>
              Egreso
            </button>
            <button type="button" class="tipo-btn" [class.active]="form.controls.tipo.value === 'ingreso'" [class.ingreso]="form.controls.tipo.value === 'ingreso'" (click)="onTipoChange('ingreso')">
              <lucide-angular [img]="ArrowLeftRight" size="18"></lucide-angular>
              Ingreso
            </button>
          </div>
          <div class="form-group">
            <label>
              <lucide-angular [img]="Tag" size="14"></lucide-angular>
              Categoría
            </label>
            <select formControlName="categoriaId" required>
              <option value="">Seleccionar categoría...</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.nombre }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>
              <lucide-angular [img]="DollarSign" size="14"></lucide-angular>
              Monto (COP)
            </label>
            <input type="number" formControlName="monto" required min="1" placeholder="0" />
          </div>
          <div class="form-group">
            <label>
              <lucide-angular [img]="Calendar" size="14"></lucide-angular>
              Fecha
            </label>
            <input type="date" formControlName="fecha" required />
          </div>
          <div class="form-group">
            <label>
              <lucide-angular [img]="FileText" size="14"></lucide-angular>
              Descripción <span class="optional">(opcional)</span>
            </label>
            <input type="text" formControlName="descripcion" placeholder="Ej: Almuerzo en restaurante" />
          </div>
          <div class="form-group">
            <label>
              <lucide-angular [img]="Paperclip" size="14"></lucide-angular>
              Comprobante <span class="optional">(JPG, PNG o PDF · máx 5MB)</span>
            </label>
            @if (!selectedFile) {
              <label class="file-input">
                <lucide-angular [img]="FileText" size="18"></lucide-angular>
                <span>Seleccionar archivo...</span>
                <input type="file" (change)="onFileSelected($event)" accept=".jpg,.jpeg,.png,.pdf" />
              </label>
            } @else {
              <div class="file-selected">
                <lucide-angular [img]="FileText" size="16"></lucide-angular>
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ selectedFile.size | number:'1.0-0' }} bytes</span>
                <button type="button" class="btn-remove-file" (click)="removeFile()" title="Quitar archivo">
                  <lucide-angular [img]="X" size="14"></lucide-angular>
                </button>
              </div>
            }
          </div>
          <button type="submit" class="btn-submit" [disabled]="loading || form.invalid">
            @if (loading) {
              <span class="loading-spinner"></span>
            } @else {
              <lucide-angular [img]="Check" size="18"></lucide-angular>
              Guardar transacción
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page {
      min-height: 100vh;
      background: #0a0e1a;
      padding: 2rem;
      color: white;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 3rem;
    }
    .form-container {
      width: 100%;
      max-width: 520px;
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 2rem;
    }
    .form-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .btn-back {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.6);
      transition: all 0.2s;
    }
    .btn-back:hover { background: rgba(255,255,255,0.1); color: white; }
    .form-header h1 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 700;
    }
    .tipo-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .tipo-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem;
      background: rgba(255,255,255,0.03);
      border: 2px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      color: rgba(255,255,255,0.5);
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tipo-btn:hover { border-color: rgba(255,255,255,0.15); }
    .tipo-btn.active.egreso {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
    .tipo-btn.active.ingreso {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.3);
      color: #10B981;
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
    .optional { color: rgba(255,255,255,0.3); font-weight: 400; }
    .form-group input, .form-group select {
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
    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: #10B981;
      background: rgba(16, 185, 129, 0.05);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
    .form-group input::placeholder { color: rgba(255,255,255,0.2); }
    .form-group select option { background: #0a0e1a; }
    .file-input {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.25rem;
      background: rgba(255,255,255,0.02);
      border: 2px dashed rgba(255,255,255,0.1);
      border-radius: 12px;
      color: rgba(255,255,255,0.4);
      font-size: 0.9rem;
      font-weight: 400;
      cursor: pointer;
      transition: all 0.2s;
    }
    .file-input:hover {
      border-color: rgba(16, 185, 129, 0.4);
      color: rgba(255,255,255,0.7);
      background: rgba(16, 185, 129, 0.03);
    }
    .file-input input { display: none; }
    .file-selected {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1rem;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 12px;
      color: rgba(255,255,255,0.7);
      font-size: 0.9rem;
    }
    .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: rgba(255,255,255,0.8);
    }
    .file-size { color: rgba(255,255,255,0.3); font-size: 0.8rem; white-space: nowrap; }
    .btn-remove-file {
      background: transparent;
      border: none;
      color: rgba(239, 68, 68, 0.7);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.3rem;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .btn-remove-file:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .btn-submit {
      width: 100%;
      padding: 0.95rem;
      background: linear-gradient(135deg, #10B981, #059669);
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
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
    }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) {
      .form-page { padding: 1rem; padding-top: 1.5rem; }
      .form-container { padding: 1.5rem; border-radius: 16px; }
      .tipo-selector { gap: 0.5rem; }
    }
    @media (max-width: 400px) {
      .form-page { padding: 0.75rem; padding-top: 1rem; }
      .form-container { padding: 1.25rem; border-radius: 14px; }
      .form-header h1 { font-size: 1.2rem; }
      .tipo-selector { gap: 0.4rem; }
      .tipo-btn { padding: 0.7rem 0.5rem; font-size: 0.85rem; }
      .btn-submit { padding: 0.85rem; }
      .file-size { display: none; }
    }
  `]
})
export class TransactionFormComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  ArrowLeft = ArrowLeft;
  ArrowLeftRight = ArrowLeftRight;
  Tag = Tag;
  DollarSign = DollarSign;
  Calendar = Calendar;
  FileText = FileText;
  Check = Check;
  Paperclip = Paperclip;
  X = X;

  categories = signal<Category[]>([]);
  loading = false;
  selectedFile: File | null = null;

  form = this.fb.nonNullable.group({
    tipo: ['egreso' as 'ingreso' | 'egreso', Validators.required],
    categoriaId: ['', Validators.required],
    monto: [null as number | null, [Validators.required, Validators.min(1)]],
    fecha: [new Date().toISOString().split('T')[0], Validators.required],
    descripcion: [''],
  });

  ngOnInit(): void {
    this.loadCategories('egreso');
  }

  loadCategories(tipo: 'ingreso' | 'egreso'): void {
    this.categoryService.getAll(tipo).subscribe({
      next: (cats) => this.categories.set(cats)
    });
  }

  onTipoChange(tipo: 'ingreso' | 'egreso'): void {
    this.form.controls.tipo.setValue(tipo);
    this.form.controls.categoriaId.setValue('');
    this.loadCategories(tipo);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.selectedFile = null;
      return;
    }

    const extensionValida = ALLOWED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );
    if (!extensionValida) {
      this.toast.error('Solo se permiten imágenes JPG/PNG o archivos PDF');
      input.value = '';
      this.selectedFile = null;
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.toast.error('El archivo supera el límite de 5MB');
      input.value = '';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { tipo, categoriaId, monto, fecha, descripcion } = this.form.getRawValue();
    const payload = {
      tipo,
      categoriaId,
      monto: Number(monto),
      fecha,
      descripcion,
    };

    const createTransaction = (archivoUrl?: string) => {
      this.transactionService
        .create({ ...payload, ...(archivoUrl ? { archivoUrl } : {}) })
        .subscribe({
          next: () => {
            this.toast.success('Transacción creada exitosamente');
            this.router.navigate(['/transactions']);
          },
          error: (err) => {
            this.loading = false;
            this.toast.error(err.error?.message || 'Error al crear la transacción');
          }
        });
    };

    if (this.selectedFile) {
      this.transactionService.uploadComprobante(this.selectedFile).subscribe({
        next: (res) => createTransaction(res.url),
        error: (err) => {
          this.loading = false;
          this.toast.error(err.error?.message || 'Error al subir el comprobante');
        }
      });
    } else {
      createTransaction();
    }
  }
}
