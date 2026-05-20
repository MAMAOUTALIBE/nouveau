import { describe, expect, it } from 'vitest';
import { permissionActivateGuard } from '../../core/guards/permission.guard';
import { APP_PERMISSIONS } from '../../core/security/access-control.service';
import { RECRUITMENT_ROUTES } from './recruitment.routes';

describe('RECRUITMENT_ROUTES', () => {
  const securedPaths = ['candidatures', 'campagnes', 'commissions', 'integration'] as const;

  for (const path of securedPaths) {
    it(`protects "${path}" with recruitment manage permission`, () => {
      const route = RECRUITMENT_ROUTES.find((entry) => entry.path === path);

      expect(route).toBeTruthy();
      expect(route?.canActivate).toContain(permissionActivateGuard);
      expect(route?.data?.['requiredAllPermissions']).toEqual([APP_PERMISSIONS.recruitmentManage]);
    });
  }

  it('exposes the candidate portal with recruitment view permission', () => {
    const route = RECRUITMENT_ROUTES.find((entry) => entry.path === 'portail-candidat');

    expect(route).toBeTruthy();
    expect(route?.canActivate).toContain(permissionActivateGuard);
    expect(route?.data?.['requiredAnyPermissions']).toEqual([APP_PERMISSIONS.recruitmentView]);
  });
});
