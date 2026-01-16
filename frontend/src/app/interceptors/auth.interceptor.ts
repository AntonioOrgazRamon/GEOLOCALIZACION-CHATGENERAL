import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Agregar token a todas las peticiones excepto login, register y refresh
  if (token && !req.url.includes('/login') && !req.url.includes('/register') && !req.url.includes('/refresh')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // Si el error es 403 y contiene información de ban, redirigir a /banned
      if (error.status === 403 && error.error?.ban_reason) {
        router.navigate(['/banned'], {
          queryParams: {
            reason: error.error.ban_reason || 'No reason provided',
            banned_at: error.error.banned_at || ''
          }
        });
        return throwError(() => error);
      }

      // Si el error es 401 y no es login/register, el token puede haber expirado
      if (error.status === 401 && !req.url.includes('/login') && !req.url.includes('/register')) {
        // No redirigir automáticamente, dejar que el guard lo maneje
      }
      
      return throwError(() => error);
    })
  );
};

