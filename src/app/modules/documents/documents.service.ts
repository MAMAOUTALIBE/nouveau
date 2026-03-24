import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toStringValue } from '../../core/utils/dto.utils';

export interface DocumentItem {
  reference: string;
  title: string;
  type: string;
  owner: string;
  updatedAt: string;
  status: string;
}

export interface CreateDocumentPayload {
  reference?: string;
  title: string;
  type: string;
  owner: string;
  updatedAt?: string;
  status?: string;
}

export interface DocumentsQuery extends CollectionQueryOptions {
  status?: string;
  type?: string;
  owner?: string;
}

interface DocumentItemDto {
  reference?: string;
  docRef?: string;
  doc_ref?: string;
  title?: string;
  name?: string;
  type?: string;
  category?: string;
  owner?: string;
  ownerName?: string;
  owner_name?: string;
  updatedAt?: string;
  updated_at?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly localDocumentsKey = 'rh_dev_documents_library';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getDocuments(query?: DocumentsQuery): Observable<DocumentItem[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      type: query?.type,
      owner: query?.owner,
    });

    return this.apiClient
      .get<DocumentItemDto[]>(
        API_ENDPOINTS.documents.library,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapDocuments(items)),
        map((items) => this.mergeByKey(items, this.readLocalDocuments(), (item) => item.reference)),
        map((items) => this.applyLocalDocumentsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalDocumentsQuery(this.readLocalDocuments(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createDocument(payload: CreateDocumentPayload): Observable<DocumentItem> {
    const normalizedPayload = this.normalizeCreateDocumentPayload(payload);

    return this.apiClient
      .post<DocumentItemDto, CreateDocumentPayload>(
        API_ENDPOINTS.documents.library,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeDocument(dto)),
        map((item) => {
          if (item.reference && item.title && item.type && item.owner && item.updatedAt) {
            return item;
          }
          return this.appendLocalDocument(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalDocument(normalizedPayload));
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

  private mapDocuments(items: DocumentItemDto[]): DocumentItem[] {
    return items
      .map((dto) => this.normalizeDocument(dto))
      .filter((item) => !!item.reference && !!item.title && !!item.type && !!item.owner && !!item.updatedAt);
  }

  private normalizeDocument(dto: DocumentItemDto): DocumentItem {
    return {
      reference: toStringValue(readField(dto, ['reference', 'docRef', 'doc_ref'], '')).trim(),
      title: toStringValue(readField(dto, ['title', 'name'], '')).trim(),
      type: toStringValue(readField(dto, ['type', 'category'], '')).trim(),
      owner: toStringValue(readField(dto, ['owner', 'ownerName', 'owner_name'], '')).trim(),
      updatedAt: toStringValue(readField(dto, ['updatedAt', 'updated_at'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Brouillon')).trim() || 'Brouillon',
    };
  }

  private normalizeCreateDocumentPayload(payload: CreateDocumentPayload): CreateDocumentPayload {
    const rawUpdatedAt = String(payload.updatedAt || '').trim();
    const parsed = Date.parse(rawUpdatedAt);

    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      title: String(payload.title || '').trim(),
      type: String(payload.type || '').trim(),
      owner: String(payload.owner || '').trim(),
      updatedAt: !rawUpdatedAt
        ? new Date().toISOString()
        : Number.isNaN(parsed)
          ? rawUpdatedAt
          : new Date(parsed).toISOString(),
      status: this.normalizeOptionalText(payload.status) || 'Brouillon',
    };
  }

  private applyLocalDocumentsQuery(items: DocumentItem[], query?: DocumentsQuery): DocumentItem[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const type = (query?.type || '').trim().toLowerCase();
    const owner = (query?.owner || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (type) {
      next = next.filter((item) => item.type.toLowerCase().includes(type));
    }
    if (owner) {
      next = next.filter((item) => item.owner.toLowerCase().includes(owner));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.type.toLowerCase().includes(search) ||
          item.owner.toLowerCase().includes(search) ||
          item.updatedAt.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'updatedAt').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readDocumentField(left, sortBy).toLowerCase();
      const rightValue = this.readDocumentField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readDocumentField(item: DocumentItem, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'title':
        return item.title;
      case 'type':
        return item.type;
      case 'owner':
        return item.owner;
      case 'updatedAt':
        return item.updatedAt;
      case 'status':
        return item.status;
      default:
        return '';
    }
  }

  private appendLocalDocument(payload: CreateDocumentPayload): DocumentItem {
    const current = this.readLocalDocuments();
    const created: DocumentItem = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateDocumentReference(current),
      title: String(payload.title || '').trim(),
      type: String(payload.type || '').trim(),
      owner: String(payload.owner || '').trim(),
      updatedAt: String(payload.updatedAt || new Date().toISOString()).trim(),
      status: this.normalizeOptionalText(payload.status) || 'Brouillon',
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalDocuments(deduped);
    return created;
  }

  private generateDocumentReference(existing: DocumentItem[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^DOC-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `DOC-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalDocuments(): DocumentItem[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localDocumentsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((item) => {
          const record = item as Partial<DocumentItem>;
          return {
            reference: String(record.reference || '').trim(),
            title: String(record.title || '').trim(),
            type: String(record.type || '').trim(),
            owner: String(record.owner || '').trim(),
            updatedAt: String(record.updatedAt || '').trim(),
            status: String(record.status || 'Brouillon').trim() || 'Brouillon',
          } as DocumentItem;
        })
        .filter((item) => !!item.reference && !!item.title && !!item.type && !!item.owner && !!item.updatedAt);
    } catch {
      return [];
    }
  }

  private writeLocalDocuments(items: DocumentItem[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localDocumentsKey, JSON.stringify(items));
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
