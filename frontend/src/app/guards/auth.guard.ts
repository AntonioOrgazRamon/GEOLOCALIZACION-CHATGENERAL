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

  // Verificar ban status desde localStorage primero (más rápido)
  const user = authService.getUser();
  if (user && user.is_banned === true) {
    router.navigate(['/banned'], {
      queryParams: {
        reason: user.ban_reason || 'No reason provided',
        banned_at: user.banned_at || ''
      }
    });
    return false;
  }

  // Verificar ban status desde el servidor (verificación adicional)
  return adminService.getBanStatus().pipe(
    map((response: any) => {
      if (response && response.is_banned) {
        // Actualizar localStorage con el estado de ban
        if (user) {
          user.is_banned = true;
          user.ban_reason = response.ban_reason;
          user.banned_at = response.banned_at;
          localStorage.setItem('user', JSON.stringify(user));
        }
        router.navigate(['/banned'], {
          queryParams: {
            reason: response.ban_reason || 'No reason provided',
            banned_at: response.banned_at || ''
          }
        });
        return false;
      }
      return true;
    }),
    catchError(() => {
      // Si falla la verificación del servidor, permitir acceso si no está baneado en localStorage
      return of(!user?.is_banned);
    })
  );
};
