import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toNumberValue, toStringValue } from '../../core/utils/dto.utils';

export interface AdminUser {
  username: string;
  fullName: string;
  role: string;
  direction: string;
  status: string;
}

export interface AdminRole {
  name: string;
  description: string;
  permissions: number;
}

export interface AuditLogItem {
  date: string;
  user: string;
  action: string;
  target: string;
}

export interface CreateAdminUserPayload {
  username: string;
  fullName: string;
  role: string;
  direction: string;
  status?: string;
}

export interface CreateAdminRolePayload {
  name: string;
  description: string;
  permissions: number;
}

export interface AdminUsersQuery extends CollectionQueryOptions {
  status?: string;
  role?: string;
  direction?: string;
}

export interface AdminRolesQuery extends CollectionQueryOptions {}

export interface AdminAuditQuery extends CollectionQueryOptions {
  user?: string;
  action?: string;
}

interface AdminUserDto {
  username?: string;
  login?: string;
  fullName?: string;
  full_name?: string;
  role?: string;
  roleName?: string;
  role_name?: string;
  direction?: string;
  directionName?: string;
  direction_name?: string;
  status?: string;
}

interface AdminRoleDto {
  name?: string;
  code?: string;
  description?: string;
  permissions?: number | string;
  permissionsCount?: number | string;
  permissions_count?: number | string;
}

interface AuditLogDto {
  date?: string;
  timestamp?: string;
  user?: string;
  username?: string;
  action?: string;
  event?: string;
  target?: string;
  resource?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly localUsersKey = 'rh_dev_admin_users';
  private readonly localRolesKey = 'rh_dev_admin_roles';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getUsers(query?: AdminUsersQuery): Observable<AdminUser[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      role: query?.role,
      direction: query?.direction,
    });

    return this.apiClient
      .get<AdminUserDto[]>(
        API_ENDPOINTS.admin.users,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapUsers(items)),
        map((items) => this.mergeByKey(items, this.readLocalUsers(), (item) => item.username.toLowerCase())),
        map((items) => this.applyLocalUsersQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalUsersQuery(this.readLocalUsers(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createUser(payload: CreateAdminUserPayload): Observable<AdminUser> {
    const normalizedPayload = this.normalizeCreateUserPayload(payload);

    return this.apiClient
      .post<AdminUserDto, CreateAdminUserPayload>(
        API_ENDPOINTS.admin.users,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeUser(dto)),
        map((item) => {
          if (item.username && item.fullName && item.role) {
            this.writeUserToLocal(item);
            return item;
          }
          return this.appendLocalUser(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalUser(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getRoles(query?: AdminRolesQuery): Observable<AdminRole[]> {
    const params = buildCollectionQueryParams(query);

    return this.apiClient
      .get<AdminRoleDto[]>(
        API_ENDPOINTS.admin.roles,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRoles(items)),
        map((items) => this.mergeByKey(items, this.readLocalRoles(), (item) => item.name.toLowerCase())),
        map((items) => this.applyLocalRolesQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalRolesQuery(this.readLocalRoles(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createRole(payload: CreateAdminRolePayload): Observable<AdminRole> {
    const normalizedPayload = this.normalizeCreateRolePayload(payload);

    return this.apiClient
      .post<AdminRoleDto, CreateAdminRolePayload>(
        API_ENDPOINTS.admin.roles,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRole(dto)),
        map((item) => {
          if (item.name && item.description) {
            this.writeRoleToLocal(item);
            return item;
          }
          return this.appendLocalRole(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalRole(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getAudit(query?: AdminAuditQuery): Observable<AuditLogItem[]> {
    const params = buildCollectionQueryParams(query, {
      user: query?.user,
      action: query?.action,
    });

    return this.apiClient
      .get<AuditLogDto[]>(
        API_ENDPOINTS.admin.audit,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) =>
          items.map((dto) => ({
            date: toStringValue(readField(dto, ['date', 'timestamp'], '')).trim(),
            user: toStringValue(readField(dto, ['user', 'username'], '')).trim(),
            action: toStringValue(readField(dto, ['action', 'event'], '')).trim(),
            target: toStringValue(readField(dto, ['target', 'resource'], '')).trim(),
          }))
        ),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of([]);
          }
          return throwError(() => error);
        })
      );
  }

  private shouldUseLocalFallback(error: unknown): boolean {
    if (!this.fallbackEnabled) {
      return false;
    }

    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    return error.status === 0 || error.status >= 500 || error.status === 404;
  }

  private mapUsers(items: AdminUserDto[]): AdminUser[] {
    return items
      .map((dto) => this.normalizeUser(dto))
      .filter((item) => !!item.username && !!item.fullName && !!item.role);
  }

  private normalizeUser(dto: AdminUserDto): AdminUser {
    return {
      username: toStringValue(readField(dto, ['username', 'login'], '')).trim().toLowerCase(),
      fullName: toStringValue(readField(dto, ['fullName', 'full_name'], '')).trim(),
      role: toStringValue(readField(dto, ['role', 'roleName', 'role_name'], '')).trim(),
      direction: toStringValue(readField(dto, ['direction', 'directionName', 'direction_name'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Actif')).trim() || 'Actif',
    };
  }

  private normalizeCreateUserPayload(payload: CreateAdminUserPayload): CreateAdminUserPayload {
    return {
      username: String(payload.username || '').trim().toLowerCase(),
      fullName: String(payload.fullName || '').trim(),
      role: String(payload.role || '').trim(),
      direction: String(payload.direction || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Actif',
    };
  }

  private applyLocalUsersQuery(items: AdminUser[], query?: AdminUsersQuery): AdminUser[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const role = (query?.role || '').trim().toLowerCase();
    const direction = (query?.direction || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (role) {
      next = next.filter((item) => item.role.toLowerCase().includes(role));
    }
    if (direction) {
      next = next.filter((item) => item.direction.toLowerCase().includes(direction));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.username.toLowerCase().includes(search) ||
          item.fullName.toLowerCase().includes(search) ||
          item.role.toLowerCase().includes(search) ||
          item.direction.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'username').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readUserField(left, sortBy).toLowerCase();
      const rightValue = this.readUserField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readUserField(item: AdminUser, field: string): string {
    switch (field) {
      case 'username':
        return item.username;
      case 'fullName':
        return item.fullName;
      case 'role':
        return item.role;
      case 'direction':
        return item.direction;
      case 'status':
        return item.status;
      default:
        return '';
    }
  }

  private writeUserToLocal(item: AdminUser): void {
    const current = this.readLocalUsers();
    const byUsername = new Map(current.map((entry) => [entry.username.toLowerCase(), entry]));
    byUsername.set(item.username.toLowerCase(), item);
    this.writeLocalUsers(Array.from(byUsername.values()));
  }

  private appendLocalUser(payload: CreateAdminUserPayload): AdminUser {
    const current = this.readLocalUsers();
    const created: AdminUser = {
      username: String(payload.username || '').trim().toLowerCase(),
      fullName: String(payload.fullName || '').trim(),
      role: String(payload.role || '').trim(),
      direction: String(payload.direction || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Actif',
    };
    const deduped = current.filter((item) => item.username.toLowerCase() !== created.username.toLowerCase());
    deduped.push(created);
    this.writeLocalUsers(deduped);
    return created;
  }

  private readLocalUsers(): AdminUser[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localUsersKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((entry) => this.normalizeUser(entry as AdminUserDto))
        .filter((item) => !!item.username && !!item.fullName && !!item.role);
    } catch {
      return [];
    }
  }

  private writeLocalUsers(items: AdminUser[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localUsersKey, JSON.stringify(items));
  }

  private mapRoles(items: AdminRoleDto[]): AdminRole[] {
    return items
      .map((dto) => this.normalizeRole(dto))
      .filter((item) => !!item.name && !!item.description);
  }

  private normalizeRole(dto: AdminRoleDto): AdminRole {
    return {
      name: toStringValue(readField(dto, ['name', 'code'], '')).trim(),
      description: toStringValue(readField(dto, ['description'], '')).trim(),
      permissions: Math.max(0, toNumberValue(readField(dto, ['permissions', 'permissionsCount', 'permissions_count'], 0))),
    };
  }

  private normalizeCreateRolePayload(payload: CreateAdminRolePayload): CreateAdminRolePayload {
    const permissions = this.toStrictPositiveInt(payload.permissions, 1);
    return {
      name: String(payload.name || '').trim(),
      description: String(payload.description || '').trim(),
      permissions,
    };
  }

  private applyLocalRolesQuery(items: AdminRole[], query?: AdminRolesQuery): AdminRole[] {
    let next = [...items];
    const search = (query?.q || '').trim().toLowerCase();

    if (search) {
      next = next.filter((item) => {
        return (
          item.name.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          String(item.permissions).includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'permissions').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readRoleField(left, sortBy);
      const rightValue = this.readRoleField(right, sortBy);

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        if (leftValue === rightValue) return 0;
        if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
        return sortOrder === 'asc' ? 1 : -1;
      }

      const leftText = String(leftValue).toLowerCase();
      const rightText = String(rightValue).toLowerCase();
      if (leftText === rightText) return 0;
      if (leftText < rightText) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readRoleField(item: AdminRole, field: string): string | number {
    switch (field) {
      case 'name':
        return item.name;
      case 'description':
        return item.description;
      case 'permissions':
        return item.permissions;
      default:
        return '';
    }
  }

  private writeRoleToLocal(item: AdminRole): void {
    const current = this.readLocalRoles();
    const byName = new Map(current.map((entry) => [entry.name.toLowerCase(), entry]));
    byName.set(item.name.toLowerCase(), item);
    this.writeLocalRoles(Array.from(byName.values()));
  }

  private appendLocalRole(payload: CreateAdminRolePayload): AdminRole {
    const current = this.readLocalRoles();
    const created: AdminRole = {
      name: String(payload.name || '').trim(),
      description: String(payload.description || '').trim(),
      permissions: this.toStrictPositiveInt(payload.permissions, 1),
    };
    const deduped = current.filter((item) => item.name.toLowerCase() !== created.name.toLowerCase());
    deduped.push(created);
    this.writeLocalRoles(deduped);
    return created;
  }

  private readLocalRoles(): AdminRole[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localRolesKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((entry) => this.normalizeRole(entry as AdminRoleDto))
        .filter((item) => !!item.name && !!item.description);
    } catch {
      return [];
    }
  }

  private writeLocalRoles(items: AdminRole[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localRolesKey, JSON.stringify(items));
  }

  private mergeByKey<T>(apiItems: T[], localItems: T[], getKey: (item: T) => string): T[] {
    if (!this.fallbackEnabled) {
      return apiItems;
    }

    const byKey = new Map<string, T>();
    apiItems.forEach((item) => byKey.set(getKey(item), item));
    localItems.forEach((item) => byKey.set(getKey(item), item));
    return Array.from(byKey.values());
  }

  private hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  private normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private toStrictPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded > 0 ? rounded : fallback;
  }
}
