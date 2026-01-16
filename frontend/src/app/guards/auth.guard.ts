import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminService } from '../services/admin.service';
import { catchError, map, of, tap } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const adminService = inject(AdminService);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar si el usuario está baneado (verificación asíncrona pero no bloqueante)
  // Si el endpoint no está disponible, permitir acceso
  adminService.getBanStatus().pipe(
    map((response: any) => {
      if (response && response.is_banned) {
        router.navigate(['/banned'], { 
          queryParams: { 
            reason: response.ban_reason || 'No reason provided',
            banned_at: response.banned_at || ''
          }
        });
      }
      return null; // No bloqueamos aquí, solo redirigimos si es necesario
    }),
    catchError(() => {
      // Si falla la verificación, no hacer nada (permitir acceso)
      return of(null);
    })
  ).subscribe();

  // Permitir acceso siempre (la verificación de ban redirige si es necesario)
  return true;
};
