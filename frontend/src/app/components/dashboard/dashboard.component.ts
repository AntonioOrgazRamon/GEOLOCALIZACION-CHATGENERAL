import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { GeolocationService } from '../../services/geolocation.service';
import { NearbyUser } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  user: any = null;
  nearbyUsers: NearbyUser[] = [];
  loading: boolean = false;
  error: string = '';
  locationSet: boolean = false;
  latitude: number | null = null;
  longitude: number | null = null;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private geolocationService: GeolocationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.user.latitude && this.user.longitude) {
      this.latitude = parseFloat(this.user.latitude);
      this.longitude = parseFloat(this.user.longitude);
      this.locationSet = true;
    }
  }

  getMyLocation(): void {
    this.loading = true;
    this.error = '';

    this.geolocationService.getCurrentPosition().subscribe({
      next: (coords) => {
        this.latitude = coords.latitude;
        this.longitude = coords.longitude;
        this.updateLocation(coords.latitude, coords.longitude);
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
      }
    });
  }

  updateLocation(lat: number, lng: number): void {
    this.apiService.updateLocation({ latitude: lat, longitude: lng }).subscribe({
      next: (response: any) => {
        this.locationSet = true;
        this.loading = false;
        this.error = '';
        // Update user in localStorage
        if (this.user) {
          this.user.latitude = lat.toString();
          this.user.longitude = lng.toString();
          localStorage.setItem('user', JSON.stringify(this.user));
        }
      },
      error: (err) => {
        console.error('Location update error:', err);
        this.error = err.error?.error || err.error?.message || 'Failed to update location. Please try again.';
        this.loading = false;
      }
    });
  }

  searchNearbyUsers(): void {
    if (!this.locationSet) {
      this.error = 'Please set your location first';
      return;
    }

    this.loading = true;
    this.error = '';

    this.apiService.getNearbyUsers().subscribe({
      next: (response) => {
        this.nearbyUsers = response.users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to fetch nearby users';
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if logout fails, clear local storage and redirect
        this.router.navigate(['/login']);
      }
    });
  }
}
