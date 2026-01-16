import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users`);
  }

  banUser(userId: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/${userId}/ban`, { reason });
  }

  unbanUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/${userId}/unban`, {});
  }

  getBanAppeals(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/ban-appeals`);
  }

  approveBanAppeal(appealId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/ban-appeals/${appealId}/approve`, {});
  }

  rejectBanAppeal(appealId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/ban-appeals/${appealId}/reject`, {});
  }

  getBanStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/ban-status`);
  }

  createBanAppeal(message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/ban-appeal`, { message });
  }
}
