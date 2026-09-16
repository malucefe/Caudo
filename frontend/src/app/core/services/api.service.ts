import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    const httpParams = params ? new HttpParams({ fromObject: params }) : new HttpParams();
    return this.http.get<T>(`${this.API_URL}${path}`, { params: httpParams }).pipe(timeout(15000));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.API_URL}${path}`, body).pipe(timeout(15000));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.API_URL}${path}`, body).pipe(timeout(15000));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.API_URL}${path}`, body).pipe(timeout(15000));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.API_URL}${path}`).pipe(timeout(15000));
  }
}
