import { Injectable } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { readField, toNumberValue, toStringValue } from '../../core/utils/dto.utils';

export interface TrainingSession {
  code: string;
  title: string;
  dates: string;
  location: string;
  seats: number;
  enrolled: number;
  status: string;
}

export interface TrainingCourse {
  code: string;
  title: string;
  duration: string;
  modality: string;
  domain: string;
}

interface TrainingSessionDto {
  code?: string;
  title?: string;
  name?: string;
  dates?: string;
  sessionDates?: string;
  session_dates?: string;
  location?: string;
  venue?: string;
  seats?: number | string;
  seatsCount?: number | string;
  seats_count?: number | string;
  enrolled?: number | string;
  enrolledCount?: number | string;
  enrolled_count?: number | string;
  status?: string;
}

interface TrainingCourseDto {
  code?: string;
  title?: string;
  name?: string;
  duration?: string;
  modality?: string;
  mode?: string;
  domain?: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class TrainingService {
  constructor(private apiClient: ApiClientService) {}

  getSessions(): Observable<TrainingSession[]> {
    return this.apiClient
      .get<TrainingSessionDto[]>(API_ENDPOINTS.training.sessions)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            code: toStringValue(readField(dto, ['code'], '')),
            title: toStringValue(readField(dto, ['title', 'name'], '')),
            dates: toStringValue(readField(dto, ['dates', 'sessionDates', 'session_dates'], '')),
            location: toStringValue(readField(dto, ['location', 'venue'], '')),
            seats: toNumberValue(readField(dto, ['seats', 'seatsCount', 'seats_count'], 0)),
            enrolled: toNumberValue(readField(dto, ['enrolled', 'enrolledCount', 'enrolled_count'], 0)),
            status: toStringValue(readField(dto, ['status'], '')),
          }))
        )
      );
  }

  getCatalog(): Observable<TrainingCourse[]> {
    return this.apiClient
      .get<TrainingCourseDto[]>(API_ENDPOINTS.training.catalog)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            code: toStringValue(readField(dto, ['code'], '')),
            title: toStringValue(readField(dto, ['title', 'name'], '')),
            duration: toStringValue(readField(dto, ['duration'], '')),
            modality: toStringValue(readField(dto, ['modality', 'mode'], '')),
            domain: toStringValue(readField(dto, ['domain', 'category'], '')),
          }))
        )
      );
  }
}
