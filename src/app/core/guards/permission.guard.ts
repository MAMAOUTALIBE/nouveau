import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../shared/services/auth.service';
import { AccessControlService } from '../security/access-control.service';

function checkRouteAccess(route: Route): boolean {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const accessControl = inject(AccessControlService);

  if (!authService.isAuthenticated()) {
    void router.navigate(['/auth/login']);
    return false;
  }

  if (accessControl.hasRouteAccess(route.data)) {
    return true;
  }

  toastr.warning("Acces refuse pour cette fonctionnalite.", 'Primature RH', {
    timeOut: 3000,
    positionClass: 'toast-top-right',
  });
  void router.navigate(['/acces-refuse']);
  return false;
}

export const permissionMatchGuard: CanMatchFn = (route: Route, _segments: UrlSegment[]) =>
  checkRouteAccess(route);

export const permissionActivateGuard: CanActivateFn = (route) =>
  checkRouteAccess(route.routeConfig ?? { data: route.data });
