import { Injectable } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { readField, toStringValue } from '../../core/utils/dto.utils';

export interface DocumentItem {
  reference: string;
  title: string;
  type: string;
  owner: string;
  updatedAt: string;
  status: string;
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
  constructor(private apiClient: ApiClientService) {}

  getDocuments(): Observable<DocumentItem[]> {
    return this.apiClient
      .get<DocumentItemDto[]>(API_ENDPOINTS.documents.library)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            reference: toStringValue(readField(dto, ['reference', 'docRef', 'doc_ref'], '')),
            title: toStringValue(readField(dto, ['title', 'name'], '')),
            type: toStringValue(readField(dto, ['type', 'category'], '')),
            owner: toStringValue(readField(dto, ['owner', 'ownerName', 'owner_name'], '')),
            updatedAt: toStringValue(readField(dto, ['updatedAt', 'updated_at'], '')),
            status: toStringValue(readField(dto, ['status'], '')),
          }))
        )
      );
  }
}
