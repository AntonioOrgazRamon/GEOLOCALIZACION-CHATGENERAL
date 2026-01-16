import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocationPermissionComponent } from '../location-permission/location-permission.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LocationPermissionComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  error: string = '';
  success: string = '';
  loading: boolean = false;
  showLocationModal: boolean = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        // Después del registro, hacer login automáticamente
        this.authService.login({ email: this.email, password: this.password }).subscribe({
          next: () => {
            this.loading = false;
            
            // Verificar si el usuario está baneado (aunque es nuevo, por si acaso)
            const user = this.authService.getUser();
            if (user && (user.is_banned === true || user.is_banned === 1)) {
              this.router.navigate(['/banned'], {
                queryParams: {
                  reason: user.ban_reason || 'No reason provided',
                  banned_at: user.banned_at || ''
                }
              });
              return;
            }

            this.success = 'Registro exitoso! Obteniendo tu ubicación...';
            this.showLocationModal = true; // Esto activará automáticamente la solicitud de ubicación
          },
          error: (err) => {
            this.error = 'Registro exitoso, pero falló el login automático. Por favor, inicia sesión manualmente.';
            this.loading = false;
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          }
        });
      },
      error: (err) => {
        this.error = err.error?.error || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  onLocationGranted(coords: {latitude: number, longitude: number}): void {
    // Actualizar ubicación después de obtenerla
    this.apiService.updateLocation(coords).subscribe({
      next: () => {
        this.showLocationModal = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Location update error:', err);
        // Continuar al dashboard incluso si falla la actualización
        this.showLocationModal = false;
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onLocationDenied(): void {
    // Usuario denegó o omitió, continuar al dashboard
    this.showLocationModal = false;
    this.router.navigate(['/dashboard']);
  }
}
