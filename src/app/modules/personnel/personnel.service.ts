import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toStringValue } from '../../core/utils/dto.utils';
import { environment } from '../../../environments/environment';
import { summarizeDocumentCompliance } from './personnel-document-compliance';

export interface AgentListItem {
  id: string;
  matricule: string;
  fullName: string;
  direction: string;
  unit: string;
  position: string;
  status: string;
  manager: string;
  contractType: string;
  photoUrl: string;
  hireDate?: string;
  contractEndDate?: string;
  retirementDate?: string;
  documents?: AgentDocument[];
}

export interface AgentDuplicateIndexItem {
  id: string;
  fullName: string;
  matricule: string;
  email: string;
  identityNumber: string;
}

export type AgentDuplicateCaseField = 'email' | 'identityNumber' | 'fullName';

export interface AgentDuplicateCaseAgentSummary {
  id: string;
  matricule: string;
  fullName: string;
  direction: string;
  unit: string;
  position: string;
  status: string;
  manager: string;
  email: string;
  identityNumber: string;
  phone: string;
  contractType: string;
}

export interface AgentDuplicateCase {
  reference: string;
  duplicateField: AgentDuplicateCaseField;
  duplicateValue: string;
  confidenceScore: number;
  impactedCount: number;
  createdAt: string;
  agents: AgentDuplicateCaseAgentSummary[];
}

export type AgentMergeFieldSource = 'primary' | 'secondary';

export type AgentMergeField =
  | 'matricule'
  | 'fullName'
  | 'direction'
  | 'unit'
  | 'position'
  | 'status'
  | 'manager'
  | 'email'
  | 'phone'
  | 'identityNumber'
  | 'contractType';

export interface MergeDuplicateAgentsPayload {
  reference?: string;
  primaryAgentId: string;
  secondaryAgentId: string;
  fieldSources?: Partial<Record<AgentMergeField, AgentMergeFieldSource>>;
  reason?: string;
}

export interface MergeDuplicateAgentsResult {
  reference: string;
  mergedAt: string;
  mergedBy: string;
  primaryAgentId: string;
  secondaryAgentId: string;
  removedAgentId: string;
  keptAgentId: string;
  mergedAgent: AgentDetail;
  reassignedDossiers: number;
  reassignedAffectations: number;
}

export interface AgentMatriculeSuggestion {
  matricule: string;
  scopeLabel: string;
  basedOn: 'Direction+Unite' | 'Direction' | 'Global';
  nextNumber: number;
}

export interface PersonnelMatriculeSuggestionAuditItem {
  reference: string;
  createdAt: string;
  username: string;
  previousMatricule: string;
  suggestedMatricule: string;
  direction: string;
  unit: string;
  scopeLabel: string;
  basedOn: 'Direction+Unite' | 'Direction' | 'Global';
  reason: string;
}

export interface CreatePersonnelMatriculeSuggestionAuditPayload {
  reference?: string;
  createdAt?: string;
  username?: string;
  previousMatricule?: string;
  suggestedMatricule: string;
  direction?: string;
  unit?: string;
  scopeLabel?: string;
  basedOn?: 'Direction+Unite' | 'Direction' | 'Global';
  reason?: string;
}

export interface AgentCareerEvent {
  title: string;
  description: string;
  date: string;
}

export interface AgentDocument {
  type: string;
  reference: string;
  status: string;
  required?: boolean;
  expiresAt?: string;
  fileName?: string;
  fileDataUrl?: string;
}

export interface AgentEducation {
  degree: string;
  field: string;
  institution: string;
  graduationYear: string;
}

export interface AgentCompetency {
  id: string;
  label: string;
  category: string;
  level: 'Debutant' | 'Intermediaire' | 'Avance' | 'Expert';
  lastAssessedAt: string;
}

export interface AgentDependent {
  id: string;
  fullName: string;
  relationship: string;
  birthDate: string;
  coverageType: string;
  coverageStatus: 'Actif' | 'Suspendu' | 'Expire';
  phone: string;
}

export interface AgentIdentityInfo {
  identityType: string;
  identityNumber: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
}

export interface AgentAdministrativeInfo {
  hireDate: string;
  contractType: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface AgentDetail {
  id: string;
  matricule: string;
  fullName: string;
  direction: string;
  position: string;
  unit: string;
  status: string;
  manager: string;
  email: string;
  phone: string;
  photoUrl: string;
  identity: AgentIdentityInfo;
  administrative: AgentAdministrativeInfo;
  educations: AgentEducation[];
  competencies: AgentCompetency[];
  dependents: AgentDependent[];
  careerEvents: AgentCareerEvent[];
  documents: AgentDocument[];
}

export interface CreateAgentPayload {
  matricule?: string;
  fullName: string;
  direction: string;
  unit?: string;
  position: string;
  status: string;
  manager: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  identity?: Partial<AgentIdentityInfo>;
  administrative?: Partial<AgentAdministrativeInfo>;
  educations?: AgentEducation[];
  competencies?: AgentCompetency[];
  dependents?: AgentDependent[];
  documents?: AgentDocument[];
  isDraft?: boolean;
}

export interface UpdateAgentPayload {
  matricule?: string;
  fullName?: string;
  direction?: string;
  unit?: string;
  position?: string;
  status?: string;
  manager?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  identity?: Partial<AgentIdentityInfo>;
  administrative?: Partial<AgentAdministrativeInfo>;
  educations?: AgentEducation[];
  competencies?: AgentCompetency[];
  dependents?: AgentDependent[];
  careerEvents?: AgentCareerEvent[];
  documents?: AgentDocument[];
  auditReason?: string;
}

export interface AgentAuditFieldChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

export interface AgentAuditEvent {
  reference: string;
  agentId: string;
  agentLabel: string;
  changedAt: string;
  changedBy: string;
  source: 'update' | 'merge' | 'system';
  reason: string;
  changes: AgentAuditFieldChange[];
}

export type AgentDocumentComplianceStatusApi =
  | 'COMPLIANT'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'MISSING'
  | 'PENDING_VALIDATION';

export interface AgentDocumentComplianceItemApi {
  documentTypeCode: string;
  documentTypeLabel: string;
  requirementScope: string;
  complianceStatus: AgentDocumentComplianceStatusApi;
  documentReference: string;
  expiresOn: string;
  dueOn: string;
}

export interface AgentDocumentComplianceSummaryApi {
  employeeId: string;
  summary: {
    requiredCount: number;
    compliantCount: number;
    missingCount: number;
    expiredCount: number;
    expiringSoonCount: number;
  };
  items: AgentDocumentComplianceItemApi[];
}

export interface PersonnelUploadedFile {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface AgentDigitalBadge {
  agentId: string;
  badgeId: string;
  issuedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  verificationCode: string;
  signatureHash: string;
  qrPayload: string;
}

export type PersonnelTurnoverRiskLevel = 'Faible' | 'Modere' | 'Eleve' | 'Critique';

export interface PersonnelTurnoverRiskItem {
  agentId: string;
  matricule: string;
  fullName: string;
  direction: string;
  unit: string;
  position: string;
  riskScore: number;
  riskLevel: PersonnelTurnoverRiskLevel;
  factors: string[];
  recommendedAction: string;
  modelName: string;
  generatedAt: string;
  reviewedAt: string;
  reviewDecision: string;
}

export interface AgentListQuery extends CollectionQueryOptions {
  direction?: string;
  status?: string;
  unit?: string;
  manager?: string;
  position?: string;
  contractType?: string;
}

export interface PersonnelDossier {
  reference: string;
  agentId: string;
  agent: string;
  type: string;
  status: string;
  updatedAt: string;
}

export interface CreatePersonnelDossierPayload {
  reference?: string;
  agentId?: string;
  agent: string;
  type: string;
  status?: string;
  updatedAt?: string;
}

export interface PersonnelAffectation {
  reference: string;
  agentId: string;
  agent: string;
  fromUnit: string;
  toUnit: string;
  effectiveDate: string;
  status: string;
}

export interface CreatePersonnelAffectationPayload {
  reference?: string;
  agentId?: string;
  agent: string;
  fromUnit: string;
  toUnit: string;
  effectiveDate: string;
  status?: string;
}

export interface PersonnelDossiersQuery extends CollectionQueryOptions {
  status?: string;
  type?: string;
  agent?: string;
  agentId?: string;
}

export interface PersonnelAffectationsQuery extends CollectionQueryOptions {
  status?: string;
  agent?: string;
  agentId?: string;
  fromUnit?: string;
  toUnit?: string;
}

export interface PersonnelMatriculeSuggestionAuditQuery extends CollectionQueryOptions {
  username?: string;
  reason?: string;
}

export interface PersonnelTurnoverRiskQuery extends CollectionQueryOptions {
  direction?: string;
  unit?: string;
  riskLevel?: PersonnelTurnoverRiskLevel | string;
  minScore?: number;
}

export interface AgentDuplicateCasesQuery extends CollectionQueryOptions {
  duplicateField?: AgentDuplicateCaseField;
  minCount?: number;
}

export interface AgentAuditTrailQuery extends CollectionQueryOptions {
  changedBy?: string;
  source?: 'update' | 'merge' | 'system';
  field?: string;
}

interface AgentListItemDto {
  id?: string;
  matricule?: string;
  employeeId?: string;
  employee_id?: string;
  fullName?: string;
  full_name?: string;
  direction?: string;
  directionName?: string;
  direction_name?: string;
  unit?: string;
  unitName?: string;
  unit_name?: string;
  position?: string;
  positionTitle?: string;
  position_title?: string;
  status?: string;
  manager?: string;
  managerName?: string;
  manager_name?: string;
  contractType?: string;
  contract_type?: string;
  photoUrl?: string;
  photo_url?: string;
  hireDate?: string;
  hire_date?: string;
  contractEndDate?: string;
  contract_end_date?: string;
  retirementDate?: string;
  retirement_date?: string;
  documents?: AgentDocumentDto[];
}

interface AgentDuplicateIndexItemDto {
  id?: string;
  fullName?: string;
  full_name?: string;
  matricule?: string;
  email?: string;
  identityNumber?: string;
  identity_number?: string;
}

interface AgentDuplicateCaseAgentSummaryDto {
  id?: string;
  matricule?: string;
  fullName?: string;
  full_name?: string;
  direction?: string;
  unit?: string;
  position?: string;
  status?: string;
  manager?: string;
  email?: string;
  identityNumber?: string;
  identity_number?: string;
  phone?: string;
  contractType?: string;
  contract_type?: string;
}

interface AgentDuplicateCaseDto {
  reference?: string;
  duplicateField?: string;
  duplicate_field?: string;
  duplicateValue?: string;
  duplicate_value?: string;
  confidenceScore?: number;
  confidence_score?: number;
  impactedCount?: number;
  impacted_count?: number;
  createdAt?: string;
  created_at?: string;
  agents?: AgentDuplicateCaseAgentSummaryDto[];
}

interface MergeDuplicateAgentsResultDto {
  reference?: string;
  mergedAt?: string;
  merged_at?: string;
  mergedBy?: string;
  merged_by?: string;
  primaryAgentId?: string;
  primary_agent_id?: string;
  secondaryAgentId?: string;
  secondary_agent_id?: string;
  removedAgentId?: string;
  removed_agent_id?: string;
  keptAgentId?: string;
  kept_agent_id?: string;
  mergedAgent?: AgentDetailDto;
  merged_agent?: AgentDetailDto;
  reassignedDossiers?: number;
  reassigned_dossiers?: number;
  reassignedAffectations?: number;
  reassigned_affectations?: number;
}

interface AgentMatriculeSuggestionDto {
  matricule?: string;
  scopeLabel?: string;
  scope_label?: string;
  basedOn?: string;
  based_on?: string;
  nextNumber?: number;
  next_number?: number;
}

interface PersonnelMatriculeSuggestionAuditItemDto {
  reference?: string;
  createdAt?: string;
  created_at?: string;
  username?: string;
  previousMatricule?: string;
  previous_matricule?: string;
  suggestedMatricule?: string;
  suggested_matricule?: string;
  direction?: string;
  unit?: string;
  scopeLabel?: string;
  scope_label?: string;
  basedOn?: string;
  based_on?: string;
  reason?: string;
}

interface AgentAuditFieldChangeDto {
  field?: string;
  label?: string;
  before?: string;
  after?: string;
}

interface AgentAuditEventDto {
  reference?: string;
  agentId?: string;
  agent_id?: string;
  agentLabel?: string;
  agent_label?: string;
  changedAt?: string;
  changed_at?: string;
  changedBy?: string;
  changed_by?: string;
  source?: string;
  reason?: string;
  changes?: AgentAuditFieldChangeDto[];
}

interface AgentDocumentComplianceItemDto {
  documentTypeCode?: string;
  document_type_code?: string;
  documentTypeLabel?: string;
  document_type_label?: string;
  requirementScope?: string;
  requirement_scope?: string;
  complianceStatus?: string;
  compliance_status?: string;
  documentReference?: string;
  document_reference?: string;
  expiresOn?: string;
  expires_on?: string;
  dueOn?: string;
  due_on?: string;
}

interface AgentDocumentComplianceSummaryDto {
  employeeId?: string;
  employee_id?: string;
  summary?: Record<string, unknown>;
  items?: AgentDocumentComplianceItemDto[];
}

interface AgentCareerEventDto {
  title?: string;
  label?: string;
  description?: string;
  detail?: string;
  date?: string;
  eventDate?: string;
  event_date?: string;
}

interface AgentDocumentDto {
  type?: string;
  category?: string;
  reference?: string;
  ref?: string;
  status?: string;
  required?: boolean;
  expiresAt?: string;
  expires_at?: string;
  expirationDate?: string;
  expiration_date?: string;
  fileName?: string;
  file_name?: string;
  fileDataUrl?: string;
  file_data_url?: string;
  dataUrl?: string;
  data_url?: string;
  url?: string;
}

interface AgentCompetencyDto {
  id?: string;
  label?: string;
  name?: string;
  category?: string;
  level?: string;
  lastAssessedAt?: string;
  last_assessed_at?: string;
}

interface AgentDependentDto {
  id?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  relationship?: string;
  lien?: string;
  birthDate?: string;
  birth_date?: string;
  coverageType?: string;
  coverage_type?: string;
  coverageStatus?: string;
  coverage_status?: string;
  phone?: string;
}

interface AgentDigitalBadgeDto {
  agentId?: string;
  agent_id?: string;
  badgeId?: string;
  badge_id?: string;
  issuedAt?: string;
  issued_at?: string;
  expiresAt?: string;
  expires_at?: string;
  status?: string;
  verificationCode?: string;
  verification_code?: string;
  signatureHash?: string;
  signature_hash?: string;
  qrPayload?: string;
  qr_payload?: string;
}

interface PersonnelTurnoverRiskItemDto {
  agentId?: string;
  agent_id?: string;
  matricule?: string;
  fullName?: string;
  full_name?: string;
  direction?: string;
  unit?: string;
  position?: string;
  riskScore?: number;
  risk_score?: number;
  riskLevel?: string;
  risk_level?: string;
  factors?: unknown;
  recommendedAction?: string;
  recommended_action?: string;
  modelName?: string;
  model_name?: string;
  generatedAt?: string;
  generated_at?: string;
  reviewedAt?: string;
  reviewed_at?: string;
  reviewDecision?: string;
  review_decision?: string;
}

interface AgentDetailDto {
  id?: string;
  matricule?: string;
  employeeId?: string;
  employee_id?: string;
  fullName?: string;
  full_name?: string;
  position?: string;
  positionTitle?: string;
  position_title?: string;
  unit?: string;
  unitName?: string;
  unit_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  direction?: string;
  directionName?: string;
  direction_name?: string;
  status?: string;
  manager?: string;
  managerName?: string;
  manager_name?: string;
  photoUrl?: string;
  photo_url?: string;
  identity?: Partial<AgentIdentityInfo>;
  administrative?: Partial<AgentAdministrativeInfo>;
  educations?: Partial<AgentEducation>[];
  educationHistory?: Partial<AgentEducation>[];
  education_history?: Partial<AgentEducation>[];
  competencies?: AgentCompetencyDto[];
  skills?: AgentCompetencyDto[];
  dependents?: AgentDependentDto[];
  beneficiaries?: AgentDependentDto[];
  careerEvents?: AgentCareerEventDto[];
  career_events?: AgentCareerEventDto[];
  documents?: AgentDocumentDto[];
}

interface PersonnelDossierDto {
  reference?: string;
  dossierRef?: string;
  dossier_ref?: string;
  agentId?: string;
  agent_id?: string;
  agent?: string;
  agentName?: string;
  agent_name?: string;
  type?: string;
  dossierType?: string;
  dossier_type?: string;
  status?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface PersonnelAffectationDto {
  reference?: string;
  assignmentRef?: string;
  assignment_ref?: string;
  agentId?: string;
  agent_id?: string;
  agent?: string;
  agentName?: string;
  agent_name?: string;
  fromUnit?: string;
  from_unit?: string;
  toUnit?: string;
  to_unit?: string;
  effectiveDate?: string;
  effective_date?: string;
  status?: string;
}

interface LocalAgentRecord extends AgentDetail {
  direction: string;
  status: string;
  manager: string;
}

const AGENT_MERGE_FIELDS: readonly AgentMergeField[] = [
  'matricule',
  'fullName',
  'direction',
  'unit',
  'position',
  'status',
  'manager',
  'email',
  'phone',
  'identityNumber',
  'contractType',
];

const AGENT_DUPLICATE_FIELD_CONFIDENCE: Record<AgentDuplicateCaseField, number> = {
  email: 96,
  identityNumber: 99,
  fullName: 72,
};

const AGENT_AUDIT_FIELD_CONFIG: Array<{
  field: string;
  label: string;
  read: (record: LocalAgentRecord) => string;
}> = [
  { field: 'matricule', label: 'Matricule', read: (record) => String(record.matricule || '').trim() },
  { field: 'fullName', label: 'Nom complet', read: (record) => String(record.fullName || '').trim() },
  { field: 'direction', label: 'Direction', read: (record) => String(record.direction || '').trim() },
  { field: 'unit', label: 'Unite', read: (record) => String(record.unit || '').trim() },
  { field: 'position', label: 'Poste', read: (record) => String(record.position || '').trim() },
  { field: 'status', label: 'Statut', read: (record) => String(record.status || '').trim() },
  { field: 'manager', label: 'Manager', read: (record) => String(record.manager || '').trim() },
  { field: 'email', label: 'Email', read: (record) => String(record.email || '').trim() },
  { field: 'phone', label: 'Telephone', read: (record) => String(record.phone || '').trim() },
  {
    field: 'identityNumber',
    label: "Numero piece d'identite",
    read: (record) => String(record.identity?.identityNumber || '').trim(),
  },
  {
    field: 'contractType',
    label: 'Type contrat',
    read: (record) => String(record.administrative?.contractType || '').trim(),
  },
  {
    field: 'competencies',
    label: 'Competences',
    read: (record) => normalizeCompetencies(record.competencies).map((item) => item.label).join(', '),
  },
  {
    field: 'dependents',
    label: 'Ayants droit',
    read: (record) => normalizeDependents(record.dependents).map((item) => item.fullName).join(', '),
  },
];

@Injectable({ providedIn: 'root' })
export class PersonnelService {
  private readonly localStorageKey = 'rh_dev_agents';
  private readonly localDossiersKey = 'rh_dev_personnel_dossiers';
  private readonly localAffectationsKey = 'rh_dev_personnel_affectations';
  private readonly localMatriculeAuditKey = 'rh_dev_personnel_matricule_audit';
  private readonly localAgentAuditKey = 'rh_dev_personnel_agent_audit';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly http = inject(HttpClient);
  private readonly apiClient = inject(ApiClientService);

  getAgents(query?: AgentListQuery): Observable<AgentListItem[]> {
    const params = buildCollectionQueryParams(query, {
      direction: query?.direction,
      status: query?.status,
      unit: query?.unit,
      manager: query?.manager,
      position: query?.position,
      contractType: query?.contractType,
    });

    return this.apiClient
      .get<unknown>(
        API_ENDPOINTS.personnel.agents,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((payload) => normalizeAgentListPayload(payload)),
        map((items) => this.mergeWithLocalFallback(mapAgentListDtos(items), this.readLocalAgentList())),
        map((items) => this.applyLocalAgentQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalAgentQuery(this.readLocalAgentList(), query));
          }
          return throwError(() => error);
        })
      );
  }

  getAgentDuplicateIndex(): Observable<AgentDuplicateIndexItem[]> {
    return this.apiClient
      .get<unknown>(
        API_ENDPOINTS.personnel.agentDuplicateIndex,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((payload) => normalizeAgentDuplicateIndexPayload(payload)),
        map((items) => this.mergeDuplicateIndex(items, this.readLocalDuplicateIndex())),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.readLocalDuplicateIndex());
          }
          return throwError(() => error);
        })
      );
  }

  getAgentDuplicateCases(query?: AgentDuplicateCasesQuery): Observable<AgentDuplicateCase[]> {
    const params = buildCollectionQueryParams(query, {
      duplicateField: query?.duplicateField,
      minCount: query?.minCount,
    });

    return this.apiClient
      .get<unknown>(
        API_ENDPOINTS.personnel.agentDuplicateCases,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((payload) => normalizeAgentDuplicateCasesPayload(payload)),
        map((items) => this.mergeDuplicateCases(items, this.buildLocalDuplicateCases(this.readLocalAgentRecords()))),
        map((items) => this.applyLocalDuplicateCasesQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            const localCases = this.buildLocalDuplicateCases(this.readLocalAgentRecords());
            return of(this.applyLocalDuplicateCasesQuery(localCases, query));
          }
          return throwError(() => error);
        })
      );
  }

  mergeDuplicateAgents(payload: MergeDuplicateAgentsPayload): Observable<MergeDuplicateAgentsResult> {
    const normalizedPayload = this.normalizeMergeDuplicatePayload(payload);
    return this.apiClient
      .post<MergeDuplicateAgentsResultDto, MergeDuplicateAgentsPayload>(
        API_ENDPOINTS.personnel.agentMerge,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeMergeDuplicateResult(dto, normalizedPayload)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.mergeLocalDuplicateAgents(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getAgentMatriculeSuggestion(input?: {
    direction?: string;
    unit?: string;
  }): Observable<AgentMatriculeSuggestion> {
    return this.apiClient
      .get<unknown>(
        API_ENDPOINTS.personnel.agentMatriculeSuggestion,
        {
          direction: this.normalizeOptionalText(input?.direction),
          unit: this.normalizeOptionalText(input?.unit),
        },
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((payload) => normalizeAgentMatriculeSuggestionPayload(payload)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.buildLocalMatriculeSuggestion(input));
          }
          return throwError(() => error);
        })
      );
  }

  getMatriculeSuggestionAudit(
    query?: PersonnelMatriculeSuggestionAuditQuery
  ): Observable<PersonnelMatriculeSuggestionAuditItem[]> {
    const params = buildCollectionQueryParams(query, {
      username: query?.username,
      reason: query?.reason,
    });

    return this.apiClient
      .get<PersonnelMatriculeSuggestionAuditItemDto[]>(
        API_ENDPOINTS.personnel.agentMatriculeSuggestionAudit,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapMatriculeAudit(items)),
        map((items) => this.mergeByKey(items, this.readLocalMatriculeAudit(), (item) => item.reference)),
        map((items) => this.applyLocalMatriculeAuditQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalMatriculeAuditQuery(this.readLocalMatriculeAudit(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createMatriculeSuggestionAudit(
    payload: CreatePersonnelMatriculeSuggestionAuditPayload
  ): Observable<PersonnelMatriculeSuggestionAuditItem> {
    const normalizedPayload = this.normalizeCreateMatriculeAuditPayload(payload);
    return this.apiClient
      .post<PersonnelMatriculeSuggestionAuditItemDto, CreatePersonnelMatriculeSuggestionAuditPayload>(
        API_ENDPOINTS.personnel.agentMatriculeSuggestionAudit,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeMatriculeAudit(dto)),
        map((item) => {
          if (item.reference && item.suggestedMatricule && item.createdAt) {
            return item;
          }
          return this.appendLocalMatriculeAudit(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalMatriculeAudit(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getAgentById(id: string): Observable<AgentDetail | null> {
    return this.apiClient
      .get<AgentDetailDto>(
        API_ENDPOINTS.personnel.agentDetail(id),
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => mapAgentDetailDto(dto, id)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            const localAgent = this.readLocalAgentRecords().find((agent) => agent.id === id);
            return of(localAgent ? this.toDetail(localAgent) : null);
          }
          return of(null);
        })
      );
  }

  getAgentAuditTrail(
    agentId: string,
    query?: AgentAuditTrailQuery
  ): Observable<AgentAuditEvent[]> {
    const params = buildCollectionQueryParams(query, {
      changedBy: query?.changedBy,
      source: query?.source,
      field: query?.field,
    });

    return this.apiClient
      .get<unknown>(
        API_ENDPOINTS.personnel.agentAuditTrail(agentId),
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((payload) => normalizeAgentAuditTrailPayload(payload)),
        map((items) => this.mergeByKey(items, this.readLocalAgentAudit(agentId), (item) => item.reference)),
        map((items) => this.applyLocalAgentAuditQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalAgentAuditQuery(this.readLocalAgentAudit(agentId), query));
          }
          return throwError(() => error);
        })
      );
  }

  getAgentDocumentCompliance(agentId: string): Observable<AgentDocumentComplianceSummaryApi> {
    return this.apiClient
      .get<AgentDocumentComplianceSummaryDto>(
        API_ENDPOINTS.personnel.agentDocumentCompliance(agentId),
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((payload) => normalizeAgentDocumentComplianceApiPayload(payload, agentId)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            const localAgent = this.readLocalAgentRecords().find((agent) => agent.id === agentId);
            return of(this.buildLocalAgentDocumentCompliance(localAgent, agentId));
          }
          return throwError(() => error);
        })
      );
  }

  private buildLocalAgentDocumentCompliance(
    agent: LocalAgentRecord | undefined,
    fallbackAgentId: string
  ): AgentDocumentComplianceSummaryApi {
    if (!agent) {
      return {
        employeeId: String(fallbackAgentId || '').trim(),
        summary: {
          requiredCount: 0,
          compliantCount: 0,
          missingCount: 0,
          expiredCount: 0,
          expiringSoonCount: 0,
        },
        items: [],
      };
    }

    const compliance = summarizeDocumentCompliance(
      mapAgentDocuments(agent.documents || []),
      toStringValue(agent.administrative?.contractType, '')
    );
    const hireDate = toStringValue(agent.administrative?.hireDate, '').trim();
    const dueOnFromHireDate = (() => {
      if (!hireDate) {
        return '';
      }
      const parsed = Date.parse(hireDate);
      if (Number.isNaN(parsed)) {
        return hireDate;
      }
      const dueDate = new Date(parsed);
      dueDate.setUTCDate(dueDate.getUTCDate() + 7);
      return dueDate.toISOString().slice(0, 10);
    })();

    return {
      employeeId: String(agent.id || fallbackAgentId || '').trim(),
      summary: {
        requiredCount: compliance.requiredCount,
        compliantCount: compliance.compliantCount,
        missingCount: compliance.missingCount,
        expiredCount: compliance.expiredCount,
        expiringSoonCount: compliance.expiringSoonCount,
      },
      items: compliance.items.map((item) => {
        const expiresOn = toStringValue(item.document?.expiresAt, '').trim();
        return {
          documentTypeCode: this.buildComplianceDocumentTypeCode(item.type),
          documentTypeLabel: String(item.label || item.type || '').trim(),
          requirementScope: 'LOCAL_FALLBACK',
          complianceStatus: this.mapLocalComplianceStatus(item.status),
          documentReference: toStringValue(item.document?.reference, '').trim(),
          expiresOn,
          dueOn: expiresOn || dueOnFromHireDate,
        };
      }),
    };
  }

  private mapLocalComplianceStatus(
    status: 'conforme' | 'a_renouveler' | 'expire' | 'manquant'
  ): AgentDocumentComplianceStatusApi {
    switch (status) {
      case 'a_renouveler':
        return 'EXPIRING_SOON';
      case 'expire':
        return 'EXPIRED';
      case 'manquant':
        return 'MISSING';
      case 'conforme':
      default:
        return 'COMPLIANT';
    }
  }

  private buildComplianceDocumentTypeCode(value: string): string {
    const normalized = this.normalizeTextForMatch(value);
    if (normalized.includes('piece') && normalized.includes('identite')) {
      return 'PIECE_IDENTITE';
    }
    if (normalized === 'cv') {
      return 'CV';
    }
    if (normalized.includes('diplome')) {
      return 'DIPLOME_PRINCIPAL';
    }
    if (normalized.includes('nomination')) {
      return 'ARRETE_NOMINATION';
    }
    if (normalized.includes('contrat')) {
      return 'CONTRAT_TRAVAIL';
    }

    return (
      String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_') || 'DOCUMENT'
    );
  }

  createAgent(payload: CreateAgentPayload): Observable<AgentDetail> {
    return this.apiClient
      .post<AgentDetailDto, CreateAgentPayload>(
        API_ENDPOINTS.personnel.agents,
        payload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => mapAgentDetailDto(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            const localRecord = this.appendLocalAgent(payload);
            return of(this.toDetail(localRecord));
          }
          return throwError(() => error);
        })
      );
  }

  updateAgent(id: string, payload: UpdateAgentPayload): Observable<AgentDetail> {
    return this.apiClient
      .put<AgentDetailDto, UpdateAgentPayload>(
        API_ENDPOINTS.personnel.agentDetail(id),
        payload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => mapAgentDetailDto(dto, id)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            const localRecord = this.updateLocalAgent(id, payload);
            if (localRecord) {
              return of(this.toDetail(localRecord));
            }
          }
          return throwError(() => error);
        })
      );
  }

  getAgentDigitalBadge(id: string): Observable<AgentDigitalBadge> {
    return this.apiClient
      .get<AgentDigitalBadgeDto>(
        API_ENDPOINTS.personnel.agentDigitalBadge(id),
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((payload) => normalizeAgentDigitalBadgePayload(payload, id)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            const agent = this.readLocalAgentRecords().find((record) => record.id === id);
            return of(this.buildLocalDigitalBadge(agent, id));
          }
          return throwError(() => error);
        })
      );
  }

  exportAgentDossierPdf(id: string): Observable<Blob> {
    return this.http.get(this.buildApiUrl(API_ENDPOINTS.personnel.agentDossierExport(id)), {
      responseType: 'blob',
    });
  }

  uploadAgentFile(file: File): Observable<PersonnelUploadedFile> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.apiClient.post<PersonnelUploadedFile, FormData>(API_ENDPOINTS.personnel.upload, formData);
  }

  downloadAgentFile(url: string): Observable<Blob> {
    const normalized = String(url || '').trim();
    if (!normalized || normalized.startsWith('blob:')) {
      return throwError(() => new Error('URL de téléchargement invalide'));
    }

    const requestUrl = /^https?:\/\//i.test(normalized) ? normalized : normalized.startsWith('/') ? normalized : `/${normalized}`;
    return this.http.get(requestUrl, { responseType: 'blob' });
  }

  getTurnoverRisks(query?: PersonnelTurnoverRiskQuery): Observable<PersonnelTurnoverRiskItem[]> {
    const params = buildCollectionQueryParams(query, {
      direction: query?.direction,
      unit: query?.unit,
      riskLevel: query?.riskLevel,
      minScore: query?.minScore,
    });

    return this.apiClient
      .get<unknown>(
        API_ENDPOINTS.personnel.turnoverRisk,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((payload) => normalizeTurnoverRiskPayload(payload)),
        map((items) => items.map((dto) => this.normalizeTurnoverRiskItem(dto)).filter((item) => !!item.agentId)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of([]);
          }
          return throwError(() => error);
        })
      );
  }

  getDossiers(query?: PersonnelDossiersQuery): Observable<PersonnelDossier[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      type: query?.type,
      agent: query?.agent,
      agentId: query?.agentId,
    });

    return this.apiClient
      .get<PersonnelDossierDto[]>(
        API_ENDPOINTS.personnel.dossiers,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapDossiers(items)),
        map((items) => this.mergeByKey(items, this.readLocalDossiers(), (item) => item.reference)),
        map((items) => this.applyLocalDossiersQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalDossiersQuery(this.readLocalDossiers(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createDossier(payload: CreatePersonnelDossierPayload): Observable<PersonnelDossier> {
    const normalizedPayload = this.normalizeCreateDossierPayload(payload);

    return this.apiClient
      .post<PersonnelDossierDto, CreatePersonnelDossierPayload>(
        API_ENDPOINTS.personnel.dossiers,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeDossier(dto)),
        map((item) => {
          if (item.reference && item.agent && item.type && item.updatedAt) {
            return item;
          }
          return this.appendLocalDossier(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalDossier(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getAffectations(query?: PersonnelAffectationsQuery): Observable<PersonnelAffectation[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      agent: query?.agent,
      agentId: query?.agentId,
      fromUnit: query?.fromUnit,
      toUnit: query?.toUnit,
    });

    return this.apiClient
      .get<PersonnelAffectationDto[]>(
        API_ENDPOINTS.personnel.affectations,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapAffectations(items)),
        map((items) => this.mergeByKey(items, this.readLocalAffectations(), (item) => item.reference)),
        map((items) => this.applyLocalAffectationsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalAffectationsQuery(this.readLocalAffectations(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createAffectation(payload: CreatePersonnelAffectationPayload): Observable<PersonnelAffectation> {
    const normalizedPayload = this.normalizeCreateAffectationPayload(payload);

    return this.apiClient
      .post<PersonnelAffectationDto, CreatePersonnelAffectationPayload>(
        API_ENDPOINTS.personnel.affectations,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeAffectation(dto)),
        map((item) => {
          if (item.reference && item.agent && item.fromUnit && item.toUnit && item.effectiveDate) {
            return item;
          }
          return this.appendLocalAffectation(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalAffectation(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  private normalizeTurnoverRiskItem(dto: PersonnelTurnoverRiskItemDto): PersonnelTurnoverRiskItem {
    const rawScore = Number(readField(dto, ['riskScore', 'risk_score'], 0));
    const riskScore = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0;
    return {
      agentId: toStringValue(readField(dto, ['agentId', 'agent_id'], '')).trim(),
      matricule: toStringValue(readField(dto, ['matricule'], '')).trim(),
      fullName: toStringValue(readField(dto, ['fullName', 'full_name'], '')).trim(),
      direction: toStringValue(readField(dto, ['direction'], '')).trim(),
      unit: toStringValue(readField(dto, ['unit'], '')).trim(),
      position: toStringValue(readField(dto, ['position'], '')).trim(),
      riskScore,
      riskLevel: this.normalizeTurnoverRiskLevel(readField(dto, ['riskLevel', 'risk_level'], 'Faible')),
      factors: this.normalizeStringArray(readField(dto, ['factors'], [])),
      recommendedAction: toStringValue(readField(dto, ['recommendedAction', 'recommended_action'], '')).trim(),
      modelName: toStringValue(readField(dto, ['modelName', 'model_name'], 'rules-v1')).trim() || 'rules-v1',
      generatedAt: toStringValue(readField(dto, ['generatedAt', 'generated_at'], '')).trim(),
      reviewedAt: toStringValue(readField(dto, ['reviewedAt', 'reviewed_at'], '')).trim(),
      reviewDecision: toStringValue(readField(dto, ['reviewDecision', 'review_decision'], '')).trim(),
    };
  }

  private normalizeTurnoverRiskLevel(value: unknown): PersonnelTurnoverRiskLevel {
    const normalized = this.normalizeTextForMatch(String(value || ''));
    if (normalized === 'critique') return 'Critique';
    if (normalized === 'eleve' || normalized === 'elevee') return 'Eleve';
    if (normalized === 'modere' || normalized === 'moyen') return 'Modere';
    return 'Faible';
  }

  private normalizeStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry || '').trim()).filter((entry) => entry.length > 0);
    }

    if (typeof value === 'string') {
      const raw = value.trim();
      if (!raw) {
        return [];
      }
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((entry) => String(entry || '').trim()).filter((entry) => entry.length > 0);
        }
      } catch {
        // Les exports CSV ou certains adaptateurs peuvent renvoyer une chaine simple.
      }
      return raw
        .split(/[|,;]/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }

    return [];
  }

  private mapMatriculeAudit(
    items: PersonnelMatriculeSuggestionAuditItemDto[]
  ): PersonnelMatriculeSuggestionAuditItem[] {
    return (items || [])
      .map((dto) => this.normalizeMatriculeAudit(dto))
      .filter((item) => !!item.reference && !!item.suggestedMatricule && !!item.createdAt);
  }

  private normalizeMatriculeAudit(
    dto: PersonnelMatriculeSuggestionAuditItemDto
  ): PersonnelMatriculeSuggestionAuditItem {
    const basedOnRaw = toStringValue(readField(dto, ['basedOn', 'based_on'], 'Global')).trim();
    const basedOn: PersonnelMatriculeSuggestionAuditItem['basedOn'] =
      basedOnRaw === 'Direction+Unite' || basedOnRaw === 'Direction' ? basedOnRaw : 'Global';
    return {
      reference: toStringValue(readField(dto, ['reference'], '')).trim(),
      createdAt: toStringValue(readField(dto, ['createdAt', 'created_at'], '')).trim(),
      username: toStringValue(readField(dto, ['username'], '')).trim(),
      previousMatricule: toStringValue(readField(dto, ['previousMatricule', 'previous_matricule'], '')).trim(),
      suggestedMatricule: toStringValue(readField(dto, ['suggestedMatricule', 'suggested_matricule'], '')).trim(),
      direction: toStringValue(readField(dto, ['direction'], '')).trim(),
      unit: toStringValue(readField(dto, ['unit'], '')).trim(),
      scopeLabel: toStringValue(readField(dto, ['scopeLabel', 'scope_label'], 'Global')).trim() || 'Global',
      basedOn,
      reason: toStringValue(readField(dto, ['reason'], 'generation')).trim() || 'generation',
    };
  }

  private normalizeCreateMatriculeAuditPayload(
    payload: CreatePersonnelMatriculeSuggestionAuditPayload
  ): CreatePersonnelMatriculeSuggestionAuditPayload {
    const basedOn = payload.basedOn === 'Direction+Unite' || payload.basedOn === 'Direction'
      ? payload.basedOn
      : 'Global';
    const createdAtRaw = String(payload.createdAt || '').trim();
    const createdAtParsed = Date.parse(createdAtRaw);
    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      createdAt: !createdAtRaw
        ? new Date().toISOString()
        : Number.isNaN(createdAtParsed)
          ? createdAtRaw
          : new Date(createdAtParsed).toISOString(),
      username: this.normalizeOptionalText(payload.username) || 'system',
      previousMatricule: this.normalizeOptionalText(payload.previousMatricule) || '',
      suggestedMatricule: String(payload.suggestedMatricule || '').trim(),
      direction: this.normalizeOptionalText(payload.direction) || '',
      unit: this.normalizeOptionalText(payload.unit) || '',
      scopeLabel: this.normalizeOptionalText(payload.scopeLabel) || 'Global',
      basedOn,
      reason: this.normalizeOptionalText(payload.reason) || 'generation',
    };
  }

  private applyLocalMatriculeAuditQuery(
    items: PersonnelMatriculeSuggestionAuditItem[],
    query?: PersonnelMatriculeSuggestionAuditQuery
  ): PersonnelMatriculeSuggestionAuditItem[] {
    let next = [...items];
    const username = (query?.username || '').trim().toLowerCase();
    const reason = (query?.reason || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (username) {
      next = next.filter((item) => item.username.toLowerCase().includes(username));
    }
    if (reason) {
      next = next.filter((item) => item.reason.toLowerCase().includes(reason));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.username.toLowerCase().includes(search) ||
          item.previousMatricule.toLowerCase().includes(search) ||
          item.suggestedMatricule.toLowerCase().includes(search) ||
          item.scopeLabel.toLowerCase().includes(search) ||
          item.reason.toLowerCase().includes(search) ||
          item.createdAt.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'createdAt').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readMatriculeAuditField(left, sortBy).toLowerCase();
      const rightValue = this.readMatriculeAuditField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toPositiveInt(query?.limit, 200);
    const page = this.toPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readMatriculeAuditField(
    item: PersonnelMatriculeSuggestionAuditItem,
    field: string
  ): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'username':
        return item.username;
      case 'reason':
        return item.reason;
      case 'suggestedMatricule':
        return item.suggestedMatricule;
      case 'createdAt':
      default:
        return item.createdAt;
    }
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

  private mergeWithLocalFallback(apiItems: AgentListItem[], localItems: AgentListItem[]): AgentListItem[] {
    if (!this.fallbackEnabled) {
      return apiItems;
    }

    const byId = new Map<string, AgentListItem>();
    apiItems.forEach((item) => byId.set(item.id, item));
    localItems.forEach((item) => byId.set(item.id, item));
    return Array.from(byId.values());
  }

  private mergeDuplicateIndex(
    apiItems: AgentDuplicateIndexItem[],
    localItems: AgentDuplicateIndexItem[]
  ): AgentDuplicateIndexItem[] {
    if (!this.fallbackEnabled) {
      return apiItems;
    }

    const byId = new Map<string, AgentDuplicateIndexItem>();
    apiItems.forEach((item) => byId.set(item.id, item));
    localItems.forEach((item) => byId.set(item.id, item));
    return Array.from(byId.values());
  }

  private mergeDuplicateCases(
    apiItems: AgentDuplicateCase[],
    localItems: AgentDuplicateCase[]
  ): AgentDuplicateCase[] {
    if (!this.fallbackEnabled) {
      return apiItems;
    }

    const byKey = new Map<string, AgentDuplicateCase>();
    [...apiItems, ...localItems].forEach((item) => {
      const key = `${item.duplicateField}:${this.normalizeTextForMatch(item.duplicateValue)}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          ...item,
          agents: [...item.agents],
          impactedCount: Math.max(item.impactedCount, item.agents.length),
        });
        return;
      }

      const mergedAgents = new Map<string, AgentDuplicateCaseAgentSummary>();
      [...existing.agents, ...item.agents].forEach((agent) => {
        if (agent.id) {
          mergedAgents.set(agent.id, agent);
        }
      });
      const agents = Array.from(mergedAgents.values());
      const createdAt =
        Date.parse(existing.createdAt) >= Date.parse(item.createdAt)
          ? existing.createdAt
          : item.createdAt;

      byKey.set(key, {
        ...existing,
        reference: existing.reference || item.reference,
        confidenceScore: Math.max(existing.confidenceScore, item.confidenceScore),
        impactedCount: Math.max(existing.impactedCount, item.impactedCount, agents.length),
        createdAt,
        agents,
      });
    });

    return Array.from(byKey.values());
  }

  private applyLocalDuplicateCasesQuery(
    items: AgentDuplicateCase[],
    query?: AgentDuplicateCasesQuery
  ): AgentDuplicateCase[] {
    let next = [...items];
    const duplicateField = query?.duplicateField;
    const minCount = this.toPositiveInt(query?.minCount, 2);
    const search = (query?.q || '').trim().toLowerCase();

    if (duplicateField) {
      next = next.filter((item) => item.duplicateField === duplicateField);
    }

    next = next.filter((item) => item.impactedCount >= minCount);

    if (search) {
      next = next.filter((item) => {
        if (
          item.reference.toLowerCase().includes(search) ||
          item.duplicateValue.toLowerCase().includes(search) ||
          item.duplicateField.toLowerCase().includes(search)
        ) {
          return true;
        }
        return item.agents.some((agent) => {
          return (
            agent.id.toLowerCase().includes(search) ||
            agent.matricule.toLowerCase().includes(search) ||
            agent.fullName.toLowerCase().includes(search) ||
            agent.email.toLowerCase().includes(search) ||
            agent.identityNumber.toLowerCase().includes(search)
          );
        });
      });
    }

    const sortBy = (query?.sortBy || 'confidenceScore').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readDuplicateCaseField(left, sortBy);
      const rightValue = this.readDuplicateCaseField(right, sortBy);
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        if (leftValue === rightValue) return 0;
        if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
        return sortOrder === 'asc' ? 1 : -1;
      }
      const leftString = String(leftValue).toLowerCase();
      const rightString = String(rightValue).toLowerCase();
      if (leftString === rightString) return 0;
      if (leftString < rightString) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toPositiveInt(query?.limit, 200);
    const page = this.toPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readDuplicateCaseField(item: AgentDuplicateCase, field: string): string | number {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'duplicateField':
        return item.duplicateField;
      case 'duplicateValue':
        return item.duplicateValue;
      case 'impactedCount':
        return item.impactedCount;
      case 'createdAt':
        return item.createdAt;
      case 'confidenceScore':
      default:
        return item.confidenceScore;
    }
  }

  private buildLocalDuplicateCases(records: LocalAgentRecord[]): AgentDuplicateCase[] {
    if (!records.length) {
      return [];
    }

    const bucketsByField: Record<AgentDuplicateCaseField, Map<string, LocalAgentRecord[]>> = {
      email: new Map<string, LocalAgentRecord[]>(),
      identityNumber: new Map<string, LocalAgentRecord[]>(),
      fullName: new Map<string, LocalAgentRecord[]>(),
    };

    records.forEach((record) => {
      const normalizedEmail = this.normalizeTextForMatch(record.email);
      if (normalizedEmail) {
        const current = bucketsByField.email.get(normalizedEmail) || [];
        current.push(record);
        bucketsByField.email.set(normalizedEmail, current);
      }

      const normalizedIdentity = this.normalizeTextForMatch(record.identity?.identityNumber || '');
      if (normalizedIdentity) {
        const current = bucketsByField.identityNumber.get(normalizedIdentity) || [];
        current.push(record);
        bucketsByField.identityNumber.set(normalizedIdentity, current);
      }

      const normalizedName = this.normalizeTextForMatch(record.fullName || '');
      if (normalizedName.length >= 4) {
        const current = bucketsByField.fullName.get(normalizedName) || [];
        current.push(record);
        bucketsByField.fullName.set(normalizedName, current);
      }
    });

    const duplicateCases: AgentDuplicateCase[] = [];
    const now = new Date().toISOString();
    (Object.keys(bucketsByField) as AgentDuplicateCaseField[]).forEach((field) => {
      bucketsByField[field].forEach((members, key) => {
        if (members.length < 2) {
          return;
        }
        const created = this.createDuplicateCaseFromBucket(field, key, members, now);
        if (created) {
          duplicateCases.push(created);
        }
      });
    });

    duplicateCases.sort((left, right) => {
      if (left.confidenceScore !== right.confidenceScore) {
        return right.confidenceScore - left.confidenceScore;
      }
      if (left.impactedCount !== right.impactedCount) {
        return right.impactedCount - left.impactedCount;
      }
      return left.duplicateValue.localeCompare(right.duplicateValue);
    });

    return duplicateCases;
  }

  private createDuplicateCaseFromBucket(
    duplicateField: AgentDuplicateCaseField,
    normalizedBucketKey: string,
    members: LocalAgentRecord[],
    createdAt: string
  ): AgentDuplicateCase | null {
    if (members.length < 2) {
      return null;
    }

    const sortedMembers = [...members].sort((left, right) => {
      const leftName = `${left.fullName} ${left.matricule}`.toLowerCase();
      const rightName = `${right.fullName} ${right.matricule}`.toLowerCase();
      return leftName.localeCompare(rightName);
    });

    const duplicateValue =
      duplicateField === 'email'
        ? String(sortedMembers[0]?.email || '').trim()
        : duplicateField === 'identityNumber'
          ? String(sortedMembers[0]?.identity?.identityNumber || '').trim()
          : String(sortedMembers[0]?.fullName || '').trim();

    if (!duplicateValue) {
      return null;
    }

    const fieldCode = duplicateField === 'email' ? 'EML' : duplicateField === 'identityNumber' ? 'IDN' : 'NAM';
    const compactKey = normalizedBucketKey
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 22)
      .toUpperCase();
    const reference = `DUP-${fieldCode}-${compactKey || 'CASE'}-${String(sortedMembers.length).padStart(2, '0')}`;

    return {
      reference,
      duplicateField,
      duplicateValue,
      confidenceScore: AGENT_DUPLICATE_FIELD_CONFIDENCE[duplicateField],
      impactedCount: sortedMembers.length,
      createdAt,
      agents: sortedMembers.map((record) => this.toDuplicateCaseAgentSummary(record)),
    };
  }

  private toDuplicateCaseAgentSummary(record: LocalAgentRecord): AgentDuplicateCaseAgentSummary {
    return {
      id: String(record.id || '').trim(),
      matricule: String(record.matricule || '').trim(),
      fullName: String(record.fullName || '').trim(),
      direction: String(record.direction || '').trim(),
      unit: String(record.unit || '').trim(),
      position: String(record.position || '').trim(),
      status: String(record.status || '').trim(),
      manager: String(record.manager || '').trim(),
      email: String(record.email || '').trim(),
      identityNumber: String(record.identity?.identityNumber || '').trim(),
      phone: String(record.phone || '').trim(),
      contractType: String(record.administrative?.contractType || '').trim(),
    };
  }

  private normalizeMergeDuplicatePayload(payload: MergeDuplicateAgentsPayload): MergeDuplicateAgentsPayload {
    const normalizedFieldSources: Partial<Record<AgentMergeField, AgentMergeFieldSource>> = {};
    AGENT_MERGE_FIELDS.forEach((field) => {
      const normalizedSource = this.normalizeMergeFieldSource(payload.fieldSources?.[field]);
      if (normalizedSource) {
        normalizedFieldSources[field] = normalizedSource;
      }
    });

    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      primaryAgentId: String(payload.primaryAgentId || '').trim(),
      secondaryAgentId: String(payload.secondaryAgentId || '').trim(),
      fieldSources: normalizedFieldSources,
      reason: this.normalizeOptionalText(payload.reason) || 'fusion_doublon',
    };
  }

  private normalizeMergeFieldSource(value: unknown): AgentMergeFieldSource | null {
    if (value === 'primary' || value === 'secondary') {
      return value;
    }
    return null;
  }

  private normalizeMergeDuplicateResult(
    dto: MergeDuplicateAgentsResultDto,
    fallbackPayload: MergeDuplicateAgentsPayload
  ): MergeDuplicateAgentsResult {
    const mergedAgentDto = readField(dto, ['mergedAgent', 'merged_agent'], {}) as AgentDetailDto;
    const mergedAgent = mapAgentDetailDto(mergedAgentDto, fallbackPayload.primaryAgentId);

    const toSafeNumber = (value: unknown): number => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return 0;
      }
      return Math.max(0, Math.round(parsed));
    };

    return {
      reference:
        toStringValue(readField(dto, ['reference'], ''), '').trim() ||
        `AG-MERGE-${Date.now()}`,
      mergedAt:
        toStringValue(readField(dto, ['mergedAt', 'merged_at'], ''), '').trim() ||
        new Date().toISOString(),
      mergedBy:
        toStringValue(readField(dto, ['mergedBy', 'merged_by'], ''), '').trim() || 'system',
      primaryAgentId:
        toStringValue(readField(dto, ['primaryAgentId', 'primary_agent_id'], ''), '').trim() ||
        fallbackPayload.primaryAgentId,
      secondaryAgentId:
        toStringValue(readField(dto, ['secondaryAgentId', 'secondary_agent_id'], ''), '').trim() ||
        fallbackPayload.secondaryAgentId,
      removedAgentId:
        toStringValue(readField(dto, ['removedAgentId', 'removed_agent_id'], ''), '').trim() ||
        fallbackPayload.secondaryAgentId,
      keptAgentId:
        toStringValue(readField(dto, ['keptAgentId', 'kept_agent_id'], ''), '').trim() ||
        fallbackPayload.primaryAgentId,
      mergedAgent,
      reassignedDossiers: toSafeNumber(readField(dto, ['reassignedDossiers', 'reassigned_dossiers'], 0)),
      reassignedAffectations: toSafeNumber(
        readField(dto, ['reassignedAffectations', 'reassigned_affectations'], 0)
      ),
    };
  }

  private mergeLocalDuplicateAgents(payload: MergeDuplicateAgentsPayload): MergeDuplicateAgentsResult {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      throw new Error('Fallback local indisponible');
    }

    const records = this.readLocalAgentRecords();
    const primaryIndex = records.findIndex((record) => record.id === payload.primaryAgentId);
    const secondaryIndex = records.findIndex((record) => record.id === payload.secondaryAgentId);
    if (primaryIndex < 0 || secondaryIndex < 0) {
      throw new Error('Agent introuvable pour fusion');
    }
    if (primaryIndex === secondaryIndex) {
      throw new Error('Les agents de fusion doivent etre distincts');
    }

    const primary = records[primaryIndex];
    const secondary = records[secondaryIndex];

    const merged: LocalAgentRecord = {
      ...primary,
      identity: normalizeIdentityInfo(primary.identity),
      administrative: normalizeAdministrativeInfo(primary.administrative),
      educations: normalizeEducations(primary.educations),
      documents: mapAgentDocuments(primary.documents),
      careerEvents: Array.isArray(primary.careerEvents) ? [...primary.careerEvents] : [],
    };

    AGENT_MERGE_FIELDS.forEach((field) => {
      const selectedSource = payload.fieldSources?.[field] || 'primary';
      const value = this.resolveMergedFieldValue(field, primary, secondary, selectedSource);
      switch (field) {
        case 'identityNumber':
          merged.identity = normalizeIdentityInfo({
            ...merged.identity,
            identityNumber: value,
          });
          break;
        case 'contractType':
          merged.administrative = normalizeAdministrativeInfo({
            ...merged.administrative,
            contractType: value,
          });
          break;
        case 'matricule':
          merged.matricule = value;
          break;
        case 'fullName':
          merged.fullName = value;
          break;
        case 'direction':
          merged.direction = value;
          break;
        case 'unit':
          merged.unit = value;
          break;
        case 'position':
          merged.position = value;
          break;
        case 'status':
          merged.status = value;
          break;
        case 'manager':
          merged.manager = value;
          break;
        case 'email':
          merged.email = value;
          break;
        case 'phone':
          merged.phone = value;
          break;
        default:
          break;
      }
    });

    const mergedEducations = normalizeEducations([...(primary.educations || []), ...(secondary.educations || [])]);
    const mergedDocuments = mapAgentDocuments([...(primary.documents || []), ...(secondary.documents || [])]);
    const mergedDocumentByKey = new Map<string, AgentDocument>();
    mergedDocuments.forEach((doc) => {
      const key = `${this.normalizeTextForMatch(doc.type)}:${this.normalizeTextForMatch(doc.reference)}`;
      if (!key || key === ':') {
        return;
      }
      mergedDocumentByKey.set(key, doc);
    });
    merged.educations = mergedEducations;
    merged.documents = Array.from(mergedDocumentByKey.values());

    const mergeDate = new Date().toISOString();
    const mergeReason = String(payload.reason || 'fusion_doublon').trim();
    const mergeEvent: AgentCareerEvent = {
      title: 'Fusion doublon',
      description: `Fusion de ${secondary.matricule || secondary.id} vers ${primary.matricule || primary.id} (${mergeReason})`,
      date: mergeDate.slice(0, 10),
    };
    const currentPrimaryEvents = Array.isArray(primary.careerEvents) ? primary.careerEvents : [];
    const currentSecondaryEvents = Array.isArray(secondary.careerEvents) ? secondary.careerEvents : [];
    merged.careerEvents = [mergeEvent, ...currentPrimaryEvents, ...currentSecondaryEvents]
      .map((event) => ({
        title: String(event?.title || '').trim(),
        description: String(event?.description || '').trim(),
        date: String(event?.date || '').trim(),
      }))
      .filter((event) => event.title || event.description || event.date);

    const mergeAuditChanges = this.buildAgentAuditChanges(primary, merged);
    mergeAuditChanges.unshift({
      field: 'merge',
      label: 'Fusion doublon',
      before: String(secondary.matricule || secondary.id || '').trim(),
      after: String(merged.matricule || merged.id || '').trim(),
    });

    records[primaryIndex] = merged;
    records.splice(secondaryIndex, 1);
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(records));

    const changedBy = (this.hasLocalStorage() ? window.localStorage.getItem('rh_username') : '') || 'system';
    this.appendLocalAgentAudit({
      agentId: merged.id,
      agentLabel: merged.fullName,
      changedBy,
      source: 'merge',
      reason: mergeReason || 'fusion_doublon',
      changedAt: mergeDate,
      changes: mergeAuditChanges,
    });

    const normalizedSecondaryAliases = [secondary.id, secondary.matricule, secondary.fullName]
      .map((value) => this.normalizeTextForMatch(value))
      .filter((value) => !!value);
    const matchSecondaryAlias = (candidate: string): boolean => {
      const normalizedCandidate = this.normalizeTextForMatch(candidate);
      if (!normalizedCandidate) {
        return false;
      }
      return normalizedSecondaryAliases.some((alias) => {
        return (
          normalizedCandidate === alias ||
          normalizedCandidate.includes(alias) ||
          alias.includes(normalizedCandidate)
        );
      });
    };

    const currentDossiers = this.readLocalDossiers();
    let reassignedDossiers = 0;
    const updatedDossiers = currentDossiers.map((item) => {
      if (!matchSecondaryAlias(item.agent)) {
        return item;
      }
      reassignedDossiers += 1;
      return {
        ...item,
        agent: merged.fullName,
        updatedAt: mergeDate,
      };
    });
    if (reassignedDossiers > 0) {
      this.writeLocalDossiers(updatedDossiers);
    }

    const currentAffectations = this.readLocalAffectations();
    let reassignedAffectations = 0;
    const updatedAffectations = currentAffectations.map((item) => {
      if (!matchSecondaryAlias(item.agent)) {
        return item;
      }
      reassignedAffectations += 1;
      return {
        ...item,
        agent: merged.fullName,
      };
    });
    if (reassignedAffectations > 0) {
      this.writeLocalAffectations(updatedAffectations);
    }

    const reference =
      this.normalizeOptionalText(payload.reference)?.toUpperCase() ||
      `AG-MERGE-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`;

    return {
      reference,
      mergedAt: mergeDate,
      mergedBy: 'local_fallback',
      primaryAgentId: primary.id,
      secondaryAgentId: secondary.id,
      removedAgentId: secondary.id,
      keptAgentId: merged.id,
      mergedAgent: this.toDetail(merged),
      reassignedDossiers,
      reassignedAffectations,
    };
  }

  private resolveMergedFieldValue(
    field: AgentMergeField,
    primary: LocalAgentRecord,
    secondary: LocalAgentRecord,
    source: AgentMergeFieldSource
  ): string {
    const sourceRecord = source === 'secondary' ? secondary : primary;
    const fallbackRecord = source === 'secondary' ? primary : secondary;
    const readFromRecord = (record: LocalAgentRecord): string => {
      switch (field) {
        case 'matricule':
          return String(record.matricule || '').trim();
        case 'fullName':
          return String(record.fullName || '').trim();
        case 'direction':
          return String(record.direction || '').trim();
        case 'unit':
          return String(record.unit || '').trim();
        case 'position':
          return String(record.position || '').trim();
        case 'status':
          return String(record.status || '').trim();
        case 'manager':
          return String(record.manager || '').trim();
        case 'email':
          return String(record.email || '').trim();
        case 'phone':
          return String(record.phone || '').trim();
        case 'identityNumber':
          return String(record.identity?.identityNumber || '').trim();
        case 'contractType':
          return String(record.administrative?.contractType || '').trim();
        default:
          return '';
      }
    };

    const preferred = readFromRecord(sourceRecord);
    if (preferred) {
      return preferred;
    }
    return readFromRecord(fallbackRecord);
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

  private applyLocalAgentQuery(items: AgentListItem[], query?: AgentListQuery): AgentListItem[] {
    let next = [...items];
    const direction = (query?.direction || '').trim().toLowerCase();
    const status = (query?.status || '').trim().toLowerCase();
    const unit = (query?.unit || '').trim().toLowerCase();
    const manager = (query?.manager || '').trim().toLowerCase();
    const position = (query?.position || '').trim().toLowerCase();
    const contractType = (query?.contractType || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (direction) {
      next = next.filter((item) => item.direction.toLowerCase().includes(direction));
    }

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }

    if (unit) {
      next = next.filter((item) => item.unit.toLowerCase().includes(unit));
    }

    if (manager) {
      next = next.filter((item) => item.manager.toLowerCase().includes(manager));
    }

    if (position) {
      next = next.filter((item) => item.position.toLowerCase().includes(position));
    }

    if (contractType) {
      next = next.filter((item) => item.contractType.toLowerCase().includes(contractType));
    }

    if (search) {
      next = next.filter((item) => {
        return (
          item.id.toLowerCase().includes(search) ||
          item.matricule.toLowerCase().includes(search) ||
          item.fullName.toLowerCase().includes(search) ||
          item.direction.toLowerCase().includes(search) ||
          item.unit.toLowerCase().includes(search) ||
          item.position.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.manager.toLowerCase().includes(search) ||
          item.contractType.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'fullName').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readAgentField(left, sortBy).toLowerCase();
      const rightValue = this.readAgentField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toPositiveInt(query?.limit, 200);
    const page = this.toPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private toPositiveInt(value: number | undefined, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback;
    }
    const rounded = Math.round(value);
    return rounded > 0 ? rounded : fallback;
  }

  private readAgentField(agent: AgentListItem, key: string): string {
    switch (key) {
      case 'id':
        return agent.id;
      case 'matricule':
        return agent.matricule;
      case 'direction':
        return agent.direction;
      case 'unit':
        return agent.unit;
      case 'position':
        return agent.position;
      case 'status':
        return agent.status;
      case 'manager':
        return agent.manager;
      case 'contractType':
        return agent.contractType;
      case 'fullName':
      default:
        return agent.fullName;
    }
  }

  private readLocalAgentList(): AgentListItem[] {
    return this.readLocalAgentRecords().map((record) => ({
      id: record.id,
      matricule: record.matricule,
      fullName: record.fullName,
      direction: record.direction,
      unit: record.unit,
      position: record.position,
      status: record.status,
      manager: record.manager,
      contractType: toStringValue(record.administrative?.contractType, ''),
      photoUrl: toStringValue(record.photoUrl, './assets/images/faces/profile.jpg'),
      hireDate: toStringValue(record.administrative?.hireDate, '') || undefined,
      documents: mapAgentDocuments(record.documents || []),
    }));
  }

  private readLocalDuplicateIndex(): AgentDuplicateIndexItem[] {
    return this.readLocalAgentRecords().map((record) => ({
      id: record.id,
      fullName: toStringValue(record.fullName, ''),
      matricule: toStringValue(record.matricule, ''),
      email: toStringValue(record.email, ''),
      identityNumber: toStringValue(record.identity?.identityNumber, ''),
    }));
  }

  private buildLocalMatriculeSuggestion(input?: {
    direction?: string;
    unit?: string;
  }): AgentMatriculeSuggestion {
    const direction = this.normalizeOptionalText(input?.direction) || '';
    const unit = this.normalizeOptionalText(input?.unit) || '';

    const records = this.readLocalAgentRecords();
    const normalizedDirection = this.normalizeTextForMatch(direction);
    const normalizedUnit = this.normalizeTextForMatch(unit);

    const scoped = records.filter((record) => {
      if (!normalizedDirection) return false;
      const sameDirection = this.normalizeTextForMatch(record.direction) === normalizedDirection;
      if (!sameDirection) return false;
      if (!normalizedUnit) return true;
      return this.normalizeTextForMatch(record.unit) === normalizedUnit;
    });

    const scopeRecords = scoped.length > 0 ? scoped : records;
    const highest = scopeRecords.reduce((max, record) => {
      const value = this.parseMatriculeNumber(record.matricule);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);

    const nextNumber = highest + 1;
    const padded = String(nextNumber).padStart(4, '0');
    const basedOn: AgentMatriculeSuggestion['basedOn'] =
      normalizedDirection && normalizedUnit
        ? 'Direction+Unite'
        : normalizedDirection
          ? 'Direction'
          : 'Global';
    const scopeLabel =
      basedOn === 'Direction+Unite'
        ? `${direction} / ${unit}`
        : basedOn === 'Direction'
          ? direction
          : 'Global';

    return {
      matricule: `PRM-${padded}`,
      scopeLabel: scopeLabel || 'Global',
      basedOn,
      nextNumber,
    };
  }

  private parseMatriculeNumber(value: string): number {
    const match = /^PRM-(\d{4,8})$/i.exec(String(value || '').trim());
    if (!match) {
      return Number.NaN;
    }
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  private normalizeTextForMatch(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private resolveLocalAgentReference(agentIdInput?: string, agentLabelInput?: string): {
    agentId: string;
    agent: string;
  } {
    const agentId = String(agentIdInput || '').trim();
    const agentLabel = String(agentLabelInput || '').trim();
    const directMatch = agentId ? this.findLocalAgentRecordByReference(agentId) : null;
    if (directMatch) {
      return {
        agentId: directMatch.id,
        agent: String(directMatch.fullName || '').trim(),
      };
    }

    const labelMatch = agentLabel ? this.findLocalAgentRecordByReference(agentLabel) : null;
    if (labelMatch) {
      return {
        agentId: labelMatch.id,
        agent: String(labelMatch.fullName || '').trim(),
      };
    }

    return {
      agentId,
      agent: agentLabel,
    };
  }

  private findLocalAgentRecordByReference(candidate: string): LocalAgentRecord | null {
    const normalizedCandidate = this.normalizeTextForMatch(candidate);
    if (!normalizedCandidate) {
      return null;
    }

    return (
      this.readLocalAgentRecords().find((record) => {
        return [record.id, record.matricule, record.fullName]
          .map((value) => this.normalizeTextForMatch(value))
          .some((value) => !!value && value === normalizedCandidate);
      }) || null
    );
  }

  private mapDossiers(items: PersonnelDossierDto[]): PersonnelDossier[] {
    return (items || [])
      .map((dto) => this.normalizeDossier(dto))
      .filter((item) => !!item.reference && !!item.agent && !!item.type && !!item.updatedAt);
  }

  private normalizeDossier(dto: PersonnelDossierDto): PersonnelDossier {
    const resolvedAgent = this.resolveLocalAgentReference(
      toStringValue(readField(dto, ['agentId', 'agent_id'], '')).trim(),
      toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim()
    );
    return {
      reference: toStringValue(readField(dto, ['reference', 'dossierRef', 'dossier_ref'], '')).trim(),
      agentId: resolvedAgent.agentId,
      agent: resolvedAgent.agent,
      type: toStringValue(readField(dto, ['type', 'dossierType', 'dossier_type'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Actif')).trim() || 'Actif',
      updatedAt: toStringValue(readField(dto, ['updatedAt', 'updated_at'], '')).trim(),
    };
  }

  private normalizeCreateDossierPayload(payload: CreatePersonnelDossierPayload): CreatePersonnelDossierPayload {
    const rawUpdatedAt = String(payload.updatedAt || '').trim();
    const parsed = Date.parse(rawUpdatedAt);
    const resolvedAgent = this.resolveLocalAgentReference(payload.agentId, payload.agent);

    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      agentId: resolvedAgent.agentId || undefined,
      agent: resolvedAgent.agent,
      type: String(payload.type || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Actif',
      updatedAt: !rawUpdatedAt
        ? new Date().toISOString()
        : Number.isNaN(parsed)
          ? rawUpdatedAt
          : new Date(parsed).toISOString(),
    };
  }

  private applyLocalDossiersQuery(items: PersonnelDossier[], query?: PersonnelDossiersQuery): PersonnelDossier[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const type = (query?.type || '').trim().toLowerCase();
    const agent = (query?.agent || '').trim().toLowerCase();
    const agentId = (query?.agentId || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (type) {
      next = next.filter((item) => item.type.toLowerCase().includes(type));
    }
    if (agent) {
      next = next.filter((item) => item.agent.toLowerCase().includes(agent));
    }
    if (agentId) {
      next = next.filter((item) => item.agentId.toLowerCase().includes(agentId));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.agentId.toLowerCase().includes(search) ||
          item.agent.toLowerCase().includes(search) ||
          item.type.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.updatedAt.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'updatedAt').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readDossierField(left, sortBy).toLowerCase();
      const rightValue = this.readDossierField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toPositiveInt(query?.limit, 200);
    const page = this.toPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readDossierField(item: PersonnelDossier, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'agentId':
        return item.agentId;
      case 'agent':
        return item.agent;
      case 'type':
        return item.type;
      case 'status':
        return item.status;
      case 'updatedAt':
      default:
        return item.updatedAt;
    }
  }

  private appendLocalDossier(payload: CreatePersonnelDossierPayload): PersonnelDossier {
    const current = this.readLocalDossiers();
    const resolvedAgent = this.resolveLocalAgentReference(payload.agentId, payload.agent);
    const created: PersonnelDossier = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateDossierReference(current),
      agentId: resolvedAgent.agentId,
      agent: resolvedAgent.agent,
      type: String(payload.type || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Actif',
      updatedAt: String(payload.updatedAt || new Date().toISOString()).trim(),
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalDossiers(deduped);
    return created;
  }

  private generateDossierReference(existing: PersonnelDossier[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^DOS-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `DOS-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalDossiers(): PersonnelDossier[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localDossiersKey);
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
          const record = item as Partial<PersonnelDossier>;
          const resolvedAgent = this.resolveLocalAgentReference(record.agentId, record.agent);
          return {
            reference: String(record.reference || '').trim(),
            agentId: resolvedAgent.agentId,
            agent: resolvedAgent.agent,
            type: String(record.type || '').trim(),
            status: String(record.status || 'Actif').trim() || 'Actif',
            updatedAt: String(record.updatedAt || '').trim(),
          } as PersonnelDossier;
        })
        .filter((item) => !!item.reference && !!item.agent && !!item.type && !!item.updatedAt);
    } catch {
      return [];
    }
  }

  private writeLocalDossiers(items: PersonnelDossier[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localDossiersKey, JSON.stringify(items));
  }

  private mapAffectations(items: PersonnelAffectationDto[]): PersonnelAffectation[] {
    return (items || [])
      .map((dto) => this.normalizeAffectation(dto))
      .filter((item) => !!item.reference && !!item.agent && !!item.fromUnit && !!item.toUnit && !!item.effectiveDate);
  }

  private normalizeAffectation(dto: PersonnelAffectationDto): PersonnelAffectation {
    const resolvedAgent = this.resolveLocalAgentReference(
      toStringValue(readField(dto, ['agentId', 'agent_id'], '')).trim(),
      toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim()
    );
    return {
      reference: toStringValue(readField(dto, ['reference', 'assignmentRef', 'assignment_ref'], '')).trim(),
      agentId: resolvedAgent.agentId,
      agent: resolvedAgent.agent,
      fromUnit: toStringValue(readField(dto, ['fromUnit', 'from_unit'], '')).trim(),
      toUnit: toStringValue(readField(dto, ['toUnit', 'to_unit'], '')).trim(),
      effectiveDate: toStringValue(readField(dto, ['effectiveDate', 'effective_date'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Planifiee')).trim() || 'Planifiee',
    };
  }

  private normalizeCreateAffectationPayload(payload: CreatePersonnelAffectationPayload): CreatePersonnelAffectationPayload {
    const resolvedAgent = this.resolveLocalAgentReference(payload.agentId, payload.agent);
    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      agentId: resolvedAgent.agentId || undefined,
      agent: resolvedAgent.agent,
      fromUnit: String(payload.fromUnit || '').trim(),
      toUnit: String(payload.toUnit || '').trim(),
      effectiveDate: String(payload.effectiveDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Planifiee',
    };
  }

  private applyLocalAffectationsQuery(items: PersonnelAffectation[], query?: PersonnelAffectationsQuery): PersonnelAffectation[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const agent = (query?.agent || '').trim().toLowerCase();
    const agentId = (query?.agentId || '').trim().toLowerCase();
    const fromUnit = (query?.fromUnit || '').trim().toLowerCase();
    const toUnit = (query?.toUnit || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (agent) {
      next = next.filter((item) => item.agent.toLowerCase().includes(agent));
    }
    if (agentId) {
      next = next.filter((item) => item.agentId.toLowerCase().includes(agentId));
    }
    if (fromUnit) {
      next = next.filter((item) => item.fromUnit.toLowerCase().includes(fromUnit));
    }
    if (toUnit) {
      next = next.filter((item) => item.toUnit.toLowerCase().includes(toUnit));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.agentId.toLowerCase().includes(search) ||
          item.agent.toLowerCase().includes(search) ||
          item.fromUnit.toLowerCase().includes(search) ||
          item.toUnit.toLowerCase().includes(search) ||
          item.effectiveDate.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'effectiveDate').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readAffectationField(left, sortBy).toLowerCase();
      const rightValue = this.readAffectationField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toPositiveInt(query?.limit, 200);
    const page = this.toPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readAffectationField(item: PersonnelAffectation, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'agentId':
        return item.agentId;
      case 'agent':
        return item.agent;
      case 'fromUnit':
        return item.fromUnit;
      case 'toUnit':
        return item.toUnit;
      case 'status':
        return item.status;
      case 'effectiveDate':
      default:
        return item.effectiveDate;
    }
  }

  private appendLocalAffectation(payload: CreatePersonnelAffectationPayload): PersonnelAffectation {
    const current = this.readLocalAffectations();
    const resolvedAgent = this.resolveLocalAgentReference(payload.agentId, payload.agent);
    const created: PersonnelAffectation = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateAffectationReference(current),
      agentId: resolvedAgent.agentId,
      agent: resolvedAgent.agent,
      fromUnit: String(payload.fromUnit || '').trim(),
      toUnit: String(payload.toUnit || '').trim(),
      effectiveDate: String(payload.effectiveDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Planifiee',
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalAffectations(deduped);
    return created;
  }

  private generateAffectationReference(existing: PersonnelAffectation[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^AFF-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `AFF-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalAffectations(): PersonnelAffectation[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localAffectationsKey);
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
          const record = item as Partial<PersonnelAffectation>;
          const resolvedAgent = this.resolveLocalAgentReference(record.agentId, record.agent);
          return {
            reference: String(record.reference || '').trim(),
            agentId: resolvedAgent.agentId,
            agent: resolvedAgent.agent,
            fromUnit: String(record.fromUnit || '').trim(),
            toUnit: String(record.toUnit || '').trim(),
            effectiveDate: String(record.effectiveDate || '').trim(),
            status: String(record.status || 'Planifiee').trim() || 'Planifiee',
          } as PersonnelAffectation;
        })
        .filter((item) => !!item.reference && !!item.agent && !!item.fromUnit && !!item.toUnit && !!item.effectiveDate);
    } catch {
      return [];
    }
  }

  private writeLocalAffectations(items: PersonnelAffectation[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localAffectationsKey, JSON.stringify(items));
  }

  private appendLocalMatriculeAudit(
    payload: CreatePersonnelMatriculeSuggestionAuditPayload
  ): PersonnelMatriculeSuggestionAuditItem {
    const current = this.readLocalMatriculeAudit();
    const created: PersonnelMatriculeSuggestionAuditItem = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateMatriculeAuditReference(current),
      createdAt: String(payload.createdAt || new Date().toISOString()).trim(),
      username: String(payload.username || 'system').trim() || 'system',
      previousMatricule: String(payload.previousMatricule || '').trim(),
      suggestedMatricule: String(payload.suggestedMatricule || '').trim(),
      direction: String(payload.direction || '').trim(),
      unit: String(payload.unit || '').trim(),
      scopeLabel: String(payload.scopeLabel || 'Global').trim() || 'Global',
      basedOn:
        payload.basedOn === 'Direction+Unite' || payload.basedOn === 'Direction'
          ? payload.basedOn
          : 'Global',
      reason: String(payload.reason || 'generation').trim() || 'generation',
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalMatriculeAudit(deduped);
    return created;
  }

  private generateMatriculeAuditReference(
    existing: PersonnelMatriculeSuggestionAuditItem[]
  ): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^MAT-AUD-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `MAT-AUD-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalMatriculeAudit(): PersonnelMatriculeSuggestionAuditItem[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localMatriculeAuditKey);
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
          const record = item as Partial<PersonnelMatriculeSuggestionAuditItem>;
          return {
            reference: String(record.reference || '').trim(),
            createdAt: String(record.createdAt || '').trim(),
            username: String(record.username || '').trim(),
            previousMatricule: String(record.previousMatricule || '').trim(),
            suggestedMatricule: String(record.suggestedMatricule || '').trim(),
            direction: String(record.direction || '').trim(),
            unit: String(record.unit || '').trim(),
            scopeLabel: String(record.scopeLabel || 'Global').trim() || 'Global',
            basedOn:
              record.basedOn === 'Direction+Unite' || record.basedOn === 'Direction'
                ? record.basedOn
                : 'Global',
            reason: String(record.reason || 'generation').trim() || 'generation',
          } as PersonnelMatriculeSuggestionAuditItem;
        })
        .filter((item) => !!item.reference && !!item.createdAt && !!item.suggestedMatricule);
    } catch {
      return [];
    }
  }

  private writeLocalMatriculeAudit(items: PersonnelMatriculeSuggestionAuditItem[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localMatriculeAuditKey, JSON.stringify(items));
  }

  private applyLocalAgentAuditQuery(items: AgentAuditEvent[], query?: AgentAuditTrailQuery): AgentAuditEvent[] {
    let next = [...items];
    const changedBy = (query?.changedBy || '').trim().toLowerCase();
    const source = (query?.source || '').trim().toLowerCase();
    const field = (query?.field || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (changedBy) {
      next = next.filter((item) => item.changedBy.toLowerCase().includes(changedBy));
    }
    if (source) {
      next = next.filter((item) => item.source.toLowerCase().includes(source));
    }
    if (field) {
      next = next.filter((item) => {
        return item.changes.some((change) => {
          return (
            change.field.toLowerCase().includes(field) ||
            change.label.toLowerCase().includes(field)
          );
        });
      });
    }
    if (search) {
      next = next.filter((item) => {
        if (
          item.reference.toLowerCase().includes(search) ||
          item.changedBy.toLowerCase().includes(search) ||
          item.reason.toLowerCase().includes(search) ||
          item.source.toLowerCase().includes(search) ||
          item.changedAt.toLowerCase().includes(search)
        ) {
          return true;
        }
        return item.changes.some((change) => {
          return (
            change.field.toLowerCase().includes(search) ||
            change.label.toLowerCase().includes(search) ||
            change.before.toLowerCase().includes(search) ||
            change.after.toLowerCase().includes(search)
          );
        });
      });
    }

    const sortBy = (query?.sortBy || 'changedAt').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readAgentAuditSortField(left, sortBy).toLowerCase();
      const rightValue = this.readAgentAuditSortField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toPositiveInt(query?.limit, 200);
    const page = this.toPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readAgentAuditSortField(item: AgentAuditEvent, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'changedBy':
        return item.changedBy;
      case 'reason':
        return item.reason;
      case 'source':
        return item.source;
      case 'changedAt':
      default:
        return item.changedAt;
    }
  }

  private readLocalAgentAudit(agentId?: string): AgentAuditEvent[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localAgentAuditKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      const allItems = parsed
        .map((item) => {
          const record = item as Partial<AgentAuditEvent>;
          const source = this.normalizeAuditSource(record.source);
          const changesRaw = Array.isArray(record.changes) ? record.changes : [];
          const changes = changesRaw
            .map((change) => {
              const safeChange = change as Partial<AgentAuditFieldChange>;
              return {
                field: String(safeChange.field || '').trim(),
                label: String(safeChange.label || '').trim(),
                before: String(safeChange.before || '').trim(),
                after: String(safeChange.after || '').trim(),
              } as AgentAuditFieldChange;
            })
            .filter((change) => !!change.field || !!change.before || !!change.after);
          return {
            reference: String(record.reference || '').trim(),
            agentId: String(record.agentId || '').trim(),
            agentLabel: String(record.agentLabel || '').trim(),
            changedAt: String(record.changedAt || '').trim(),
            changedBy: String(record.changedBy || 'system').trim() || 'system',
            source,
            reason: String(record.reason || 'mise_a_jour_fiche').trim() || 'mise_a_jour_fiche',
            changes,
          } as AgentAuditEvent;
        })
        .filter((item) => !!item.reference && !!item.agentId && !!item.changedAt && item.changes.length > 0);

      const expectedAgentId = String(agentId || '').trim();
      if (!expectedAgentId) {
        return allItems;
      }
      return allItems.filter((item) => item.agentId === expectedAgentId);
    } catch {
      return [];
    }
  }

  private writeLocalAgentAudit(items: AgentAuditEvent[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localAgentAuditKey, JSON.stringify(items));
  }

  private appendLocalAgentAudit(input: {
    reference?: string;
    changedAt?: string;
    agentId: string;
    agentLabel?: string;
    changedBy?: string;
    source?: 'update' | 'merge' | 'system' | string;
    reason?: string;
    changes: AgentAuditFieldChange[];
  }): AgentAuditEvent {
    const current = this.readLocalAgentAudit();
    const createdAtInput = String(input.changedAt || '').trim();
    const createdAt = createdAtInput || new Date().toISOString();
    const created: AgentAuditEvent = {
      reference: this.normalizeOptionalText(input.reference) || this.generateAgentAuditReference(current),
      agentId: String(input.agentId || '').trim(),
      agentLabel: String(input.agentLabel || input.agentId || '').trim(),
      changedAt: createdAt,
      changedBy: String(input.changedBy || 'system').trim() || 'system',
      source: this.normalizeAuditSource(input.source),
      reason: String(input.reason || 'mise_a_jour_fiche').trim() || 'mise_a_jour_fiche',
      changes: (input.changes || [])
        .map((change) => ({
          field: String(change.field || '').trim(),
          label: String(change.label || '').trim(),
          before: String(change.before || '').trim(),
          after: String(change.after || '').trim(),
        }))
        .filter((change) => !!change.field || !!change.before || !!change.after),
    };

    if (!created.agentId || !created.changes.length) {
      return created;
    }

    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalAgentAudit(deduped);
    return created;
  }

  private generateAgentAuditReference(existing: AgentAuditEvent[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^AG-AUD-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `AG-AUD-${year}-${String(maxExisting + 1).padStart(4, '0')}`;
  }

  private normalizeAuditSource(value: unknown): 'update' | 'merge' | 'system' {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'merge') {
      return 'merge';
    }
    if (normalized === 'system') {
      return 'system';
    }
    return 'update';
  }

  private buildAgentAuditChanges(before: LocalAgentRecord, after: LocalAgentRecord): AgentAuditFieldChange[] {
    return AGENT_AUDIT_FIELD_CONFIG
      .map((config) => {
        const previousValue = String(config.read(before) || '').trim();
        const nextValue = String(config.read(after) || '').trim();
        return {
          field: config.field,
          label: config.label,
          before: previousValue,
          after: nextValue,
        } as AgentAuditFieldChange;
      })
      .filter((change) => change.before !== change.after);
  }

  private appendLocalAgent(payload: CreateAgentPayload): LocalAgentRecord {
    const records = this.readLocalAgentRecords();
    const id = this.generateAgentId();
    const matricule = payload.matricule?.trim() || this.generateMatricule();
    const identity = normalizeIdentityInfo(payload.identity);
    const administrative = normalizeAdministrativeInfo(payload.administrative);
    const educations = normalizeEducations(payload.educations);
    const competencies = normalizeCompetencies(payload.competencies);
    const dependents = normalizeDependents(payload.dependents);
    const documents = mapAgentDocuments((payload.documents || []) as AgentDocumentDto[]);
    const record: LocalAgentRecord = {
      id,
      matricule,
      fullName: payload.fullName.trim(),
      direction: payload.direction.trim(),
      unit: (payload.unit || payload.direction).trim(),
      position: payload.position.trim(),
      status: payload.isDraft ? 'Brouillon' : payload.status.trim(),
      manager: payload.manager.trim(),
      email: (payload.email || '').trim(),
      phone: (payload.phone || '').trim(),
      photoUrl: (payload.photoUrl || '').trim() || './assets/images/faces/profile.jpg',
      identity,
      administrative,
      educations,
      competencies,
      dependents,
      careerEvents: [],
      documents,
    };

    records.push(record);
    localStorage.setItem(this.localStorageKey, JSON.stringify(records));
    return record;
  }

  private updateLocalAgent(id: string, payload: UpdateAgentPayload): LocalAgentRecord | null {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return null;
    }

    const records = this.readLocalAgentRecords();
    const index = records.findIndex((record) => record.id === id);
    if (index < 0) {
      return null;
    }

    const current = records[index];
    const has = (key: keyof UpdateAgentPayload): boolean =>
      Object.prototype.hasOwnProperty.call(payload, key);

    const nextIdentity = has('identity')
      ? normalizeIdentityInfo({ ...current.identity, ...(payload.identity || {}) })
      : normalizeIdentityInfo(current.identity);

    const nextAdministrative = has('administrative')
      ? normalizeAdministrativeInfo({ ...current.administrative, ...(payload.administrative || {}) })
      : normalizeAdministrativeInfo(current.administrative);

    const nextEducations = has('educations')
      ? normalizeEducations(payload.educations)
      : normalizeEducations(current.educations);

    const nextDocuments = has('documents')
      ? mapAgentDocuments((payload.documents || []) as AgentDocumentDto[])
      : mapAgentDocuments((current.documents || []) as AgentDocumentDto[]);

    const nextCompetencies = has('competencies')
      ? normalizeCompetencies(payload.competencies)
      : normalizeCompetencies(current.competencies);

    const nextDependents = has('dependents')
      ? normalizeDependents(payload.dependents)
      : normalizeDependents(current.dependents);

    const updated: LocalAgentRecord = {
      ...current,
      matricule: has('matricule') ? String(payload.matricule || '').trim() : current.matricule,
      fullName: has('fullName') ? String(payload.fullName || '').trim() : current.fullName,
      direction: has('direction') ? String(payload.direction || '').trim() : current.direction,
      unit: has('unit') ? String(payload.unit || '').trim() : current.unit,
      position: has('position') ? String(payload.position || '').trim() : current.position,
      status: has('status') ? String(payload.status || '').trim() : current.status,
      manager: has('manager') ? String(payload.manager || '').trim() : current.manager,
      email: has('email') ? String(payload.email || '').trim() : current.email,
      phone: has('phone') ? String(payload.phone || '').trim() : current.phone,
      photoUrl: has('photoUrl') ? String(payload.photoUrl || '').trim() : current.photoUrl,
      identity: nextIdentity,
      administrative: nextAdministrative,
      educations: nextEducations,
      competencies: nextCompetencies,
      dependents: nextDependents,
      careerEvents: has('careerEvents')
        ? (Array.isArray(payload.careerEvents) ? payload.careerEvents : [])
        : (Array.isArray(current.careerEvents) ? current.careerEvents : []),
      documents: nextDocuments,
    };

    const auditChanges = this.buildAgentAuditChanges(current, updated);

    records[index] = updated;
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(records));

    if (auditChanges.length > 0) {
      const changedBy = (this.hasLocalStorage() ? window.localStorage.getItem('rh_username') : '') || 'system';
      this.appendLocalAgentAudit({
        agentId: updated.id,
        agentLabel: updated.fullName,
        changedBy,
        source: 'update',
        reason: String(payload.auditReason || 'mise_a_jour_fiche').trim() || 'mise_a_jour_fiche',
        changes: auditChanges,
      });
    }

    return updated;
  }

  private readLocalAgentRecords(): LocalAgentRecord[] {
    if (!this.fallbackEnabled) {
      return [];
    }

    const raw = localStorage.getItem(this.localStorageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((record) => this.normalizeLocalRecord(record))
        .filter((record): record is LocalAgentRecord => !!record);
    } catch {
      return [];
    }
  }

  private normalizeLocalRecord(record: any): LocalAgentRecord | null {
    if (!record || typeof record !== 'object') {
      return null;
    }

    const id = toStringValue(record.id, '');
    if (!id) return null;

    return {
      id,
      matricule: toStringValue(record.matricule, ''),
      fullName: toStringValue(record.fullName, ''),
      direction: toStringValue(record.direction, ''),
      unit: toStringValue(record.unit, ''),
      position: toStringValue(record.position, ''),
      status: toStringValue(record.status, ''),
      manager: toStringValue(record.manager, ''),
      email: toStringValue(record.email, ''),
      phone: toStringValue(record.phone, ''),
      photoUrl: toStringValue(record.photoUrl, './assets/images/faces/profile.jpg'),
      identity: normalizeIdentityInfo(record.identity),
      administrative: normalizeAdministrativeInfo(record.administrative),
      educations: normalizeEducations(record.educations),
      competencies: normalizeCompetencies(record.competencies),
      dependents: normalizeDependents(record.dependents),
      careerEvents: Array.isArray(record.careerEvents) ? record.careerEvents : [],
      documents: mapAgentDocuments(Array.isArray(record.documents) ? record.documents : []),
    };
  }

  private toDetail(record: LocalAgentRecord): AgentDetail {
    return {
      id: record.id,
      matricule: record.matricule,
      fullName: record.fullName,
      direction: record.direction,
      position: record.position,
      unit: record.unit,
      status: record.status,
      manager: record.manager,
      email: record.email,
      phone: record.phone,
      photoUrl: record.photoUrl,
      identity: normalizeIdentityInfo(record.identity),
      administrative: normalizeAdministrativeInfo(record.administrative),
      educations: normalizeEducations(record.educations),
      competencies: normalizeCompetencies(record.competencies),
      dependents: normalizeDependents(record.dependents),
      careerEvents: record.careerEvents || [],
      documents: mapAgentDocuments(record.documents || []),
    };
  }

  private generateAgentId(): string {
    return `local-${Date.now()}`;
  }

  private generateMatricule(): string {
    const suffix = `${Date.now()}`.slice(-6);
    return `PRM-${suffix}`;
  }

  private normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private buildLocalDigitalBadge(agent: LocalAgentRecord | undefined, fallbackAgentId: string): AgentDigitalBadge {
    const issuedAt = new Date().toISOString();
    const expiresAtDate = new Date();
    expiresAtDate.setFullYear(expiresAtDate.getFullYear() + 1);
    const agentId = String(agent?.id || fallbackAgentId || '').trim();
    const badgeId = `BADGE-${String(agent?.matricule || agentId || 'AGENT').replace(/[^A-Z0-9-]/gi, '').toUpperCase()}`;
    const verificationCode = this.simpleHash(`${agentId}:${agent?.fullName || ''}:${issuedAt}`).slice(0, 12).toUpperCase();
    const signatureHash = this.simpleHash(
      [badgeId, agentId, agent?.matricule || '', agent?.fullName || '', issuedAt, expiresAtDate.toISOString()].join('|')
    );
    const qrPayload = JSON.stringify({
      type: 'GPA-GOUVE-BADGE',
      agentId,
      matricule: agent?.matricule || '',
      fullName: agent?.fullName || '',
      direction: agent?.direction || '',
      badgeId,
      verificationCode,
      signatureHash,
    });

    return {
      agentId,
      badgeId,
      issuedAt,
      expiresAt: expiresAtDate.toISOString(),
      status: 'ACTIVE',
      verificationCode,
      signatureHash,
      qrPayload,
    };
  }

  private simpleHash(value: string): string {
    let hash = 0;
    const input = String(value || '');
    for (let index = 0; index < input.length; index += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private buildApiUrl(path: string): string {
    const base = environment.api.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  private hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }
}

function mapAgentCareerEvents(events: AgentCareerEventDto[]): AgentCareerEvent[] {
  return (events || []).map((event) => ({
    title: toStringValue(readField(event, ['title', 'label'], '')),
    description: toStringValue(readField(event, ['description', 'detail'], '')),
    date: toStringValue(readField(event, ['date', 'eventDate', 'event_date'], '')),
  }));
}

function mapAgentDocuments(documents: AgentDocumentDto[]): AgentDocument[] {
  return (documents || []).map((doc) => ({
    type: toStringValue(readField(doc, ['type', 'category'], '')),
    reference: toStringValue(readField(doc, ['reference', 'ref'], '')),
    status: toStringValue(readField(doc, ['status'], '')),
    required: Boolean(readField(doc, ['required'], false)),
    expiresAt: toStringValue(
      readField(doc, ['expiresAt', 'expires_at', 'expirationDate', 'expiration_date'], ''),
      ''
    ),
    fileName: toStringValue(readField(doc, ['fileName', 'file_name'], '')),
    fileDataUrl: toStringValue(
      readField(doc, ['fileDataUrl', 'file_data_url', 'dataUrl', 'data_url', 'url'], ''),
      ''
    ),
  }));
}

function normalizeIdentityInfo(raw: any): AgentIdentityInfo {
  return {
    identityType: toStringValue(readField(raw, ['identityType', 'identity_type', 'type'], ''), ''),
    identityNumber: toStringValue(readField(raw, ['identityNumber', 'identity_number', 'number'], ''), ''),
    birthDate: toStringValue(readField(raw, ['birthDate', 'birth_date'], ''), ''),
    birthPlace: toStringValue(readField(raw, ['birthPlace', 'birth_place'], ''), ''),
    nationality: toStringValue(readField(raw, ['nationality'], ''), ''),
  };
}

function normalizeAdministrativeInfo(raw: any): AgentAdministrativeInfo {
  return {
    hireDate: toStringValue(readField(raw, ['hireDate', 'hire_date'], ''), ''),
    contractType: toStringValue(readField(raw, ['contractType', 'contract_type'], ''), ''),
    address: toStringValue(readField(raw, ['address'], ''), ''),
    emergencyContactName: toStringValue(readField(raw, ['emergencyContactName', 'emergency_contact_name'], ''), ''),
    emergencyContactPhone: toStringValue(
      readField(raw, ['emergencyContactPhone', 'emergency_contact_phone'], ''),
      ''
    ),
  };
}

function normalizeEducations(raw: any): AgentEducation[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => ({
      degree: toStringValue(readField(item, ['degree', 'diploma'], ''), ''),
      field: toStringValue(readField(item, ['field', 'speciality', 'specialty'], ''), ''),
      institution: toStringValue(readField(item, ['institution', 'school'], ''), ''),
      graduationYear: toStringValue(readField(item, ['graduationYear', 'graduation_year', 'year'], ''), ''),
    }))
    .filter((item) => item.degree || item.institution || item.field || item.graduationYear);
}

function normalizeCompetencyLevel(value: unknown): AgentCompetency['level'] {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.includes('expert')) {
    return 'Expert';
  }
  if (normalized.includes('avance') || normalized.includes('avancé') || normalized.includes('senior')) {
    return 'Avance';
  }
  if (normalized.includes('inter')) {
    return 'Intermediaire';
  }
  return 'Debutant';
}

function normalizeCompetencies(raw: any): AgentCompetency[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item, index) => {
      const label = toStringValue(readField(item, ['label', 'name'], ''), '').trim();
      return {
        id: toStringValue(readField(item, ['id'], ''), '').trim() || `skill-${index + 1}`,
        label,
        category: toStringValue(readField(item, ['category'], ''), '').trim() || 'Metier',
        level: normalizeCompetencyLevel(readField(item, ['level'], 'Debutant')),
        lastAssessedAt: toStringValue(
          readField(item, ['lastAssessedAt', 'last_assessed_at'], ''),
          ''
        ).trim(),
      } as AgentCompetency;
    })
    .filter((item) => !!item.label);
}

function normalizeDependentStatus(value: unknown): AgentDependent['coverageStatus'] {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.includes('suspend')) {
    return 'Suspendu';
  }
  if (normalized.includes('expir')) {
    return 'Expire';
  }
  return 'Actif';
}

function normalizeDependents(raw: any): AgentDependent[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item, index) => {
      const fullName = toStringValue(readField(item, ['fullName', 'full_name', 'name'], ''), '').trim();
      return {
        id: toStringValue(readField(item, ['id'], ''), '').trim() || `dep-${index + 1}`,
        fullName,
        relationship: toStringValue(readField(item, ['relationship', 'lien'], ''), '').trim(),
        birthDate: toStringValue(readField(item, ['birthDate', 'birth_date'], ''), '').trim(),
        coverageType: toStringValue(readField(item, ['coverageType', 'coverage_type'], ''), '').trim() || 'Sociale',
        coverageStatus: normalizeDependentStatus(readField(item, ['coverageStatus', 'coverage_status'], 'Actif')),
        phone: toStringValue(readField(item, ['phone'], ''), '').trim(),
      } as AgentDependent;
    })
    .filter((item) => !!item.fullName);
}

function mapAgentListDtos(items: AgentListItemDto[]): AgentListItem[] {
  return items.map((dto) => ({
    id: toStringValue(readField(dto, ['id', 'matricule', 'employeeId', 'employee_id'], '')),
    matricule: toStringValue(readField(dto, ['matricule', 'employeeId', 'employee_id'], '')),
    fullName: toStringValue(readField(dto, ['fullName', 'full_name'], '')),
    direction: toStringValue(readField(dto, ['direction', 'directionName', 'direction_name'], '')),
    unit: toStringValue(readField(dto, ['unit', 'unitName', 'unit_name'], '')),
    position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')),
    status: toStringValue(readField(dto, ['status'], '')),
    manager: toStringValue(readField(dto, ['manager', 'managerName', 'manager_name'], '')),
    contractType: toStringValue(readField(dto, ['contractType', 'contract_type'], '')),
    photoUrl: toStringValue(readField(dto, ['photoUrl', 'photo_url'], './assets/images/faces/profile.jpg')),
    hireDate: toStringValue(readField(dto, ['hireDate', 'hire_date'], ''), '') || undefined,
    contractEndDate:
      toStringValue(readField(dto, ['contractEndDate', 'contract_end_date'], ''), '') || undefined,
    retirementDate:
      toStringValue(readField(dto, ['retirementDate', 'retirement_date'], ''), '') || undefined,
    documents: Array.isArray((dto as { documents?: unknown }).documents)
      ? mapAgentDocuments(readField(dto, ['documents'], []))
      : undefined,
  }));
}

function mapAgentDuplicateIndexDtos(items: AgentDuplicateIndexItemDto[]): AgentDuplicateIndexItem[] {
  return (items || [])
    .map((dto) => ({
      id: toStringValue(readField(dto, ['id', 'matricule'], '')),
      fullName: toStringValue(readField(dto, ['fullName', 'full_name'], '')),
      matricule: toStringValue(readField(dto, ['matricule'], '')),
      email: toStringValue(readField(dto, ['email'], '')),
      identityNumber: toStringValue(readField(dto, ['identityNumber', 'identity_number'], '')),
    }))
    .filter((item) => !!item.id);
}

function normalizeAgentListPayload(payload: unknown): AgentListItemDto[] {
  let raw = payload as any;

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return raw as AgentListItemDto[];
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const nested = readField(raw as Record<string, unknown>, ['items', 'data', 'results', 'records'], []);
  return Array.isArray(nested) ? (nested as AgentListItemDto[]) : [];
}

function normalizeTurnoverRiskPayload(payload: unknown): PersonnelTurnoverRiskItemDto[] {
  let raw = payload as any;

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return raw as PersonnelTurnoverRiskItemDto[];
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const nested = readField(raw as Record<string, unknown>, ['items', 'data', 'results', 'records'], []);
  return Array.isArray(nested) ? (nested as PersonnelTurnoverRiskItemDto[]) : [];
}

function normalizeAgentDuplicateIndexPayload(payload: unknown): AgentDuplicateIndexItem[] {
  let raw = payload as any;

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return mapAgentDuplicateIndexDtos(raw as AgentDuplicateIndexItemDto[]);
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const nested = readField(raw as Record<string, unknown>, ['items', 'data', 'results', 'records'], []);
  if (Array.isArray(nested)) {
    return mapAgentDuplicateIndexDtos(nested as AgentDuplicateIndexItemDto[]);
  }

  return [];
}

function normalizeAgentDuplicateCaseField(value: unknown): AgentDuplicateCaseField {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'email') {
    return 'email';
  }
  if (normalized === 'identitynumber' || normalized === 'identity_number') {
    return 'identityNumber';
  }
  return 'fullName';
}

function mapAgentDuplicateCaseAgentSummaryDtos(
  items: AgentDuplicateCaseAgentSummaryDto[]
): AgentDuplicateCaseAgentSummary[] {
  return (items || [])
    .map((dto) => ({
      id: toStringValue(readField(dto, ['id'], ''), '').trim(),
      matricule: toStringValue(readField(dto, ['matricule'], ''), '').trim(),
      fullName: toStringValue(readField(dto, ['fullName', 'full_name'], ''), '').trim(),
      direction: toStringValue(readField(dto, ['direction'], ''), '').trim(),
      unit: toStringValue(readField(dto, ['unit'], ''), '').trim(),
      position: toStringValue(readField(dto, ['position'], ''), '').trim(),
      status: toStringValue(readField(dto, ['status'], ''), '').trim(),
      manager: toStringValue(readField(dto, ['manager'], ''), '').trim(),
      email: toStringValue(readField(dto, ['email'], ''), '').trim(),
      identityNumber: toStringValue(readField(dto, ['identityNumber', 'identity_number'], ''), '').trim(),
      phone: toStringValue(readField(dto, ['phone'], ''), '').trim(),
      contractType: toStringValue(readField(dto, ['contractType', 'contract_type'], ''), '').trim(),
    }))
    .filter((item) => !!item.id);
}

function mapAgentDuplicateCaseDtos(items: AgentDuplicateCaseDto[]): AgentDuplicateCase[] {
  return (items || [])
    .map((dto, index) => {
      const duplicateField = normalizeAgentDuplicateCaseField(
        readField(dto, ['duplicateField', 'duplicate_field'], '')
      );
      const duplicateValue = toStringValue(
        readField(dto, ['duplicateValue', 'duplicate_value'], ''),
        ''
      ).trim();
      const agents = mapAgentDuplicateCaseAgentSummaryDtos(
        Array.isArray(readField(dto, ['agents'], []))
          ? (readField(dto, ['agents'], []) as AgentDuplicateCaseAgentSummaryDto[])
          : []
      );
      const confidenceParsed = Number(readField(dto, ['confidenceScore', 'confidence_score'], 0));
      const impactedParsed = Number(readField(dto, ['impactedCount', 'impacted_count'], 0));
      const confidenceScore = Number.isFinite(confidenceParsed) ? Math.max(0, Math.round(confidenceParsed)) : 0;
      const impactedCount = Number.isFinite(impactedParsed)
        ? Math.max(agents.length, Math.round(impactedParsed))
        : agents.length;
      const reference =
        toStringValue(readField(dto, ['reference'], ''), '').trim() ||
        `DUP-${duplicateField}-${index + 1}`;
      const createdAt =
        toStringValue(readField(dto, ['createdAt', 'created_at'], ''), '').trim() ||
        new Date().toISOString();
      return {
        reference,
        duplicateField,
        duplicateValue,
        confidenceScore,
        impactedCount,
        createdAt,
        agents,
      } as AgentDuplicateCase;
    })
    .filter((item) => item.agents.length >= 2 && !!item.duplicateValue);
}

function normalizeAgentDuplicateCasesPayload(payload: unknown): AgentDuplicateCase[] {
  let raw = payload as any;

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return mapAgentDuplicateCaseDtos(raw as AgentDuplicateCaseDto[]);
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const nested = readField(raw as Record<string, unknown>, ['items', 'data', 'results', 'records'], []);
  if (Array.isArray(nested)) {
    return mapAgentDuplicateCaseDtos(nested as AgentDuplicateCaseDto[]);
  }

  return [];
}

function normalizeAgentAuditSourceValue(value: unknown): 'update' | 'merge' | 'system' {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'merge') {
    return 'merge';
  }
  if (normalized === 'system') {
    return 'system';
  }
  return 'update';
}

function mapAgentAuditFieldChangeDtos(items: AgentAuditFieldChangeDto[]): AgentAuditFieldChange[] {
  return (items || [])
    .map((dto) => ({
      field: toStringValue(readField(dto, ['field'], ''), '').trim(),
      label: toStringValue(readField(dto, ['label'], ''), '').trim(),
      before: toStringValue(readField(dto, ['before'], ''), '').trim(),
      after: toStringValue(readField(dto, ['after'], ''), '').trim(),
    }))
    .filter((item) => !!item.field || !!item.before || !!item.after);
}

function mapAgentAuditTrailDtos(items: AgentAuditEventDto[]): AgentAuditEvent[] {
  return (items || [])
    .map((dto, index) => {
      const changes = mapAgentAuditFieldChangeDtos(
        Array.isArray(readField(dto, ['changes'], []))
          ? (readField(dto, ['changes'], []) as AgentAuditFieldChangeDto[])
          : []
      );
      const reference =
        toStringValue(readField(dto, ['reference'], ''), '').trim() ||
        `AG-AUD-${Date.now()}-${index + 1}`;
      const changedAt =
        toStringValue(readField(dto, ['changedAt', 'changed_at'], ''), '').trim() ||
        new Date().toISOString();
      return {
        reference,
        agentId: toStringValue(readField(dto, ['agentId', 'agent_id'], ''), '').trim(),
        agentLabel: toStringValue(readField(dto, ['agentLabel', 'agent_label'], ''), '').trim(),
        changedAt,
        changedBy: toStringValue(readField(dto, ['changedBy', 'changed_by'], 'system'), 'system').trim() || 'system',
        source: normalizeAgentAuditSourceValue(readField(dto, ['source'], 'update')),
        reason: toStringValue(readField(dto, ['reason'], 'mise_a_jour_fiche'), 'mise_a_jour_fiche').trim() || 'mise_a_jour_fiche',
        changes,
      } as AgentAuditEvent;
    })
    .filter((item) => !!item.reference && !!item.agentId && item.changes.length > 0);
}

function normalizeAgentAuditTrailPayload(payload: unknown): AgentAuditEvent[] {
  let raw = payload as any;

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return mapAgentAuditTrailDtos(raw as AgentAuditEventDto[]);
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const nested = readField(raw as Record<string, unknown>, ['items', 'data', 'results', 'records'], []);
  if (Array.isArray(nested)) {
    return mapAgentAuditTrailDtos(nested as AgentAuditEventDto[]);
  }

  return [];
}

function normalizeAgentDocumentComplianceStatus(
  value: unknown
): AgentDocumentComplianceStatusApi {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'EXPIRING_SOON' || normalized === 'WARNING') {
    return 'EXPIRING_SOON';
  }
  if (normalized === 'EXPIRED') {
    return 'EXPIRED';
  }
  if (normalized === 'MISSING') {
    return 'MISSING';
  }
  if (normalized === 'PENDING_VALIDATION' || normalized === 'REVIEW_REQUIRED') {
    return 'PENDING_VALIDATION';
  }
  return 'COMPLIANT';
}

function normalizeAgentDocumentComplianceApiPayload(
  payload: AgentDocumentComplianceSummaryDto,
  fallbackAgentId = ''
): AgentDocumentComplianceSummaryApi {
  let raw = payload as unknown;

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = {};
    }
  }

  const dto = (raw && typeof raw === 'object' ? raw : {}) as AgentDocumentComplianceSummaryDto;
  const summaryRaw = readField(dto, ['summary'], {});
  const summarySource =
    summaryRaw && typeof summaryRaw === 'object' && !Array.isArray(summaryRaw)
      ? (summaryRaw as Record<string, unknown>)
      : {};

  const itemsRaw = readField(dto, ['items'], []);
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((item) => {
      const row = item as AgentDocumentComplianceItemDto;
      return {
        documentTypeCode: toStringValue(
          readField(row, ['documentTypeCode', 'document_type_code'], ''),
          ''
        ).trim(),
        documentTypeLabel: toStringValue(
          readField(row, ['documentTypeLabel', 'document_type_label'], ''),
          ''
        ).trim(),
        requirementScope: toStringValue(
          readField(row, ['requirementScope', 'requirement_scope'], 'GLOBAL'),
          'GLOBAL'
        ).trim() || 'GLOBAL',
        complianceStatus: normalizeAgentDocumentComplianceStatus(
          readField(row, ['complianceStatus', 'compliance_status'], 'COMPLIANT')
        ),
        documentReference: toStringValue(
          readField(row, ['documentReference', 'document_reference'], ''),
          ''
        ).trim(),
        expiresOn: toStringValue(readField(row, ['expiresOn', 'expires_on'], ''), '').trim(),
        dueOn: toStringValue(readField(row, ['dueOn', 'due_on'], ''), '').trim(),
      };
    })
    : [];

  const countOf = (key: string, fallback: number): number => {
    const parsed = Number(summarySource[key]);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
  };

  return {
    employeeId: toStringValue(readField(dto, ['employeeId', 'employee_id'], fallbackAgentId), fallbackAgentId).trim(),
    summary: {
      requiredCount: countOf('requiredCount', items.length),
      compliantCount: countOf(
        'compliantCount',
        items.filter((item) => item.complianceStatus === 'COMPLIANT').length
      ),
      missingCount: countOf(
        'missingCount',
        items.filter((item) => item.complianceStatus === 'MISSING').length
      ),
      expiredCount: countOf(
        'expiredCount',
        items.filter((item) => item.complianceStatus === 'EXPIRED').length
      ),
      expiringSoonCount: countOf(
        'expiringSoonCount',
        items.filter((item) => item.complianceStatus === 'EXPIRING_SOON').length
      ),
    },
    items,
  };
}

function normalizeAgentDigitalBadgeStatus(value: unknown): AgentDigitalBadge['status'] {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'SUSPENDED') {
    return 'SUSPENDED';
  }
  if (normalized === 'EXPIRED') {
    return 'EXPIRED';
  }
  return 'ACTIVE';
}

function normalizeAgentDigitalBadgePayload(
  payload: AgentDigitalBadgeDto,
  fallbackAgentId = ''
): AgentDigitalBadge {
  const dto = (payload && typeof payload === 'object' ? payload : {}) as AgentDigitalBadgeDto;
  return {
    agentId: toStringValue(readField(dto, ['agentId', 'agent_id'], fallbackAgentId), fallbackAgentId).trim(),
    badgeId: toStringValue(readField(dto, ['badgeId', 'badge_id'], ''), '').trim(),
    issuedAt: toStringValue(readField(dto, ['issuedAt', 'issued_at'], ''), '').trim(),
    expiresAt: toStringValue(readField(dto, ['expiresAt', 'expires_at'], ''), '').trim(),
    status: normalizeAgentDigitalBadgeStatus(readField(dto, ['status'], 'ACTIVE')),
    verificationCode: toStringValue(
      readField(dto, ['verificationCode', 'verification_code'], ''),
      ''
    ).trim(),
    signatureHash: toStringValue(readField(dto, ['signatureHash', 'signature_hash'], ''), '').trim(),
    qrPayload: toStringValue(readField(dto, ['qrPayload', 'qr_payload'], ''), '').trim(),
  };
}

function normalizeAgentMatriculeSuggestionPayload(payload: unknown): AgentMatriculeSuggestion {
  const dto = (payload && typeof payload === 'object' ? payload : {}) as AgentMatriculeSuggestionDto;

  const nextNumberRaw = Number(readField(dto, ['nextNumber', 'next_number'], 1));
  const nextNumber = Number.isFinite(nextNumberRaw) && nextNumberRaw > 0 ? Math.round(nextNumberRaw) : 1;
  const basedOnRaw = toStringValue(readField(dto, ['basedOn', 'based_on'], 'Global'), 'Global').trim();
  const basedOn: AgentMatriculeSuggestion['basedOn'] =
    basedOnRaw === 'Direction+Unite' || basedOnRaw === 'Direction' ? basedOnRaw : 'Global';
  const matricule =
    toStringValue(readField(dto, ['matricule'], ''), '').trim() ||
    `PRM-${String(nextNumber).padStart(4, '0')}`;
  const scopeLabel = toStringValue(readField(dto, ['scopeLabel', 'scope_label'], 'Global'), 'Global').trim() || 'Global';

  return {
    matricule,
    scopeLabel,
    basedOn,
    nextNumber,
  };
}

function mapAgentDetailDto(dto: AgentDetailDto, fallbackId = ''): AgentDetail {
  return {
    id: toStringValue(readField(dto, ['id', 'matricule', 'employeeId', 'employee_id'], fallbackId)),
    matricule: toStringValue(readField(dto, ['matricule', 'employeeId', 'employee_id'], '')),
    fullName: toStringValue(readField(dto, ['fullName', 'full_name'], '')),
    direction: toStringValue(readField(dto, ['direction', 'directionName', 'direction_name'], '')),
    position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')),
    unit: toStringValue(readField(dto, ['unit', 'unitName', 'unit_name'], '')),
    status: toStringValue(readField(dto, ['status'], '')),
    manager: toStringValue(readField(dto, ['manager', 'managerName', 'manager_name'], '')),
    email: toStringValue(readField(dto, ['email'], '')),
    phone: toStringValue(readField(dto, ['phone', 'mobile'], '')),
    photoUrl: toStringValue(readField(dto, ['photoUrl', 'photo_url'], './assets/images/faces/profile.jpg')),
    identity: normalizeIdentityInfo(readField(dto, ['identity'], {})),
    administrative: normalizeAdministrativeInfo(readField(dto, ['administrative'], {})),
    educations: normalizeEducations(
      readField(dto, ['educations', 'educationHistory', 'education_history'], [])
    ),
    competencies: normalizeCompetencies(readField(dto, ['competencies', 'skills'], [])),
    dependents: normalizeDependents(readField(dto, ['dependents', 'beneficiaries'], [])),
    careerEvents: mapAgentCareerEvents(readField(dto, ['careerEvents', 'career_events'], [])),
    documents: mapAgentDocuments(readField(dto, ['documents'], [])),
  };
}
