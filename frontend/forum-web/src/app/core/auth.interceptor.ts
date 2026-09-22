import { HttpInterceptorFn } from '@angular/common/http';

import { AUTH_TOKEN_KEY } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const accessToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (!accessToken) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    }),
  );
};

