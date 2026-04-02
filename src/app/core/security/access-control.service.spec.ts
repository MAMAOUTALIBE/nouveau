import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_PERMISSIONS, APP_SCOPES, AccessControlService } from './access-control.service';

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
    expect(snapshot.scopes).toEqual([APP_SCOPES.team, APP_SCOPES.unit, APP_SCOPES.direction]);
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

  it('validates recruitment permissions by role', () => {
    const service = TestBed.inject(AccessControlService);

    service.applyAccess({ roles: ['hr_manager'], username: 'rh.manager' });
    expect(service.hasPermission(APP_PERMISSIONS.recruitmentView)).toBe(true);
    expect(service.hasPermission(APP_PERMISSIONS.recruitmentManage)).toBe(true);

    service.applyAccess({ roles: ['manager'], username: 'chef.direction' });
    expect(service.hasPermission(APP_PERMISSIONS.recruitmentView)).toBe(false);
    expect(service.hasPermission(APP_PERMISSIONS.recruitmentManage)).toBe(false);
  });

  it('evaluates route access with scope constraints', () => {
    const service = TestBed.inject(AccessControlService);

    service.applyAccess({ roles: ['manager'], username: 'chef.direction' });

    expect(
      service.hasRouteAccess({
        requiredAnyScopes: [APP_SCOPES.team],
      })
    ).toBe(true);

    expect(
      service.hasRouteAccess({
        requiredAnyScopes: [APP_SCOPES.global],
      })
    ).toBe(false);
  });

  it('restricts agent access to the self-service portal', () => {
    const service = TestBed.inject(AccessControlService);

    service.applyAccess({ roles: ['agent'], username: 'aminata.diallo@gouv.gn' });

    expect(service.hasPermission(APP_PERMISSIONS.portalAgent)).toBe(true);
    expect(service.hasPermission(APP_PERMISSIONS.dashboardView)).toBe(false);
    expect(service.hasPermission(APP_PERMISSIONS.leaveView)).toBe(false);
    expect(service.hasPermission(APP_PERMISSIONS.trainingView)).toBe(false);
    expect(service.hasPermission(APP_PERMISSIONS.documentsView)).toBe(false);
    expect(service.snapshot().scopes).toEqual([APP_SCOPES.self]);
  });

  it('re-hydrates access state from token + username when role storage is empty', () => {
    localStorage.setItem('rh_token', 'token-value');
    localStorage.setItem('rh_username', 'chef.direction');

    const service = TestBed.inject(AccessControlService);

    expect(service.snapshot().roles).toEqual(['manager']);
    expect(service.hasPermission(APP_PERMISSIONS.portalManager)).toBe(true);
    expect(service.snapshot().scopes).toEqual([APP_SCOPES.team, APP_SCOPES.unit, APP_SCOPES.direction]);
  });

  it('clears access and persists empty state', () => {
    const service = TestBed.inject(AccessControlService);
    service.applyAccess({ roles: ['super_admin'], username: 'admin' });

    service.clearAccess();

    expect(service.snapshot()).toEqual({ roles: [], permissions: [], scopes: [] });
    expect(localStorage.getItem('rh_roles')).toBe('[]');
    expect(localStorage.getItem('rh_permissions')).toBe('[]');
    expect(localStorage.getItem('rh_scopes')).toBe('[]');
  });
});
