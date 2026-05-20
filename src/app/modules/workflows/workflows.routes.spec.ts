import { describe, expect, it } from 'vitest';
import { permissionActivateGuard } from '../../core/guards/permission.guard';
import { APP_PERMISSIONS } from '../../core/security/access-control.service';
import { WORKFLOWS_ROUTES } from './workflows.routes';

describe('WORKFLOWS_ROUTES', () => {
  it('protects workflow definition route with manage permission', () => {
    const route = WORKFLOWS_ROUTES.find((entry) => entry.path === 'definitions');

    expect(route).toBeTruthy();
    expect(route?.canActivate).toContain(permissionActivateGuard);
    expect(route?.data?.['requiredAllPermissions']).toEqual([APP_PERMISSIONS.workflowsManage]);
  });

  it('protects workflow instance route with manage permission', () => {
    const route = WORKFLOWS_ROUTES.find((entry) => entry.path === 'instances');

    expect(route).toBeTruthy();
    expect(route?.canActivate).toContain(permissionActivateGuard);
    expect(route?.data?.['requiredAllPermissions']).toEqual([APP_PERMISSIONS.workflowsManage]);
  });
});

