import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocationPermissionComponent } from '../location-permission/location-permission.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LocationPermissionComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;
  showLocationModal: boolean = false;
  pendingLogin: boolean = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.loading = false;
        
        // Obtener usuario actualizado después del login
        const user = this.authService.getUser();
        
        // Verificar si el usuario está baneado ANTES de hacer cualquier otra cosa
        if (user && (user.is_banned === true || user.is_banned === 1)) {
          this.router.navigate(['/banned'], {
            queryParams: {
              reason: user.ban_reason || 'No reason provided',
              banned_at: user.banned_at || ''
            }
          });
          return;
        }

        // Verificar si el usuario ya tiene ubicación guardada
        if (user && user.latitude && user.longitude) {
          // Ya tiene ubicación, ir directo al dashboard
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 100);
        } else {
          // No tiene ubicación, obtenerla automáticamente
          this.showLocationModal = true;
          this.pendingLogin = true;
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.error = err.error?.error || err.error?.message || err.message || 'Login failed. Please check your credentials.';
        this.loading = false;
      }
    });
  }

  onLocationGranted(coords: {latitude: number, longitude: number}): void {
    // Update location after login
    this.apiService.updateLocation(coords).subscribe({
      next: () => {
        this.showLocationModal = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Location update error:', err);
        // Continue to dashboard even if location update fails
        this.showLocationModal = false;
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onLocationDenied(): void {
    // User denied or skipped, continue to dashboard
    this.showLocationModal = false;
    this.router.navigate(['/dashboard']);
  }
}
