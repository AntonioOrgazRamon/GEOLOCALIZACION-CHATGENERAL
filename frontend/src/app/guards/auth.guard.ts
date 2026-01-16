import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminService } from '../services/admin.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const adminService = inject(AdminService);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar si el usuario está baneado
  return adminService.getBanStatus().pipe(
    map((response: any) => {
      if (response.is_banned) {
        router.navigate(['/banned'], { 
          queryParams: { 
            reason: response.ban_reason,
            banned_at: response.banned_at
          }
        });
        return false;
      }
      return true;
    }),
    catchError(() => {
      // Si falla la verificación, permitir acceso (por si el endpoint no está disponible)
      return of(true);
    })
  );
};
