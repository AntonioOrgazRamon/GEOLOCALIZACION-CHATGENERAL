import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        if (response.token && response.refresh_token) {
          this.setTokens(response.token, response.refresh_token);
          // Guardar timestamp de login para filtrar mensajes
          const loginTimestamp = new Date().toISOString();
          localStorage.setItem('login_timestamp', loginTimestamp);
          // Debug: verificar respuesta del servidor
          console.log('Login response user:', response.user);
          this.setUser(response.user);
          // Debug: verificar usuario guardado
          console.log('User saved to localStorage:', this.getUser());
        }
      })
    );
  }

  logout(): Observable<any> {
    // Eliminar usuario de la BD usando DELETE
    return this.http.delete(`${this.apiUrl}/logout`).pipe(
      tap(() => this.clearStorage()),
      // Si falla, limpiar storage de todas formas
      catchError((err) => {
        this.clearStorage();
        return of({});
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken }).pipe(
      tap(response => {
        if (response.token && response.refresh_token) {
          this.setTokens(response.token, response.refresh_token);
          this.setUser(response.user);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.is_admin === true || user?.roles?.includes('ROLE_ADMIN') === true;
  }

  private setTokens(token: string, refreshToken: string): void {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  private clearStorage(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('login_timestamp');
  }
}

