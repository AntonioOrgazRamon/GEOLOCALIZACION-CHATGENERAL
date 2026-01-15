import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocationRequest, NearbyUsersResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  updateLocation(data: LocationRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/me/location`, data);
  }

  getNearbyUsers(): Observable<NearbyUsersResponse> {
    return this.http.get<NearbyUsersResponse>(`${this.apiUrl}/users/nearby`);
  }
}

