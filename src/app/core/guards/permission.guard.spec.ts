import { TestBed } from '@angular/core/testing';
import { Route, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../shared/services/auth.service';
import { AccessControlService, APP_PERMISSIONS } from '../security/access-control.service';
import { permissionMatchGuard } from './permission.guard';

describe('permissionMatchGuard', () => {
  const authMock = {
    isAuthenticated: vi.fn<() => boolean>(),
  };

  const routerMock = {
    navigate: vi.fn<(commands: unknown[]) => Promise<boolean>>(),
  };

  const toastrMock = {
    warning: vi.fn<(message: string, title?: string, options?: unknown) => void>(),
  };

  const accessControlMock = {
    hasRouteAccess: vi.fn<(data: unknown) => boolean>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    routerMock.navigate.mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
        { provide: ToastrService, useValue: toastrMock },
        { provide: AccessControlService, useValue: accessControlMock },
      ],
    });
  });

  it('redirects to login when user is not authenticated', () => {
    authMock.isAuthenticated.mockReturnValue(false);
    const route: Route = { path: 'personnel' };

    const allowed = TestBed.runInInjectionContext(() => permissionMatchGuard(route, []));

    expect(allowed).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(toastrMock.warning).not.toHaveBeenCalled();
  });

  it('allows route when authenticated and permission check passes', () => {
    authMock.isAuthenticated.mockReturnValue(true);
    accessControlMock.hasRouteAccess.mockReturnValue(true);

    const route: Route = {
      path: 'workflows',
      data: { requiredAnyPermissions: [APP_PERMISSIONS.workflowsView] },
    };

    const allowed = TestBed.runInInjectionContext(() => permissionMatchGuard(route, []));

    expect(allowed).toBe(true);
    expect(accessControlMock.hasRouteAccess).toHaveBeenCalledWith(route.data);
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(toastrMock.warning).not.toHaveBeenCalled();
  });

  it('blocks route and redirects to access-denied when permission check fails', () => {
    authMock.isAuthenticated.mockReturnValue(true);
    accessControlMock.hasRouteAccess.mockReturnValue(false);
    const route: Route = {
      path: 'administration',
      data: { requiredAnyPermissions: [APP_PERMISSIONS.adminView] },
    };

    const allowed = TestBed.runInInjectionContext(() => permissionMatchGuard(route, []));

    expect(allowed).toBe(false);
    expect(toastrMock.warning).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/acces-refuse']);
  });
});
