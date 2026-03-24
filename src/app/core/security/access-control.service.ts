import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppRole = 'super_admin' | 'hr_manager' | 'manager' | 'agent';

export const APP_PERMISSIONS = {
  dashboardView: 'dashboard:view',
  personnelView: 'personnel:view',
  organizationView: 'organization:view',
  recruitmentView: 'recruitment:view',
  careersView: 'careers:view',
  leaveView: 'leave:view',
  performanceView: 'performance:view',
  trainingView: 'training:view',
  disciplineView: 'discipline:view',
  documentsView: 'documents:view',
  workflowsView: 'workflows:view',
  reportsView: 'reports:view',
  portalAgent: 'portal:agent',
  portalManager: 'portal:manager',
  adminView: 'admin:view',
  adminUsersManage: 'admin:users:manage',
  adminRolesManage: 'admin:roles:manage',
  adminAuditView: 'admin:audit:view',
} as const;

export type AppPermission = (typeof APP_PERMISSIONS)[keyof typeof APP_PERMISSIONS] | '*';

export interface AccessState {
  roles: AppRole[];
  permissions: AppPermission[];
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
    APP_PERMISSIONS.personnelView,
    APP_PERMISSIONS.organizationView,
    APP_PERMISSIONS.recruitmentView,
    APP_PERMISSIONS.careersView,
    APP_PERMISSIONS.leaveView,
    APP_PERMISSIONS.performanceView,
    APP_PERMISSIONS.trainingView,
    APP_PERMISSIONS.disciplineView,
    APP_PERMISSIONS.documentsView,
    APP_PERMISSIONS.workflowsView,
    APP_PERMISSIONS.reportsView,
    APP_PERMISSIONS.portalAgent,
    APP_PERMISSIONS.portalManager,
  ],
  manager: [
    APP_PERMISSIONS.dashboardView,
    APP_PERMISSIONS.leaveView,
    APP_PERMISSIONS.performanceView,
    APP_PERMISSIONS.trainingView,
    APP_PERMISSIONS.documentsView,
    APP_PERMISSIONS.reportsView,
    APP_PERMISSIONS.portalManager,
  ],
  agent: [
    APP_PERMISSIONS.dashboardView,
    APP_PERMISSIONS.leaveView,
    APP_PERMISSIONS.trainingView,
    APP_PERMISSIONS.documentsView,
    APP_PERMISSIONS.portalAgent,
  ],
};

type PermissionAwareData = {
  requiredAnyPermissions?: string[];
  requiredAllPermissions?: string[];
  requiredRoles?: string[];
};

@Injectable({ providedIn: 'root' })
export class AccessControlService {
  private readonly rolesStorageKey = 'rh_roles';
  private readonly permissionsStorageKey = 'rh_permissions';
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

  applyAccess(access: { roles?: string[]; permissions?: string[]; username?: string }): void {
    const normalizedRoles = this.normalizeRoles(access.roles);
    const resolvedRoles = normalizedRoles.length
      ? normalizedRoles
      : this.inferRolesFromUsername(access.username || '');
    const resolvedPermissions = this.resolvePermissions(resolvedRoles, access.permissions || []);
    const state: AccessState = {
      roles: resolvedRoles,
      permissions: resolvedPermissions,
    };
    this.persistState(state);
    this.stateSubject.next(state);
  }

  clearAccess(): void {
    const emptyState: AccessState = { roles: [], permissions: [] };
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

  hasAnyRole(roles: string[] = []): boolean {
    if (!roles.length) return true;
    return roles.some((role) => this.hasRole(role));
  }

  hasRouteAccess(data: unknown): boolean {
    const parsed = this.parsePermissionData(data);
    return (
      this.hasAnyRole(parsed.requiredRoles) &&
      this.hasAnyPermission(parsed.requiredAnyPermissions) &&
      this.hasAllPermissions(parsed.requiredAllPermissions)
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

  private parsePermissionData(data: unknown): Required<PermissionAwareData> {
    const objectData = (data || {}) as Record<string, unknown>;
    return {
      requiredAnyPermissions: this.toStringArray(objectData['requiredAnyPermissions']),
      requiredAllPermissions: this.toStringArray(objectData['requiredAllPermissions']),
      requiredRoles: this.toStringArray(objectData['requiredRoles']),
    };
  }

  private normalizeRoles(roles: string[] | undefined): AppRole[] {
    const normalized = this.toStringArray(roles).map((role) => role.toLowerCase().trim());
    const resolved = normalized
      .map((role) => ROLE_ALIASES[role])
      .filter((role): role is AppRole => !!role);
    return Array.from(new Set(resolved));
  }

  private readStateFromStorage(): AccessState {
    const storedRoles = this.normalizeRoles(this.readStringArrayFromStorage(this.rolesStorageKey));
    const storedPermissions = this.readStringArrayFromStorage(this.permissionsStorageKey) as AppPermission[];

    if (storedRoles.length || storedPermissions.length) {
      return {
        roles: storedRoles,
        permissions: this.resolvePermissions(storedRoles, storedPermissions),
      };
    }

    const hasToken = !!localStorage.getItem('rh_token');
    if (!hasToken) {
      return { roles: [], permissions: [] };
    }

    const username = localStorage.getItem('rh_username') || '';
    const inferredRoles = this.inferRolesFromUsername(username);
    return {
      roles: inferredRoles,
      permissions: this.resolvePermissions(inferredRoles, []),
    };
  }

  private persistState(state: AccessState): void {
    localStorage.setItem(this.rolesStorageKey, JSON.stringify(state.roles));
    localStorage.setItem(this.permissionsStorageKey, JSON.stringify(state.permissions));
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
