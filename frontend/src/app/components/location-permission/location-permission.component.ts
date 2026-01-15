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

    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      this.loading = false;
      this.error = 'Tu navegador no soporta geolocalización. Por favor, usa un navegador más reciente.';
      return;
    }

    this.geolocationService.getCurrentPosition().subscribe({
      next: (coords) => {
        this.loading = false;
        this.permissionGranted.emit(coords);
      },
      error: (err) => {
        this.loading = false;
        this.error = err;
        // Si el usuario denegó el permiso, no hacer nada automáticamente
        // El usuario puede intentar de nuevo o omitir
      }
    });
  }

  skip(): void {
    this.permissionDenied.emit();
  }
}
