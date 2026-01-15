import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
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
      // Si el error es 401 y no es login/register, el token puede haber expirado
      if (error.status === 401 && !req.url.includes('/login') && !req.url.includes('/register')) {
        console.warn('Token expired or invalid, user may need to login again');
      }
      return throwError(() => error);
    })
  );
};

