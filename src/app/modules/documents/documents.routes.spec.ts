import { describe, expect, it } from 'vitest';
import { permissionActivateGuard } from '../../core/guards/permission.guard';
import { APP_PERMISSIONS } from '../../core/security/access-control.service';
import { DOCUMENTS_ROUTES } from './documents.routes';

describe('DOCUMENTS_ROUTES', () => {
  it('protects the document library route with manage permission', () => {
    const route = DOCUMENTS_ROUTES.find((entry) => entry.path === 'bibliotheque');

    expect(route).toBeTruthy();
    expect(route?.canActivate).toContain(permissionActivateGuard);
    expect(route?.data?.['requiredAllPermissions']).toEqual([APP_PERMISSIONS.documentsManage]);
  });
});

