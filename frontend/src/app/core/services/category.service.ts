import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private api: ApiService) {}

  getAll(tipo?: 'ingreso' | 'egreso'): Observable<Category[]> {
    const params = tipo ? { tipo } : undefined;
    return this.api.get<Category[]>('/categories', params);
  }
}
