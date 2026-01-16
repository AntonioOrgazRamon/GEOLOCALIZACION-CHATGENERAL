import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeolocationService } from '../../services/geolocation.service';

@Component({
  selector: 'app-location-permission',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-permission.component.html',
  styleUrl: './location-permission.component.css'
})
export class LocationPermissionComponent implements OnInit {
  @Output() permissionGranted = new EventEmitter<{latitude: number, longitude: number}>();
  @Output() permissionDenied = new EventEmitter<void>();
  @Input() autoRequest: boolean = true; // Por defecto solicita automáticamente
  
  loading: boolean = false;
  error: string = '';

  constructor(private geolocationService: GeolocationService) {}

  ngOnInit(): void {
    // Si autoRequest está activado, solicitar ubicación automáticamente
    if (this.autoRequest) {
      this.requestLocation();
    }
  }

  requestLocation(): void {
    this.loading = true;
    this.error = '';

    // Intentar obtener ubicación real, pero si falla, usar ubicación por defecto
    this.geolocationService.getCurrentPosition().subscribe({
      next: (coords) => {
        this.loading = false;
        this.permissionGranted.emit(coords);
      },
      error: (err) => {
        // Esto no debería pasar ahora, pero por si acaso, usar ubicación por defecto
        this.loading = false;
        const defaultCoords = this.geolocationService.getDefaultLocation();
        this.permissionGranted.emit(defaultCoords);
      }
    });
  }

  skip(): void {
    // En lugar de denegar, usar ubicación por defecto
    const defaultCoords = this.geolocationService.getDefaultLocation();
    this.permissionGranted.emit(defaultCoords);
  }
}
