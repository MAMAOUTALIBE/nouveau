import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toStringValue } from '../../core/utils/dto.utils';

export const DISCIPLINE_WORKFLOW_STEPS = [
  'Signale',
  'Qualification',
  'Mediation',
  'Enquete',
  'Commission',
  'Decision',
  'Execution',
  'Cloturee',
] as const;

export const DISCIPLINE_SEVERITY_OPTIONS = ['Faible', 'Moyen', 'Eleve', 'Critique'] as const;
export const DISCIPLINE_CATEGORY_OPTIONS = [
  'Conflit interpersonnel',
  'Insubordination',
  'Absenteisme',
  'Fraude',
  'Violence',
  'Harcelement',
  'Manquement ethique',
  'Atteinte documentaire',
  'Autre',
] as const;
export const DISCIPLINE_SANCTION_OPTIONS = [
  'Avertissement',
  'Blame',
  'Mise a pied',
  'Retrogradation',
  'Mutation disciplinaire',
  'Suspension',
  'Radiation',
] as const;
export const DISCIPLINE_MEDIATION_STATUS_OPTIONS = [
  'Non requise',
  'A planifier',
  'En cours',
  'Conclue',
  'Echec',
] as const;
export const DISCIPLINE_APPEAL_STATUS_OPTIONS = [
  'Aucun',
  'Depose',
  'En instruction',
  'Accepte',
  'Rejete',
] as const;
export const DISCIPLINE_CONFIDENTIALITY_OPTIONS = ['Normal', 'Sensible', 'Restreint'] as const;

export type DisciplineCaseStatus = (typeof DISCIPLINE_WORKFLOW_STEPS)[number];
export type DisciplineSeverity = (typeof DISCIPLINE_SEVERITY_OPTIONS)[number];
export type DisciplineCategory = (typeof DISCIPLINE_CATEGORY_OPTIONS)[number];
export type DisciplineMediationStatus = (typeof DISCIPLINE_MEDIATION_STATUS_OPTIONS)[number];
export type DisciplineAppealStatus = (typeof DISCIPLINE_APPEAL_STATUS_OPTIONS)[number];
export type DisciplineConfidentiality = (typeof DISCIPLINE_CONFIDENTIALITY_OPTIONS)[number];

export interface DisciplineCase {
  reference: string;
  agent: string;
  direction: string;
  category: DisciplineCategory;
  severity: DisciplineSeverity;
  infraction: string;
  incidentOn: string;
  openedOn: string;
  status: DisciplineCaseStatus;
  mediationRequired: boolean;
  mediationStatus: DisciplineMediationStatus;
  confidentialLevel: DisciplineConfidentiality;
  summary: string;
  decisionBy?: string;
  decisionOn?: string;
  sanctionType?: string;
  sanctionDurationDays?: number;
  sanctionStartOn?: string;
  sanctionEndOn?: string;
  radiation: boolean;
  appealStatus: DisciplineAppealStatus;
  createdAt: string;
  updatedAt: string;
  sanction?: string;
}

export interface CreateDisciplineCasePayload {
  reference?: string;
  agent: string;
  direction?: string;
  category?: string;
  severity?: string;
  infraction: string;
  incidentOn?: string;
  openedOn: string;
  status?: string;
  mediationRequired?: boolean;
  confidentialLevel?: string;
  summary?: string;
  appealStatus?: string;
  radiation?: boolean;
  decisionBy?: string;
  decisionOn?: string;
  sanctionType?: string;
  sanctionDurationDays?: number;
  sanctionStartOn?: string;
  sanctionEndOn?: string;
  sanction?: string;
}

export interface DisciplineCasesQuery extends CollectionQueryOptions {
  status?: string;
  agent?: string;
  severity?: string;
  direction?: string;
  category?: string;
  radiation?: string;
}

export interface UpdateDisciplineCasePayload {
  agent?: string;
  direction?: string;
  category?: string;
  severity?: string;
  infraction?: string;
  incidentOn?: string;
  openedOn?: string;
  status?: string;
  mediationRequired?: boolean;
  mediationStatus?: string;
  confidentialLevel?: string;
  summary?: string;
  decisionBy?: string;
  decisionOn?: string;
  sanctionType?: string;
  sanctionDurationDays?: number;
  sanctionStartOn?: string;
  sanctionEndOn?: string;
  sanction?: string;
  appealStatus?: string;
  radiation?: boolean;
}

export interface DisciplineStats {
  total: number;
  ouverts: number;
  mediation: number;
  sanctionsActives: number;
  radiations: number;
  recoursOuverts: number;
  critiques: number;
}

interface DisciplineCaseDto {
  reference?: string;
  caseRef?: string;
  case_ref?: string;
  agent?: string;
  agentName?: string;
  agent_name?: string;
  infraction?: string;
  reason?: string;
  category?: string;
  severity?: string;
  direction?: string;
  incidentOn?: string;
  incident_on?: string;
  openedOn?: string;
  opened_on?: string;
  status?: string;
  mediationRequired?: boolean;
  mediation_required?: boolean;
  mediationStatus?: string;
  mediation_status?: string;
  confidentialLevel?: string;
  confidential_level?: string;
  summary?: string;
  decisionBy?: string;
  decision_by?: string;
  decisionOn?: string;
  decision_on?: string;
  sanctionType?: string;
  sanction_type?: string;
  sanctionDurationDays?: number;
  sanction_duration_days?: number;
  sanctionStartOn?: string;
  sanction_start_on?: string;
  sanctionEndOn?: string;
  sanction_end_on?: string;
  radiation?: boolean;
  appealStatus?: string;
  appeal_status?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  sanction?: string;
}

@Injectable({ providedIn: 'root' })
export class DisciplineService {
  private readonly localCasesKey = 'rh_dev_discipline_cases';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getCases(query?: DisciplineCasesQuery): Observable<DisciplineCase[]> {
    this.seedLocalCasesIfNeeded();

    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      agent: query?.agent,
      severity: query?.severity,
      direction: query?.direction,
      category: query?.category,
      radiation: query?.radiation,
    });

    return this.apiClient
      .get<DisciplineCaseDto[]>(
        API_ENDPOINTS.discipline.cases,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapCases(items)),
        map((items) => this.mergeByKey(items, this.readLocalCases(), (item) => item.reference)),
        map((items) => this.applyLocalCasesQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalCasesQuery(this.readLocalCases(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createCase(payload: CreateDisciplineCasePayload): Observable<DisciplineCase> {
    const normalizedPayload = this.normalizeCreateCasePayload(payload);

    return this.apiClient
      .post<DisciplineCaseDto, CreateDisciplineCasePayload>(
        API_ENDPOINTS.discipline.cases,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeCase(dto)),
        map((item) => {
          if (this.isCompleteCase(item)) {
            return this.mergeInLocalStore(item);
          }
          return this.appendLocalCase(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalCase(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  updateCase(reference: string, patch: UpdateDisciplineCasePayload): Observable<DisciplineCase> {
    const normalizedReference = String(reference || '').trim();
    if (!normalizedReference) {
      return throwError(() => new Error('Reference dossier invalide'));
    }

    const normalizedPatch = this.normalizeUpdatePayload(patch);
    const updated = this.updateLocalCase(normalizedReference, normalizedPatch);
    return of(updated);
  }

  advanceCase(reference: string): Observable<DisciplineCase | null> {
    return this.getCases({ limit: 2000, sortBy: 'openedOn', sortOrder: 'desc' }).pipe(
      switchMap((items) => {
        const found = items.find((item) => item.reference === reference);
        if (!found) return of(null);

        const next = this.getNextStatus(found.status);
        if (!next) return of(found);
        return this.updateCase(reference, { status: next });
      })
    );
  }

  applyRecommendedSanction(reference: string): Observable<DisciplineCase | null> {
    return this.getCases({ limit: 2000, sortBy: 'openedOn', sortOrder: 'desc' }).pipe(
      switchMap((items) => {
        const found = items.find((item) => item.reference === reference);
        if (!found) return of(null);

        const recommendation = this.recommendedSanction(found.severity, found.radiation);
        return this.updateCase(reference, {
          status: found.status === 'Decision' || found.status === 'Execution' ? found.status : 'Decision',
          sanctionType: recommendation.type,
          sanctionDurationDays: recommendation.durationDays,
          sanctionStartOn: this.toIsoDate(new Date()),
          sanctionEndOn: recommendation.durationDays
            ? this.toIsoDate(this.addDays(new Date(), recommendation.durationDays))
            : undefined,
        });
      })
    );
  }

  getStats(): Observable<DisciplineStats> {
    return this.getCases({ limit: 2000, sortBy: 'openedOn', sortOrder: 'desc' }).pipe(
      map((items) => this.computeStats(items))
    );
  }

  getNextStatus(current: string): DisciplineCaseStatus | null {
    const normalized = this.normalizeStatus(current);
    const currentIndex = DISCIPLINE_WORKFLOW_STEPS.indexOf(normalized);
    if (currentIndex < 0 || currentIndex >= DISCIPLINE_WORKFLOW_STEPS.length - 1) {
      return null;
    }
    return DISCIPLINE_WORKFLOW_STEPS[currentIndex + 1];
  }

  computeStats(items: DisciplineCase[]): DisciplineStats {
    const total = items.length;
    const ouverts = items.filter((item) => item.status !== 'Cloturee').length;
    const mediation = items.filter(
      (item) => item.status === 'Mediation' || item.mediationStatus === 'En cours'
    ).length;
    const sanctionsActives = items.filter((item) => {
      if (!item.sanctionType) return false;
      if (!item.sanctionEndOn) return true;
      return this.parseDate(item.sanctionEndOn) >= this.parseDate(this.toIsoDate(new Date()));
    }).length;
    const radiations = items.filter((item) => item.radiation).length;
    const recoursOuverts = items.filter(
      (item) => item.appealStatus === 'Depose' || item.appealStatus === 'En instruction'
    ).length;
    const critiques = items.filter((item) => item.severity === 'Critique').length;
    return {
      total,
      ouverts,
      mediation,
      sanctionsActives,
      radiations,
      recoursOuverts,
      critiques,
    };
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

  private mapCases(items: DisciplineCaseDto[]): DisciplineCase[] {
    return items
      .map((dto) => this.normalizeCase(dto))
      .filter((item) => this.isCompleteCase(item));
  }

  private normalizeCase(dto: DisciplineCaseDto): DisciplineCase {
    const nowIso = this.toIsoDate(new Date());
    const status = this.normalizeStatus(readField(dto, ['status'], 'Signale'));
    const mediationRequired = this.toBoolean(readField(dto, ['mediationRequired', 'mediation_required'], false));
    const sanctionType = this.normalizeOptionalText(readField(dto, ['sanctionType', 'sanction_type', 'sanction'], undefined));
    const sanctionDuration = this.toPositiveInt(
      readField(dto, ['sanctionDurationDays', 'sanction_duration_days'], undefined)
    );
    const radiation = this.toBoolean(readField(dto, ['radiation'], false)) || sanctionType === 'Radiation';
    const mediationStatus = this.normalizeMediationStatus(
      readField(dto, ['mediationStatus', 'mediation_status'], mediationRequired ? 'A planifier' : 'Non requise')
    );

    return {
      reference: toStringValue(readField(dto, ['reference', 'caseRef', 'case_ref'], '')).trim(),
      agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim(),
      direction: this.normalizeOptionalText(readField(dto, ['direction'], undefined)) || 'Direction inconnue',
      category: this.normalizeCategory(readField(dto, ['category'], 'Autre')),
      severity: this.normalizeSeverity(readField(dto, ['severity'], 'Moyen')),
      infraction: toStringValue(readField(dto, ['infraction', 'reason'], '')).trim(),
      incidentOn:
        this.normalizeOptionalText(readField(dto, ['incidentOn', 'incident_on'], undefined)) ||
        this.normalizeOptionalText(readField(dto, ['openedOn', 'opened_on'], undefined)) ||
        nowIso,
      openedOn: toStringValue(readField(dto, ['openedOn', 'opened_on'], '')).trim(),
      status,
      mediationRequired,
      mediationStatus,
      confidentialLevel: this.normalizeConfidentiality(
        readField(dto, ['confidentialLevel', 'confidential_level'], 'Normal')
      ),
      summary: this.normalizeOptionalText(readField(dto, ['summary'], undefined)) || 'Aucun resume renseigne.',
      decisionBy: this.normalizeOptionalText(readField(dto, ['decisionBy', 'decision_by'], undefined)),
      decisionOn: this.normalizeOptionalText(readField(dto, ['decisionOn', 'decision_on'], undefined)),
      sanctionType,
      sanctionDurationDays: sanctionDuration,
      sanctionStartOn: this.normalizeOptionalText(readField(dto, ['sanctionStartOn', 'sanction_start_on'], undefined)),
      sanctionEndOn: this.normalizeOptionalText(readField(dto, ['sanctionEndOn', 'sanction_end_on'], undefined)),
      radiation,
      appealStatus: this.normalizeAppealStatus(readField(dto, ['appealStatus', 'appeal_status'], 'Aucun')),
      createdAt:
        this.normalizeOptionalText(readField(dto, ['createdAt', 'created_at'], undefined)) ||
        this.normalizeOptionalText(readField(dto, ['openedOn', 'opened_on'], undefined)) ||
        nowIso,
      updatedAt:
        this.normalizeOptionalText(readField(dto, ['updatedAt', 'updated_at'], undefined)) ||
        this.normalizeOptionalText(readField(dto, ['openedOn', 'opened_on'], undefined)) ||
        nowIso,
      sanction: this.buildSanctionLabel(sanctionType, sanctionDuration),
    };
  }

  private normalizeCreateCasePayload(payload: CreateDisciplineCasePayload): CreateDisciplineCasePayload {
    const openedOn = String(payload.openedOn || '').trim() || this.toIsoDate(new Date());
    const incidentOn = String(payload.incidentOn || '').trim() || openedOn;
    const severity = this.normalizeSeverity(payload.severity);
    const category = this.normalizeCategory(payload.category);
    const status = this.normalizeStatus(payload.status);
    const sanctionType = this.normalizeOptionalText(payload.sanctionType || payload.sanction);
    const sanctionDurationDays = this.toPositiveInt(payload.sanctionDurationDays);
    const mediationRequired = !!payload.mediationRequired;

    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      agent: String(payload.agent || '').trim(),
      direction: this.normalizeOptionalText(payload.direction) || 'Direction inconnue',
      category,
      severity,
      infraction: String(payload.infraction || '').trim(),
      incidentOn,
      openedOn,
      status,
      mediationRequired,
      confidentialLevel: this.normalizeConfidentiality(payload.confidentialLevel),
      summary: this.normalizeOptionalText(payload.summary) || 'Aucun resume renseigne.',
      appealStatus: this.normalizeAppealStatus(payload.appealStatus),
      radiation: !!payload.radiation,
      decisionBy: this.normalizeOptionalText(payload.decisionBy),
      decisionOn: this.normalizeOptionalText(payload.decisionOn),
      sanctionType,
      sanctionDurationDays,
      sanctionStartOn: this.normalizeOptionalText(payload.sanctionStartOn),
      sanctionEndOn: this.normalizeOptionalText(payload.sanctionEndOn),
      sanction: this.buildSanctionLabel(sanctionType, sanctionDurationDays),
    };
  }

  private normalizeUpdatePayload(payload: UpdateDisciplineCasePayload): UpdateDisciplineCasePayload {
    return {
      agent: this.normalizeOptionalText(payload.agent),
      direction: this.normalizeOptionalText(payload.direction),
      category: this.normalizeOptionalText(payload.category),
      severity: this.normalizeOptionalText(payload.severity),
      infraction: this.normalizeOptionalText(payload.infraction),
      incidentOn: this.normalizeOptionalText(payload.incidentOn),
      openedOn: this.normalizeOptionalText(payload.openedOn),
      status: this.normalizeOptionalText(payload.status),
      mediationRequired: typeof payload.mediationRequired === 'boolean' ? payload.mediationRequired : undefined,
      mediationStatus: this.normalizeOptionalText(payload.mediationStatus),
      confidentialLevel: this.normalizeOptionalText(payload.confidentialLevel),
      summary: this.normalizeOptionalText(payload.summary),
      decisionBy: this.normalizeOptionalText(payload.decisionBy),
      decisionOn: this.normalizeOptionalText(payload.decisionOn),
      sanctionType: this.normalizeOptionalText(payload.sanctionType || payload.sanction),
      sanctionDurationDays: this.toPositiveInt(payload.sanctionDurationDays),
      sanctionStartOn: this.normalizeOptionalText(payload.sanctionStartOn),
      sanctionEndOn: this.normalizeOptionalText(payload.sanctionEndOn),
      appealStatus: this.normalizeOptionalText(payload.appealStatus),
      radiation: typeof payload.radiation === 'boolean' ? payload.radiation : undefined,
      sanction: this.normalizeOptionalText(payload.sanction),
    };
  }

  private applyLocalCasesQuery(items: DisciplineCase[], query?: DisciplineCasesQuery): DisciplineCase[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const agent = (query?.agent || '').trim().toLowerCase();
    const severity = (query?.severity || '').trim().toLowerCase();
    const direction = (query?.direction || '').trim().toLowerCase();
    const category = (query?.category || '').trim().toLowerCase();
    const radiation = (query?.radiation || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (agent) {
      next = next.filter((item) => item.agent.toLowerCase().includes(agent));
    }
    if (severity) {
      next = next.filter((item) => item.severity.toLowerCase().includes(severity));
    }
    if (direction) {
      next = next.filter((item) => item.direction.toLowerCase().includes(direction));
    }
    if (category) {
      next = next.filter((item) => item.category.toLowerCase().includes(category));
    }
    if (radiation) {
      const expected = radiation === 'oui' || radiation === 'true' || radiation === '1';
      next = next.filter((item) => item.radiation === expected);
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.agent.toLowerCase().includes(search) ||
          item.direction.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search) ||
          item.severity.toLowerCase().includes(search) ||
          item.infraction.toLowerCase().includes(search) ||
          item.summary.toLowerCase().includes(search) ||
          item.openedOn.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.mediationStatus.toLowerCase().includes(search) ||
          item.appealStatus.toLowerCase().includes(search) ||
          (item.sanctionType || '').toLowerCase().includes(search) ||
          (item.sanction || '').toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'openedOn').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readCaseField(left, sortBy).toLowerCase();
      const rightValue = this.readCaseField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readCaseField(item: DisciplineCase, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'agent':
        return item.agent;
      case 'direction':
        return item.direction;
      case 'category':
        return item.category;
      case 'severity':
        return item.severity;
      case 'infraction':
        return item.infraction;
      case 'incidentOn':
        return item.incidentOn;
      case 'openedOn':
        return item.openedOn;
      case 'status':
        return item.status;
      case 'mediationStatus':
        return item.mediationStatus;
      case 'appealStatus':
        return item.appealStatus;
      case 'decisionOn':
        return item.decisionOn || '';
      case 'updatedAt':
        return item.updatedAt;
      case 'sanction':
        return item.sanction || '';
      case 'sanctionType':
        return item.sanctionType || '';
      default:
        return '';
    }
  }

  private appendLocalCase(payload: CreateDisciplineCasePayload): DisciplineCase {
    const current = this.readLocalCases();
    const created: DisciplineCase = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateCaseReference(current),
      agent: String(payload.agent || '').trim(),
      direction: this.normalizeOptionalText(payload.direction) || 'Direction inconnue',
      category: this.normalizeCategory(payload.category),
      severity: this.normalizeSeverity(payload.severity),
      infraction: String(payload.infraction || '').trim(),
      incidentOn: this.normalizeOptionalText(payload.incidentOn) || this.toIsoDate(new Date()),
      openedOn: String(payload.openedOn || '').trim(),
      status: this.normalizeStatus(payload.status),
      mediationRequired: !!payload.mediationRequired,
      mediationStatus: this.normalizeMediationStatus(payload.mediationRequired ? 'A planifier' : 'Non requise'),
      confidentialLevel: this.normalizeConfidentiality(payload.confidentialLevel),
      summary: this.normalizeOptionalText(payload.summary) || 'Aucun resume renseigne.',
      decisionBy: this.normalizeOptionalText(payload.decisionBy),
      decisionOn: this.normalizeOptionalText(payload.decisionOn),
      sanctionType: this.normalizeOptionalText(payload.sanctionType || payload.sanction),
      sanctionDurationDays: this.toPositiveInt(payload.sanctionDurationDays),
      sanctionStartOn: this.normalizeOptionalText(payload.sanctionStartOn),
      sanctionEndOn: this.normalizeOptionalText(payload.sanctionEndOn),
      radiation: !!payload.radiation || this.normalizeOptionalText(payload.sanctionType) === 'Radiation',
      appealStatus: this.normalizeAppealStatus(payload.appealStatus),
      createdAt: this.toIsoDate(new Date()),
      updatedAt: this.toIsoDate(new Date()),
      sanction: this.buildSanctionLabel(
        this.normalizeOptionalText(payload.sanctionType || payload.sanction),
        this.toPositiveInt(payload.sanctionDurationDays)
      ),
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalCases(deduped);
    return created;
  }

  private updateLocalCase(reference: string, patch: UpdateDisciplineCasePayload): DisciplineCase {
    const current = this.readLocalCases();
    const existingIndex = current.findIndex((item) => item.reference === reference);
    const existing = existingIndex >= 0 ? current[existingIndex] : this.createPlaceholderCase(reference);

    const next: DisciplineCase = {
      ...existing,
      agent: this.pickUpdatedValue(existing.agent, patch.agent),
      direction: this.pickUpdatedValue(existing.direction, patch.direction),
      category: this.normalizeCategory(patch.category || existing.category),
      severity: this.normalizeSeverity(patch.severity || existing.severity),
      infraction: this.pickUpdatedValue(existing.infraction, patch.infraction),
      incidentOn: this.pickUpdatedValue(existing.incidentOn, patch.incidentOn),
      openedOn: this.pickUpdatedValue(existing.openedOn, patch.openedOn),
      status: this.normalizeStatus(patch.status || existing.status),
      mediationRequired:
        typeof patch.mediationRequired === 'boolean' ? patch.mediationRequired : existing.mediationRequired,
      mediationStatus: this.normalizeMediationStatus(
        patch.mediationStatus ||
          existing.mediationStatus ||
          (existing.mediationRequired ? 'A planifier' : 'Non requise')
      ),
      confidentialLevel: this.normalizeConfidentiality(patch.confidentialLevel || existing.confidentialLevel),
      summary: this.pickUpdatedValue(existing.summary, patch.summary),
      decisionBy: this.pickUpdatedOptionalValue(existing.decisionBy, patch.decisionBy),
      decisionOn: this.pickUpdatedOptionalValue(existing.decisionOn, patch.decisionOn),
      sanctionType: this.pickUpdatedOptionalValue(existing.sanctionType, patch.sanctionType || patch.sanction),
      sanctionDurationDays:
        typeof patch.sanctionDurationDays === 'number' ? patch.sanctionDurationDays : existing.sanctionDurationDays,
      sanctionStartOn: this.pickUpdatedOptionalValue(existing.sanctionStartOn, patch.sanctionStartOn),
      sanctionEndOn: this.pickUpdatedOptionalValue(existing.sanctionEndOn, patch.sanctionEndOn),
      radiation:
        typeof patch.radiation === 'boolean'
          ? patch.radiation
          : existing.radiation || (patch.sanctionType || patch.sanction) === 'Radiation',
      appealStatus: this.normalizeAppealStatus(patch.appealStatus || existing.appealStatus),
      updatedAt: this.toIsoDate(new Date()),
      sanction: this.buildSanctionLabel(
        this.pickUpdatedOptionalValue(existing.sanctionType, patch.sanctionType || patch.sanction),
        typeof patch.sanctionDurationDays === 'number' ? patch.sanctionDurationDays : existing.sanctionDurationDays
      ),
    };

    if (next.status === 'Decision' && !next.decisionOn) {
      next.decisionOn = this.toIsoDate(new Date());
    }
    if (next.status === 'Cloturee' && !next.decisionOn) {
      next.decisionOn = this.toIsoDate(new Date());
    }
    if (next.sanctionType === 'Radiation') {
      next.radiation = true;
    }

    const deduped = current.filter((item) => item.reference !== reference);
    deduped.push(next);
    this.writeLocalCases(deduped);
    return next;
  }

  private generateCaseReference(existing: DisciplineCase[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^DISC-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `DISC-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalCases(): DisciplineCase[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localCasesKey);
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
          const record = item as Partial<DisciplineCase>;
          const sanctionDuration = this.toPositiveInt(record.sanctionDurationDays);
          const sanctionType = this.normalizeOptionalText(record.sanctionType || record.sanction);
          return {
            reference: String(record.reference || '').trim(),
            agent: String(record.agent || '').trim(),
            direction: this.normalizeOptionalText(record.direction) || 'Direction inconnue',
            category: this.normalizeCategory(record.category),
            severity: this.normalizeSeverity(record.severity),
            infraction: String(record.infraction || '').trim(),
            incidentOn: this.normalizeOptionalText(record.incidentOn) || this.toIsoDate(new Date()),
            openedOn: String(record.openedOn || '').trim(),
            status: this.normalizeStatus(record.status),
            mediationRequired: !!record.mediationRequired,
            mediationStatus: this.normalizeMediationStatus(
              record.mediationStatus || (record.mediationRequired ? 'A planifier' : 'Non requise')
            ),
            confidentialLevel: this.normalizeConfidentiality(record.confidentialLevel),
            summary: this.normalizeOptionalText(record.summary) || 'Aucun resume renseigne.',
            decisionBy: this.normalizeOptionalText(record.decisionBy),
            decisionOn: this.normalizeOptionalText(record.decisionOn),
            sanctionType,
            sanctionDurationDays: sanctionDuration,
            sanctionStartOn: this.normalizeOptionalText(record.sanctionStartOn),
            sanctionEndOn: this.normalizeOptionalText(record.sanctionEndOn),
            radiation: !!record.radiation || sanctionType === 'Radiation',
            appealStatus: this.normalizeAppealStatus(record.appealStatus),
            createdAt: this.normalizeOptionalText(record.createdAt) || this.toIsoDate(new Date()),
            updatedAt: this.normalizeOptionalText(record.updatedAt) || this.toIsoDate(new Date()),
            sanction: this.buildSanctionLabel(sanctionType, sanctionDuration),
          } as DisciplineCase;
        })
        .filter((item) => this.isCompleteCase(item));
    } catch {
      return [];
    }
  }

  private writeLocalCases(items: DisciplineCase[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localCasesKey, JSON.stringify(items));
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

  private normalizeStatus(value: unknown): DisciplineCaseStatus {
    const normalized = this.sanitizeText(value);
    const found = DISCIPLINE_WORKFLOW_STEPS.find((status) => this.sanitizeText(status) === normalized);
    return found || 'Signale';
  }

  private normalizeSeverity(value: unknown): DisciplineSeverity {
    const normalized = this.sanitizeText(value);
    const found = DISCIPLINE_SEVERITY_OPTIONS.find((severity) => this.sanitizeText(severity) === normalized);
    return found || 'Moyen';
  }

  private normalizeCategory(value: unknown): DisciplineCategory {
    const normalized = this.sanitizeText(value);
    const found = DISCIPLINE_CATEGORY_OPTIONS.find((category) => this.sanitizeText(category) === normalized);
    return found || 'Autre';
  }

  private normalizeMediationStatus(value: unknown): DisciplineMediationStatus {
    const normalized = this.sanitizeText(value);
    const found = DISCIPLINE_MEDIATION_STATUS_OPTIONS.find(
      (status) => this.sanitizeText(status) === normalized
    );
    return found || 'Non requise';
  }

  private normalizeAppealStatus(value: unknown): DisciplineAppealStatus {
    const normalized = this.sanitizeText(value);
    const found = DISCIPLINE_APPEAL_STATUS_OPTIONS.find((status) => this.sanitizeText(status) === normalized);
    return found || 'Aucun';
  }

  private normalizeConfidentiality(value: unknown): DisciplineConfidentiality {
    const normalized = this.sanitizeText(value);
    const found = DISCIPLINE_CONFIDENTIALITY_OPTIONS.find((item) => this.sanitizeText(item) === normalized);
    return found || 'Normal';
  }

  private buildSanctionLabel(type: string | undefined, durationDays: number | undefined): string | undefined {
    const normalizedType = this.normalizeOptionalText(type);
    if (!normalizedType) {
      return undefined;
    }
    if (!durationDays) {
      return normalizedType;
    }
    return `${normalizedType} (${durationDays} jours)`;
  }

  private isCompleteCase(item: DisciplineCase): boolean {
    return !!item.reference && !!item.agent && !!item.infraction && !!item.openedOn;
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    const normalized = this.sanitizeText(value);
    return normalized === 'true' || normalized === '1' || normalized === 'oui';
  }

  private toPositiveInt(value: unknown): number | undefined {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }
    const rounded = Math.round(parsed);
    return rounded > 0 ? rounded : undefined;
  }

  private sanitizeText(value: unknown): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private toIsoDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private parseDate(value: string): number {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private addDays(from: Date, days: number): Date {
    const copy = new Date(from);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private pickUpdatedValue(current: string, patch: string | undefined): string {
    return this.normalizeOptionalText(patch) || current;
  }

  private pickUpdatedOptionalValue(current: string | undefined, patch: string | undefined): string | undefined {
    if (patch === undefined) return current;
    return this.normalizeOptionalText(patch);
  }

  private mergeInLocalStore(item: DisciplineCase): DisciplineCase {
    const current = this.readLocalCases();
    const deduped = current.filter((entry) => entry.reference !== item.reference);
    deduped.push(item);
    this.writeLocalCases(deduped);
    return item;
  }

  private createPlaceholderCase(reference: string): DisciplineCase {
    const today = this.toIsoDate(new Date());
    return {
      reference,
      agent: 'Agent non renseigne',
      direction: 'Direction inconnue',
      category: 'Autre',
      severity: 'Moyen',
      infraction: 'Infraction non renseignee',
      incidentOn: today,
      openedOn: today,
      status: 'Signale',
      mediationRequired: false,
      mediationStatus: 'Non requise',
      confidentialLevel: 'Normal',
      summary: 'Dossier genere localement en attente de qualification.',
      radiation: false,
      appealStatus: 'Aucun',
      createdAt: today,
      updatedAt: today,
    };
  }

  private recommendedSanction(severity: DisciplineSeverity, radiation: boolean): { type: string; durationDays?: number } {
    if (radiation || severity === 'Critique') {
      return { type: 'Radiation' };
    }
    if (severity === 'Eleve') {
      return { type: 'Mise a pied', durationDays: 7 };
    }
    if (severity === 'Moyen') {
      return { type: 'Blame', durationDays: 3 };
    }
    return { type: 'Avertissement' };
  }

  private seedLocalCasesIfNeeded(): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }

    const existing = this.readLocalCases();
    if (existing.length > 0) {
      return;
    }

    const year = new Date().getFullYear();
    const seeded: DisciplineCase[] = [
      {
        reference: `DISC-${year}-001`,
        agent: 'Mamadou Camara',
        direction: 'Ressources Humaines',
        category: 'Conflit interpersonnel',
        severity: 'Moyen',
        infraction: 'Conflit recurrent avec un chef de service sur la repartition des dossiers',
        incidentOn: `${year}-01-18`,
        openedOn: `${year}-01-20`,
        status: 'Mediation',
        mediationRequired: true,
        mediationStatus: 'En cours',
        confidentialLevel: 'Normal',
        summary: 'Dossier issu de trois signalements en moins de six semaines.',
        decisionBy: undefined,
        decisionOn: undefined,
        sanctionType: undefined,
        sanctionDurationDays: undefined,
        sanctionStartOn: undefined,
        sanctionEndOn: undefined,
        radiation: false,
        appealStatus: 'Aucun',
        createdAt: `${year}-01-20`,
        updatedAt: `${year}-02-03`,
        sanction: undefined,
      },
      {
        reference: `DISC-${year}-002`,
        agent: 'Aminata Diallo',
        direction: 'Finances',
        category: 'Absenteisme',
        severity: 'Faible',
        infraction: 'Retards repetes non justifies sur une periode de 30 jours',
        incidentOn: `${year}-02-02`,
        openedOn: `${year}-02-05`,
        status: 'Execution',
        mediationRequired: false,
        mediationStatus: 'Non requise',
        confidentialLevel: 'Normal',
        summary: 'Plan de suivi managerial en cours apres decision disciplinaire.',
        decisionBy: 'DRH',
        decisionOn: `${year}-02-18`,
        sanctionType: 'Avertissement',
        sanctionDurationDays: undefined,
        sanctionStartOn: `${year}-02-19`,
        sanctionEndOn: undefined,
        radiation: false,
        appealStatus: 'Aucun',
        createdAt: `${year}-02-05`,
        updatedAt: `${year}-03-01`,
        sanction: 'Avertissement',
      },
      {
        reference: `DISC-${year}-003`,
        agent: 'Ibrahima Keita',
        direction: 'Systemes d information',
        category: 'Atteinte documentaire',
        severity: 'Critique',
        infraction: 'Transmission non autorisee de documents internes sensibles',
        incidentOn: `${year}-01-25`,
        openedOn: `${year}-01-26`,
        status: 'Decision',
        mediationRequired: false,
        mediationStatus: 'Non requise',
        confidentialLevel: 'Restreint',
        summary: 'Dossier traite en coordination RH, Juridique et Autorite.',
        decisionBy: 'Secretaire general',
        decisionOn: `${year}-03-04`,
        sanctionType: 'Radiation',
        sanctionDurationDays: undefined,
        sanctionStartOn: `${year}-03-10`,
        sanctionEndOn: undefined,
        radiation: true,
        appealStatus: 'Depose',
        createdAt: `${year}-01-26`,
        updatedAt: `${year}-03-12`,
        sanction: 'Radiation',
      },
      {
        reference: `DISC-${year}-004`,
        agent: 'Fatoumata Traore',
        direction: 'Cabinet',
        category: 'Insubordination',
        severity: 'Eleve',
        infraction: 'Refus d instruction formelle lors d une mission officielle',
        incidentOn: `${year}-03-02`,
        openedOn: `${year}-03-03`,
        status: 'Commission',
        mediationRequired: true,
        mediationStatus: 'Echec',
        confidentialLevel: 'Sensible',
        summary: 'Mediation epuisee, passage en commission disciplinaire.',
        decisionBy: undefined,
        decisionOn: undefined,
        sanctionType: undefined,
        sanctionDurationDays: undefined,
        sanctionStartOn: undefined,
        sanctionEndOn: undefined,
        radiation: false,
        appealStatus: 'Aucun',
        createdAt: `${year}-03-03`,
        updatedAt: `${year}-03-11`,
        sanction: undefined,
      },
    ];

    this.writeLocalCases(seeded);
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
