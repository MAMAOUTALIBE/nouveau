import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppRole = 'super_admin' | 'hr_manager' | 'manager' | 'agent';

export const APP_PERMISSIONS = {
  dashboardView: 'dashboard:view',
  dashboardManage: 'dashboard:manage',
  personnelView: 'personnel:view',
  personnelManage: 'personnel:manage',
  organizationView: 'organization:view',
  organizationManage: 'organization:manage',
  recruitmentView: 'recruitment:view',
  recruitmentManage: 'recruitment:manage',
  careersView: 'careers:view',
  careersManage: 'careers:manage',
  leaveView: 'leave:view',
  leaveManage: 'leave:manage',
  leaveApproveL1: 'leave:approve:l1',
  leaveApproveL2: 'leave:approve:l2',
  performanceView: 'performance:view',
  performanceManage: 'performance:manage',
  trainingView: 'training:view',
  trainingManage: 'training:manage',
  disciplineView: 'discipline:view',
  disciplineManage: 'discipline:manage',
  documentsView: 'documents:view',
  documentsManage: 'documents:manage',
  documentsViewSensitive: 'documents:view:sensitive',
  workflowsView: 'workflows:view',
  workflowsManage: 'workflows:manage',
  reportsView: 'reports:view',
  reportsExport: 'reports:export',
  portalAgent: 'portal:agent',
  portalManager: 'portal:manager',
  adminView: 'admin:view',
  adminUsersManage: 'admin:users:manage',
  adminRolesManage: 'admin:roles:manage',
  adminAuditView: 'admin:audit:view',
} as const;

export const APP_SCOPES = {
  self: 'SELF',
  team: 'TEAM',
  unit: 'UNIT',
  direction: 'DIRECTION',
  global: 'GLOBAL',
} as const;

export type AppPermission = (typeof APP_PERMISSIONS)[keyof typeof APP_PERMISSIONS] | '*';
export type AppScope = (typeof APP_SCOPES)[keyof typeof APP_SCOPES];

export interface AccessState {
  roles: AppRole[];
  permissions: AppPermission[];
  scopes: AppScope[];
}

const ROLE_ALIASES: Record<string, AppRole> = {
  super_admin: 'super_admin',
  superadmin: 'super_admin',
  admin: 'super_admin',
  hr_manager: 'hr_manager',
  rh_manager: 'hr_manager',
  manager_rh: 'hr_manager',
  hr: 'hr_manager',
  manager: 'manager',
  line_manager: 'manager',
  agent: 'agent',
  employee: 'agent',
  staff: 'agent',
};

const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  super_admin: ['*'],
  hr_manager: [
    APP_PERMISSIONS.dashboardView,
    APP_PERMISSIONS.dashboardManage,
    APP_PERMISSIONS.personnelView,
    APP_PERMISSIONS.personnelManage,
    APP_PERMISSIONS.organizationView,
    APP_PERMISSIONS.organizationManage,
    APP_PERMISSIONS.recruitmentView,
    APP_PERMISSIONS.recruitmentManage,
    APP_PERMISSIONS.careersView,
    APP_PERMISSIONS.careersManage,
    APP_PERMISSIONS.leaveView,
    APP_PERMISSIONS.leaveManage,
    APP_PERMISSIONS.leaveApproveL1,
    APP_PERMISSIONS.leaveApproveL2,
    APP_PERMISSIONS.performanceView,
    APP_PERMISSIONS.performanceManage,
    APP_PERMISSIONS.trainingView,
    APP_PERMISSIONS.trainingManage,
    APP_PERMISSIONS.disciplineView,
    APP_PERMISSIONS.disciplineManage,
    APP_PERMISSIONS.documentsView,
    APP_PERMISSIONS.documentsManage,
    APP_PERMISSIONS.documentsViewSensitive,
    APP_PERMISSIONS.workflowsView,
    APP_PERMISSIONS.workflowsManage,
    APP_PERMISSIONS.reportsView,
    APP_PERMISSIONS.reportsExport,
    APP_PERMISSIONS.portalAgent,
    APP_PERMISSIONS.portalManager,
  ],
  manager: [
    APP_PERMISSIONS.dashboardView,
    APP_PERMISSIONS.leaveView,
    APP_PERMISSIONS.leaveManage,
    APP_PERMISSIONS.leaveApproveL1,
    APP_PERMISSIONS.performanceView,
    APP_PERMISSIONS.performanceManage,
    APP_PERMISSIONS.trainingView,
    APP_PERMISSIONS.trainingManage,
    APP_PERMISSIONS.documentsView,
    APP_PERMISSIONS.documentsManage,
    APP_PERMISSIONS.reportsView,
    APP_PERMISSIONS.reportsExport,
    APP_PERMISSIONS.portalManager,
  ],
  agent: [
    APP_PERMISSIONS.portalAgent,
  ],
};

const ROLE_SCOPES: Record<AppRole, AppScope[]> = {
  super_admin: [APP_SCOPES.global],
  hr_manager: [APP_SCOPES.global],
  manager: [APP_SCOPES.team, APP_SCOPES.unit, APP_SCOPES.direction],
  agent: [APP_SCOPES.self],
};

const SCOPE_ALIASES: Record<string, AppScope> = {
  self: APP_SCOPES.self,
  own: APP_SCOPES.self,
  team: APP_SCOPES.team,
  unit: APP_SCOPES.unit,
  direction: APP_SCOPES.direction,
  global: APP_SCOPES.global,
};

type PermissionAwareData = {
  requiredAnyPermissions?: string[];
  requiredAllPermissions?: string[];
  requiredRoles?: string[];
  requiredAnyScopes?: string[];
  requiredAllScopes?: string[];
};

@Injectable({ providedIn: 'root' })
export class AccessControlService {
  private readonly rolesStorageKey = 'rh_roles';
  private readonly permissionsStorageKey = 'rh_permissions';
  private readonly scopesStorageKey = 'rh_scopes';
  private readonly stateSubject = new BehaviorSubject<AccessState>(this.readStateFromStorage());
  readonly state$ = this.stateSubject.asObservable();

  constructor() {
    this.persistState(this.stateSubject.value);
  }

  snapshot(): AccessState {
    return this.stateSubject.value;
  }

  inferRolesFromUsername(username: string): AppRole[] {
    const normalized = (username || '').toLowerCase();
    if (normalized.includes('admin')) {
      return ['super_admin'];
    }
    if (normalized.includes('manager') || normalized.includes('chef')) {
      return ['manager'];
    }
    if (normalized.includes('agent') || normalized.includes('employee')) {
      return ['agent'];
    }
    return ['hr_manager'];
  }

  applyAccess(access: { roles?: string[]; permissions?: string[]; scopes?: string[]; username?: string }): void {
    const normalizedRoles = this.normalizeRoles(access.roles);
    const resolvedRoles = normalizedRoles.length
      ? normalizedRoles
      : this.inferRolesFromUsername(access.username || '');
    const resolvedPermissions = this.resolvePermissions(resolvedRoles, access.permissions || []);
    const resolvedScopes = this.resolveScopes(resolvedRoles, access.scopes || []);
    const state: AccessState = {
      roles: resolvedRoles,
      permissions: resolvedPermissions,
      scopes: resolvedScopes,
    };
    this.persistState(state);
    this.stateSubject.next(state);
  }

  clearAccess(): void {
    const emptyState: AccessState = { roles: [], permissions: [], scopes: [] };
    this.persistState(emptyState);
    this.stateSubject.next(emptyState);
  }

  hasRole(role: string): boolean {
    return this.stateSubject.value.roles.includes(role as AppRole);
  }

  hasPermission(permission: string): boolean {
    const permissions = this.stateSubject.value.permissions;
    return permissions.includes('*') || permissions.includes(permission as AppPermission);
  }

  hasAnyPermission(permissions: string[] = []): boolean {
    if (!permissions.length) return true;
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[] = []): boolean {
    if (!permissions.length) return true;
    return permissions.every((permission) => this.hasPermission(permission));
  }

  hasScope(scope: string): boolean {
    const normalized = this.normalizeScopes([scope]);
    if (!normalized.length) {
      return false;
    }

    const scopes = this.stateSubject.value.scopes;
    return scopes.includes(APP_SCOPES.global) || scopes.includes(normalized[0]);
  }

  hasAnyScope(scopes: string[] = []): boolean {
    if (!scopes.length) return true;
    return scopes.some((scope) => this.hasScope(scope));
  }

  hasAllScopes(scopes: string[] = []): boolean {
    if (!scopes.length) return true;
    const currentScopes = this.stateSubject.value.scopes;
    if (currentScopes.includes(APP_SCOPES.global)) {
      return true;
    }

    const normalizedRequired = this.normalizeScopes(scopes);
    return normalizedRequired.every((scope) => currentScopes.includes(scope));
  }

  hasAnyRole(roles: string[] = []): boolean {
    if (!roles.length) return true;
    return roles.some((role) => this.hasRole(role));
  }

  hasRouteAccess(data: unknown): boolean {
    const parsed = this.parsePermissionData(data);
    return (
      this.hasAnyRole(parsed.requiredRoles) &&
      this.hasAnyPermission(parsed.requiredAnyPermissions) &&
      this.hasAllPermissions(parsed.requiredAllPermissions) &&
      this.hasAnyScope(parsed.requiredAnyScopes) &&
      this.hasAllScopes(parsed.requiredAllScopes)
    );
  }

  private resolvePermissions(roles: AppRole[], explicitPermissions: string[]): AppPermission[] {
    const rolePermissions = roles.flatMap((role) => ROLE_PERMISSIONS[role] || []);
    const merged = [...rolePermissions, ...explicitPermissions];
    const normalized = merged
      .map((permission) => permission.trim())
      .filter((permission) => permission.length > 0) as AppPermission[];
    return Array.from(new Set(normalized));
  }

  private resolveScopes(roles: AppRole[], explicitScopes: string[]): AppScope[] {
    const roleScopes = roles.flatMap((role) => ROLE_SCOPES[role] || []);
    const merged = [...roleScopes, ...this.normalizeScopes(explicitScopes)];
    const unique = Array.from(new Set(merged));

    if (unique.includes(APP_SCOPES.global)) {
      return [APP_SCOPES.global];
    }

    return unique;
  }

  private parsePermissionData(data: unknown): Required<PermissionAwareData> {
    const objectData = (data || {}) as Record<string, unknown>;
    return {
      requiredAnyPermissions: this.toStringArray(objectData['requiredAnyPermissions']),
      requiredAllPermissions: this.toStringArray(objectData['requiredAllPermissions']),
      requiredRoles: this.toStringArray(objectData['requiredRoles']),
      requiredAnyScopes: this.toStringArray(objectData['requiredAnyScopes']),
      requiredAllScopes: this.toStringArray(objectData['requiredAllScopes']),
    };
  }

  private normalizeRoles(roles: string[] | undefined): AppRole[] {
    const normalized = this.toStringArray(roles).map((role) => role.toLowerCase().trim());
    const resolved = normalized
      .map((role) => ROLE_ALIASES[role])
      .filter((role): role is AppRole => !!role);
    return Array.from(new Set(resolved));
  }

  private normalizeScopes(scopes: string[] | undefined): AppScope[] {
    const normalized = this.toStringArray(scopes).map((scope) => scope.toLowerCase().trim());
    const resolved = normalized
      .map((scope) => SCOPE_ALIASES[scope])
      .filter((scope): scope is AppScope => !!scope);
    return Array.from(new Set(resolved));
  }

  private readStateFromStorage(): AccessState {
    const storedRoles = this.normalizeRoles(this.readStringArrayFromStorage(this.rolesStorageKey));
    const storedPermissions = this.readStringArrayFromStorage(this.permissionsStorageKey) as AppPermission[];
    const storedScopes = this.normalizeScopes(this.readStringArrayFromStorage(this.scopesStorageKey));

    if (storedRoles.length || storedPermissions.length || storedScopes.length) {
      return {
        roles: storedRoles,
        permissions: this.resolvePermissions(storedRoles, storedPermissions),
        scopes: this.resolveScopes(storedRoles, storedScopes),
      };
    }

    // Post-migration cookie httpOnly : le token n'est plus visible côté JS.
    // On s'appuie sur la présence du méta-username pour réhydrater
    // l'état de session (heuristique UX, validée côté serveur à chaque appel).
    const username = localStorage.getItem('rh_username') || '';
    if (!username) {
      return { roles: [], permissions: [], scopes: [] };
    }
    const inferredRoles = this.inferRolesFromUsername(username);
    return {
      roles: inferredRoles,
      permissions: this.resolvePermissions(inferredRoles, []),
      scopes: this.resolveScopes(inferredRoles, []),
    };
  }

  private persistState(state: AccessState): void {
    localStorage.setItem(this.rolesStorageKey, JSON.stringify(state.roles));
    localStorage.setItem(this.permissionsStorageKey, JSON.stringify(state.permissions));
    localStorage.setItem(this.scopesStorageKey, JSON.stringify(state.scopes));
  }

  private readStringArrayFromStorage(key: string): string[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return this.toStringArray(parsed);
    } catch {
      return [];
    }
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
}
