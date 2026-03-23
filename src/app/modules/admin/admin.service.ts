import { Injectable } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
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
  constructor(private apiClient: ApiClientService) {}

  getUsers(): Observable<AdminUser[]> {
    return this.apiClient.get<AdminUserDto[]>(API_ENDPOINTS.admin.users).pipe(
      catchError(() => of([])),
      map((items) =>
        items.map((dto) => ({
          username: toStringValue(readField(dto, ['username', 'login'], '')),
          fullName: toStringValue(readField(dto, ['fullName', 'full_name'], '')),
          role: toStringValue(readField(dto, ['role', 'roleName', 'role_name'], '')),
          direction: toStringValue(readField(dto, ['direction', 'directionName', 'direction_name'], '')),
          status: toStringValue(readField(dto, ['status'], '')),
        }))
      )
    );
  }

  getRoles(): Observable<AdminRole[]> {
    return this.apiClient.get<AdminRoleDto[]>(API_ENDPOINTS.admin.roles).pipe(
      catchError(() => of([])),
      map((items) =>
        items.map((dto) => ({
          name: toStringValue(readField(dto, ['name', 'code'], '')),
          description: toStringValue(readField(dto, ['description'], '')),
          permissions: toNumberValue(readField(dto, ['permissions', 'permissionsCount', 'permissions_count'], 0)),
        }))
      )
    );
  }

  getAudit(): Observable<AuditLogItem[]> {
    return this.apiClient.get<AuditLogDto[]>(API_ENDPOINTS.admin.audit).pipe(
      catchError(() => of([])),
      map((items) =>
        items.map((dto) => ({
          date: toStringValue(readField(dto, ['date', 'timestamp'], '')),
          user: toStringValue(readField(dto, ['user', 'username'], '')),
          action: toStringValue(readField(dto, ['action', 'event'], '')),
          target: toStringValue(readField(dto, ['target', 'resource'], '')),
        }))
      )
    );
  }
}
