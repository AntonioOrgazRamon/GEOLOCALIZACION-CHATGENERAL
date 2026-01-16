import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { GeolocationService } from '../../services/geolocation.service';
import { NearbyUser } from '../../models/user.model';
import { ChatComponent } from '../chat/chat.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChatComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  nearbyUsers: NearbyUser[] = [];
  loading: boolean = false;
  loadingLocation: boolean = false;
  loadingUsers: boolean = false;
  error: string = '';
  locationSet: boolean = false;
  latitude: number | null = null;
  longitude: number | null = null;
  countdown: number = 10; // Contador regresivo
  private searchInterval?: Subscription;
  private countdownInterval?: Subscription;
  private readonly SEARCH_INTERVAL_MS = 10000; // 10 segundos

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

    // Verificar si ya tiene ubicación guardada
    if (this.user.latitude && this.user.longitude) {
      const lat = parseFloat(this.user.latitude);
      const lng = parseFloat(this.user.longitude);
      // Validar que las coordenadas sean válidas
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        this.latitude = lat;
        this.longitude = lng;
        this.locationSet = true;
        // Si ya tiene ubicación válida, buscar usuarios inmediatamente
        this.searchNearbyUsers();
        // Y configurar búsqueda periódica
        this.startPeriodicSearch();
      } else {
        // Si las coordenadas no son válidas, obtener ubicación automáticamente
        this.getMyLocationAutomatically();
      }
    } else {
      // Si no tiene ubicación, obtenerla automáticamente
      this.getMyLocationAutomatically();
    }
  }

  ngOnDestroy(): void {
    // Limpiar los intervalos cuando el componente se destruya
    if (this.searchInterval) {
      this.searchInterval.unsubscribe();
    }
    if (this.countdownInterval) {
      this.countdownInterval.unsubscribe();
    }
  }

  getMyLocationAutomatically(): void {
    this.loadingLocation = true;
    this.error = '';

    this.geolocationService.getCurrentPosition().subscribe({
      next: (coords) => {
        this.latitude = coords.latitude;
        this.longitude = coords.longitude;
        this.updateLocation(coords.latitude, coords.longitude);
      },
      error: (err) => {
        // Si falla, usar ubicación por defecto
        console.warn('Using default location due to error:', err);
        const defaultCoords = this.geolocationService.getDefaultLocation();
        this.latitude = defaultCoords.latitude;
        this.longitude = defaultCoords.longitude;
        this.updateLocation(defaultCoords.latitude, defaultCoords.longitude);
      }
    });
  }

  updateLocation(lat: number, lng: number): void {
    this.apiService.updateLocation({ latitude: lat, longitude: lng }).subscribe({
      next: (response: any) => {
        this.locationSet = true;
        this.loadingLocation = false;
        this.error = '';
        // Update user in localStorage
        if (this.user) {
          this.user.latitude = lat.toString();
          this.user.longitude = lng.toString();
          localStorage.setItem('user', JSON.stringify(this.user));
        }
        // Esperar un momento para asegurar que el backend haya actualizado la ubicación
        // antes de buscar usuarios cercanos
        setTimeout(() => {
          this.searchNearbyUsers();
          // Iniciar búsqueda periódica
          this.startPeriodicSearch();
        }, 500);
      },
      error: (err) => {
        console.error('Location update error:', err);
        this.error = err.error?.error || err.error?.message || 'Failed to update location. Please try again.';
        this.loadingLocation = false;
      }
    });
  }

  searchNearbyUsers(): void {
    // Validar que la ubicación esté establecida antes de buscar
    if (!this.locationSet || this.latitude === null || this.longitude === null) {
      this.loadingUsers = false;
      this.resetCountdown();
      return;
    }

    // Validar que las coordenadas sean números válidos
    if (isNaN(this.latitude) || isNaN(this.longitude)) {
      this.loadingUsers = false;
      this.resetCountdown();
      return;
    }

    // Validar rango de coordenadas
    if (this.latitude < -90 || this.latitude > 90 || this.longitude < -180 || this.longitude > 180) {
      this.loadingUsers = false;
      this.resetCountdown();
      return;
    }

    this.loadingUsers = true;

    this.apiService.getNearbyUsers().subscribe({
      next: (response) => {
        this.nearbyUsers = response.users || [];
        this.loadingUsers = false;
        this.error = '';
        // Reiniciar el contador cuando se complete la búsqueda
        this.resetCountdown();
      },
      error: (err) => {
        // Solo mostrar error si no es por falta de ubicación (para no llenar la consola)
        if (err.status !== 400 || !err.error?.error?.includes('location is not set')) {
          this.error = err.error?.error || 'Error al buscar usuarios';
        } else {
          // Si es error 400 por ubicación, intentar actualizar la ubicación del usuario
          if (this.latitude && this.longitude && !this.loadingLocation) {
            // Solo actualizar si no estamos ya actualizando
            this.updateLocation(this.latitude, this.longitude);
          }
        }
        this.loadingUsers = false;
        this.resetCountdown();
      }
    });
  }

  startPeriodicSearch(): void {
    // Limpiar intervalos anteriores si existen
    if (this.searchInterval) {
      this.searchInterval.unsubscribe();
    }
    if (this.countdownInterval) {
      this.countdownInterval.unsubscribe();
    }

    // Solo iniciar búsqueda periódica si hay ubicación válida
    if (!this.locationSet || !this.latitude || !this.longitude) {
      return;
    }

    // Iniciar contador regresivo
    this.startCountdown();

    // Buscar usuarios cada X segundos
    this.searchInterval = interval(this.SEARCH_INTERVAL_MS).subscribe(() => {
      // Validar nuevamente antes de cada búsqueda
      if (this.locationSet && this.latitude && this.longitude && 
          !isNaN(this.latitude) && !isNaN(this.longitude)) {
        this.searchNearbyUsers();
      }
    });
  }

  startCountdown(): void {
    // Reiniciar contador
    this.countdown = this.SEARCH_INTERVAL_MS / 1000; // Convertir a segundos

    // Actualizar contador cada segundo
    this.countdownInterval = interval(1000).subscribe(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        // Cuando llegue a 0, reiniciar (la búsqueda se hará automáticamente por el otro intervalo)
        this.countdown = this.SEARCH_INTERVAL_MS / 1000;
      }
    });
  }

  resetCountdown(): void {
    // Reiniciar el contador a 10 segundos
    this.countdown = this.SEARCH_INTERVAL_MS / 1000;
  }

  logout(): void {
    // El logout manual siempre debe enviar el mensaje de "se ha salido"
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
