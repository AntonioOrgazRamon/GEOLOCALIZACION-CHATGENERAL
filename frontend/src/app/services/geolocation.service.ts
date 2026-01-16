import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  // Ubicación por defecto: Madrid, España (centro geográfico de España)
  private readonly DEFAULT_LOCATION: Coordinates = {
    latitude: 40.4168,
    longitude: -3.7038
  };

  getCurrentPosition(): Observable<Coordinates> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        // Si el navegador no soporta geolocalización, usar ubicación por defecto
        console.warn('Geolocation not supported, using default location');
        observer.next(this.DEFAULT_LOCATION);
        observer.complete();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          observer.complete();
        },
        (error) => {
          // En lugar de devolver error, usar ubicación por defecto
          console.warn('Geolocation error, using default location:', error);
          observer.next(this.DEFAULT_LOCATION);
          observer.complete();
        },
        {
          enableHighAccuracy: false,
          timeout: 10000, // Reducido a 10 segundos para ser más rápido
          maximumAge: 60000
        }
      );
    });
  }

  // Método para obtener ubicación por defecto directamente
  getDefaultLocation(): Coordinates {
    return this.DEFAULT_LOCATION;
  }
}

