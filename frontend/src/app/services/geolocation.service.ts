import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  getCurrentPosition(): Observable<Coordinates> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error('Geolocation is not supported by this browser');
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
          let errorMessage = 'Error getting location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación en la configuración del navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'La información de ubicación no está disponible. Verifica tu conexión GPS o WiFi.';
              break;
            case error.TIMEOUT:
              errorMessage = 'La solicitud de ubicación tardó demasiado. Intenta de nuevo o verifica tu conexión.';
              break;
            default:
              errorMessage = 'Error al obtener la ubicación. Por favor, intenta de nuevo.';
          }
          observer.error(errorMessage);
        },
        {
          enableHighAccuracy: false, // Cambiar a false para ser más rápido
          timeout: 30000, // Aumentar timeout a 30 segundos
          maximumAge: 60000 // Permitir usar ubicación cacheada de hasta 1 minuto
        }
      );
    });
  }
}

