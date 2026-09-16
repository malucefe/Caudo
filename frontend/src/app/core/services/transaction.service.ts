import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { Transaction, CreateTransaction, TransactionSummary, PaginatedResponse, MonthlyTrend } from '../models/transaction.model';

export interface UploadResponse {
  url: string;
  filename: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private api: ApiService, private http: HttpClient) {}

  uploadComprobante(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${environment.apiUrl}/files/upload`, formData);
  }

  getAll(params?: Record<string, string>): Observable<PaginatedResponse<Transaction>> {
    return this.api.get<PaginatedResponse<Transaction>>('/transactions', params);
  }

  getById(id: string): Observable<Transaction> {
    return this.api.get<Transaction>(`/transactions/${id}`);
  }

  create(data: CreateTransaction): Observable<Transaction> {
    return this.api.post<Transaction>('/transactions', data);
  }

  update(id: string, data: Partial<CreateTransaction>): Observable<Transaction> {
    return this.api.put<Transaction>(`/transactions/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/transactions/${id}`);
  }

  getSummary(mes?: number, anio?: number): Observable<TransactionSummary> {
    const params: Record<string, string> = {};
    if (mes) params['mes'] = String(mes);
    if (anio) params['anio'] = String(anio);
    return this.api.get<TransactionSummary>('/transactions/summary', params);
  }

  getTrend(months = 6): Observable<MonthlyTrend[]> {
    return this.api.get<MonthlyTrend[]>('/transactions/trend', { months: String(months) });
  }
}
