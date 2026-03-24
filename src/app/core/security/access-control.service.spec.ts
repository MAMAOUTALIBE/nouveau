import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_PERMISSIONS, AccessControlService } from './access-control.service';

describe('AccessControlService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('infers roles from username patterns', () => {
    const service = TestBed.inject(AccessControlService);

    expect(service.inferRolesFromUsername('admin.root')).toEqual(['super_admin']);
    expect(service.inferRolesFromUsername('chef.direction')).toEqual(['manager']);
    expect(service.inferRolesFromUsername('agent.rh')).toEqual(['agent']);
    expect(service.inferRolesFromUsername('utilisateur.standard')).toEqual(['hr_manager']);
  });

  it('applies role permissions and explicit permissions', () => {
    const service = TestBed.inject(AccessControlService);

    service.applyAccess({
      roles: ['manager'],
      permissions: ['custom:reports:download'],
      username: 'manager.rh',
    });

    const snapshot = service.snapshot();
    expect(snapshot.roles).toEqual(['manager']);
    expect(snapshot.permissions).toContain(APP_PERMISSIONS.dashboardView);
    expect(snapshot.permissions).toContain(APP_PERMISSIONS.portalManager);
    expect(snapshot.permissions).toContain('custom:reports:download');
    expect(localStorage.getItem('rh_roles')).toContain('manager');
  });

  it('evaluates route access with any/all permission constraints', () => {
    const service = TestBed.inject(AccessControlService);

    service.applyAccess({ roles: ['hr_manager'], username: 'rh.manager' });

    expect(
      service.hasRouteAccess({
        requiredAnyPermissions: [APP_PERMISSIONS.personnelView],
      })
    ).toBe(true);

    expect(
      service.hasRouteAccess({
        requiredAllPermissions: [APP_PERMISSIONS.personnelView, APP_PERMISSIONS.trainingView],
      })
    ).toBe(true);

    expect(
      service.hasRouteAccess({
        requiredAllPermissions: [APP_PERMISSIONS.personnelView, APP_PERMISSIONS.adminUsersManage],
      })
    ).toBe(false);
  });

  it('re-hydrates access state from token + username when role storage is empty', () => {
    localStorage.setItem('rh_token', 'token-value');
    localStorage.setItem('rh_username', 'chef.direction');

    const service = TestBed.inject(AccessControlService);

    expect(service.snapshot().roles).toEqual(['manager']);
    expect(service.hasPermission(APP_PERMISSIONS.portalManager)).toBe(true);
  });

  it('clears access and persists empty state', () => {
    const service = TestBed.inject(AccessControlService);
    service.applyAccess({ roles: ['super_admin'], username: 'admin' });

    service.clearAccess();

    expect(service.snapshot()).toEqual({ roles: [], permissions: [] });
    expect(localStorage.getItem('rh_roles')).toBe('[]');
    expect(localStorage.getItem('rh_permissions')).toBe('[]');
  });
});
