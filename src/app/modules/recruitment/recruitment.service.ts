import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toStringValue } from '../../core/utils/dto.utils';

export type RecruitmentApplicationStatus = 'Nouveau' | 'Preselection' | 'Entretien' | 'Retenu' | 'Rejete';

export const RECRUITMENT_APPLICATION_STATUSES: RecruitmentApplicationStatus[] = [
  'Nouveau',
  'Preselection',
  'Entretien',
  'Retenu',
  'Rejete',
];

export type RecruitmentApplicationSource = 'Portail RH' | 'Jobboard' | 'Cooptation' | 'Cabinet' | 'Interne' | 'Autre';

export const RECRUITMENT_APPLICATION_SOURCES: RecruitmentApplicationSource[] = [
  'Portail RH',
  'Jobboard',
  'Cooptation',
  'Cabinet',
  'Interne',
  'Autre',
];

export type RecruitmentNotificationType =
  | 'Relance entretien'
  | 'Relance validation'
  | 'Alerte SLA candidature';

export type RecruitmentNotificationSeverity = 'Info' | 'Alerte' | 'Critique';

export type RecruitmentNotificationDeliveryStatus = 'Envoyee' | 'En attente' | 'Echec';

export interface RecruitmentNotificationEntry {
  id: string;
  type: RecruitmentNotificationType;
  severity: RecruitmentNotificationSeverity;
  status: RecruitmentNotificationDeliveryStatus;
  channel: string;
  recipient: string;
  reference?: string;
  candidate?: string;
  campaign?: string;
  message: string;
  trigger: string;
  sentAt: string;
}

export type RecruitmentAuditAction =
  | 'APPLICATION_CREATED'
  | 'APPLICATION_STATUS_UPDATED'
  | 'APPLICATION_COMMENT_ADDED'
  | 'CAMPAIGN_CREATED'
  | 'ONBOARDING_CREATED'
  | 'NOTIFICATION_SENT';

export type RecruitmentAuditOutcome = 'SUCCESS' | 'DENIED' | 'FAILED';

export interface RecruitmentAuditLogEntry {
  id: string;
  action: RecruitmentAuditAction;
  entityType: 'Application' | 'Campaign' | 'Onboarding' | 'Notification';
  entityId?: string;
  actor: string;
  outcome: RecruitmentAuditOutcome;
  detail: string;
  createdAt: string;
}

export type OnboardingTaskStatus = 'A faire' | 'En cours' | 'Termine' | 'Bloquee';

export type OnboardingEscalationLevel = 'N1' | 'N2' | 'N3';

export interface OnboardingTaskEscalation {
  level: OnboardingEscalationLevel;
  triggeredAt: string;
  delayDays: number;
  target: string;
}

export interface OnboardingChecklistTask {
  label: string;
  assignedTo: string;
  status: OnboardingTaskStatus;
  dueDate?: string;
  blockedReason?: string;
  blockedSince?: string;
  escalation?: OnboardingTaskEscalation;
}

export interface OnboardingChecklistProgress {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  todo: number;
  completionRate: number;
  status: 'Non demarre' | 'En cours' | 'Termine' | 'Bloque';
}

export interface OnboardingHistoryEvent {
  id: string;
  type: 'Blocage' | 'Deblocage' | 'Escalade auto';
  taskLabel: string;
  detail: string;
  occurredAt: string;
  escalationLevel?: OnboardingEscalationLevel;
}

export interface ApplicationStatusHistoryEntry {
  fromStatus: RecruitmentApplicationStatus | null;
  toStatus: RecruitmentApplicationStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface ApplicationCommentEntry {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface ApplicationAttachmentEntry {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface Application {
  reference: string;
  candidate: string;
  candidateEmail?: string;
  candidatePhone?: string;
  identityNumber?: string;
  position: string;
  campaign: string;
  source: RecruitmentApplicationSource;
  status: RecruitmentApplicationStatus;
  receivedOn: string;
  experienceYears?: number;
  skillsMatch?: number;
  educationLevel?: number;
  interviewAverage?: number;
  testScore?: number;
  statusHistory?: ApplicationStatusHistoryEntry[];
  comments?: ApplicationCommentEntry[];
  attachments?: ApplicationAttachmentEntry[];
}

export interface Campaign {
  code: string;
  title: string;
  department: string;
  openings: number;
  startDate: string;
  endDate: string;
  status: string;
  needPosition: string;
  needQuota: number;
  needDeadline: string;
  needOwner: string;
}

export interface OnboardingItem {
  agent: string;
  position: string;
  startDate: string;
  checklist: string[];
  checklistTasks?: OnboardingChecklistTask[];
  progress?: OnboardingChecklistProgress;
  templateId?: string;
  history?: OnboardingHistoryEvent[];
  blockedTasksCount?: number;
  escalatedTasksCount?: number;
  status: string;
  applicationReference?: string;
}

export interface CreateApplicationPayload {
  reference?: string;
  candidate: string;
  candidateEmail?: string;
  candidatePhone?: string;
  identityNumber?: string;
  position: string;
  campaign: string;
  source: RecruitmentApplicationSource | string;
  status?: RecruitmentApplicationStatus | string;
  receivedOn: string;
  experienceYears?: number;
  skillsMatch?: number;
  educationLevel?: number;
  interviewAverage?: number;
  testScore?: number;
  allowDuplicate?: boolean;
  attachments?: ApplicationAttachmentEntry[];
}

export interface UpdateApplicationStatusPayload {
  status: RecruitmentApplicationStatus | string;
  note?: string;
  changedBy?: string;
}

export interface CreateApplicationCommentPayload {
  message: string;
  author?: string;
}

export interface CreateCampaignPayload {
  code?: string;
  title: string;
  department: string;
  openings: number;
  startDate: string;
  endDate: string;
  status?: string;
  needPosition: string;
  needQuota: number;
  needDeadline: string;
  needOwner: string;
}

export interface CreateOnboardingPayload {
  agent: string;
  position: string;
  startDate: string;
  checklist?: string[];
  checklistTasks?: OnboardingChecklistTask[];
  templateId?: string;
  history?: OnboardingHistoryEvent[];
  status?: string;
  applicationReference?: string;
}

export interface RecruitmentApplicationsQuery extends CollectionQueryOptions {
  status?: string;
  campaign?: string;
  position?: string;
  source?: string;
  receivedFrom?: string;
  receivedTo?: string;
}

export interface RecruitmentCampaignsQuery extends CollectionQueryOptions {
  status?: string;
  department?: string;
}

export interface RecruitmentOnboardingQuery extends CollectionQueryOptions {
  status?: string;
  agent?: string;
}

export interface RecruitmentNotificationsQuery extends CollectionQueryOptions {
  type?: string;
  severity?: string;
  status?: string;
  reference?: string;
}

export interface RecruitmentAuditLogsQuery extends CollectionQueryOptions {
  action?: string;
  actor?: string;
  entityType?: string;
  outcome?: string;
  reference?: string;
}

export interface RecruitmentScoringCriterion {
  key: 'experienceYears' | 'skillsMatch' | 'educationLevel' | 'interviewAverage' | 'testScore';
  label: string;
  weight: number;
  maxYears?: number;
}

export interface RecruitmentScoringPolicy {
  criteria: RecruitmentScoringCriterion[];
  updatedAt: string;
  updatedBy: string;
}

export interface RecruitmentApplicationScoreDetail {
  criterionKey: RecruitmentScoringCriterion['key'];
  criterionLabel: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  justification: string;
}

export interface RecruitmentApplicationScoreEntry {
  reference: string;
  candidate: string;
  position: string;
  campaign: string;
  status: RecruitmentApplicationStatus;
  receivedOn: string;
  totalScore: number;
  rank: number;
  details: RecruitmentApplicationScoreDetail[];
}

export interface RecruitmentApplicationScoresResponse {
  policyUpdatedAt: string;
  criteria: RecruitmentScoringCriterion[];
  items: RecruitmentApplicationScoreEntry[];
}

export interface RecruitmentApplicationScoresQuery extends CollectionQueryOptions {
  campaign?: string;
  position?: string;
  includeStatuses?: RecruitmentApplicationStatus[];
}

export interface RecruitmentShortlistSuggestionRequest {
  topN?: number;
  campaign?: string;
  position?: string;
  includeStatuses?: RecruitmentApplicationStatus[];
}

export interface RecruitmentShortlistSuggestion {
  reference: string;
  candidate: string;
  position: string;
  campaign: string;
  status: RecruitmentApplicationStatus;
  receivedOn: string;
  totalScore: number;
  rank: number;
  details: RecruitmentApplicationScoreDetail[];
  justification: string;
  validationRequired: boolean;
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  validatedAt?: string;
  validatedBy?: string;
  validationNote?: string;
}

export interface RecruitmentShortlistSuggestionResponse {
  generatedAt: string;
  topN: number;
  totalCandidates: number;
  criteriaVersion: string;
  suggested: RecruitmentShortlistSuggestion[];
}

export interface RecruitmentShortlistValidationEntry {
  reference: string;
  decision: 'VALIDATED' | 'REJECTED';
  note?: string;
  validatedAt: string;
  validatedBy: string;
}

export interface RecruitmentDuplicateCandidateMatch {
  reference: string;
  candidate: string;
  status: RecruitmentApplicationStatus;
  campaign: string;
  position: string;
  matchTypes: Array<'email' | 'phone' | 'identity'>;
}

export interface RecruitmentDuplicateCase {
  id: string;
  matchType: 'email' | 'phone' | 'identity';
  matchLabel: string;
  matchValue: string;
  count: number;
  suggestedPrimaryReference?: string;
  applications: Array<{
    reference: string;
    candidate: string;
    status: RecruitmentApplicationStatus;
    campaign: string;
    position: string;
  }>;
}

export interface RecruitmentDuplicateLink {
  id: string;
  primaryReference: string;
  secondaryReference: string;
  mode: 'link' | 'merge';
  reason: string;
  linkedAt: string;
  linkedBy: string;
}

export interface RecruitmentDuplicateLinkResult {
  link: RecruitmentDuplicateLink;
  primary: Application;
  secondary: Application;
}

export interface RecruitmentInterviewQuestionTemplate {
  id: string;
  position: string;
  version: number;
  questions: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface RecruitmentInterviewQuestionImportResult {
  importedCount: number;
  errors: string[];
  items: RecruitmentInterviewQuestionTemplate[];
}

export interface RecruitmentInterviewQuestionExportResult {
  format: 'csv' | 'json';
  content: string;
  itemsCount: number;
  exportedAt: string;
}

export type RecruitmentInterviewStatus = 'Planifie' | 'Replanifie' | 'Termine' | 'Annule';

export interface RecruitmentInterviewEvaluation {
  interviewer: string;
  technicalScore: number;
  communicationScore: number;
  cultureFitScore: number;
  recommendation: 'Go' | 'No-Go';
  comment: string;
  submittedAt: string;
}

export interface RecruitmentInterviewConsolidation {
  evaluators: number;
  overallScore: number;
  recommendation: 'Go' | 'No-Go' | 'Pending';
}

export interface RecruitmentInterviewHistoryEvent {
  type: string;
  detail: string;
  at: string;
  actor: string;
}

export interface RecruitmentInterviewSchedule {
  id: string;
  applicationReference: string;
  candidate: string;
  position: string;
  campaign: string;
  slotStart: string;
  slotEnd: string;
  interviewers: string[];
  location: string;
  status: RecruitmentInterviewStatus;
  evaluations: RecruitmentInterviewEvaluation[];
  history: RecruitmentInterviewHistoryEvent[];
  consolidation: RecruitmentInterviewConsolidation;
}

export interface RecruitmentInterviewsQuery extends CollectionQueryOptions {
  applicationReference?: string;
  campaign?: string;
  status?: string;
}

export interface CreateRecruitmentInterviewPayload {
  applicationReference: string;
  slotStart: string;
  slotEnd: string;
  interviewers: string[];
  location?: string;
}

export interface RescheduleRecruitmentInterviewPayload {
  slotStart: string;
  slotEnd: string;
  interviewers?: string[];
  location?: string;
  reason?: string;
}

export interface CreateRecruitmentInterviewEvaluationPayload {
  interviewer: string;
  technicalScore: number;
  communicationScore: number;
  cultureFitScore: number;
  recommendation?: 'Go' | 'No-Go';
  comment?: string;
}

export interface RecruitmentWorkloadForecastEntry {
  recruiter: string;
  targetPerWeek: number;
  currentWeekLoad: number;
  upcomingTwoWeeksLoad: number;
  monthlyLoadEstimate: number;
  alert: 'OK' | 'Surcharge' | 'Sous-charge';
}

export interface RecruitmentWorkloadForecastResponse {
  generatedAt: string;
  items: RecruitmentWorkloadForecastEntry[];
}

export interface RecruitmentCampaignBudgetAnalyticsEntry {
  campaignCode: string;
  campaignTitle: string;
  budgetAmount: number;
  expensesAmount: number;
  variance: number;
  hires: number;
  applications: number;
  costPerApplication: number;
  costPerHire: number;
  currency: string;
  updatedAt: string;
  updatedBy: string;
}

export interface RecruitmentCampaignBudgetsResponse {
  generatedAt: string;
  items: RecruitmentCampaignBudgetAnalyticsEntry[];
}

export interface UpsertRecruitmentCampaignBudgetPayload {
  campaignCode: string;
  budgetAmount: number;
  expensesAmount: number;
  currency?: string;
}

export interface RecruitmentOnboardingMilestoneFeedback {
  id: string;
  applicationReference: string;
  day: 30 | 60 | 90;
  authorRole: 'manager' | 'agent';
  author: string;
  comment: string;
  score: number;
  createdAt: string;
}

export interface RecruitmentOnboardingMilestone {
  day: 30 | 60 | 90;
  targetDate: string;
  status: 'A venir' | 'Complete' | 'En retard';
  feedbacks: RecruitmentOnboardingMilestoneFeedback[];
}

export interface RecruitmentOnboarding306090Item {
  applicationReference: string;
  agent: string;
  position: string;
  startDate: string;
  milestones: RecruitmentOnboardingMilestone[];
}

export interface CreateRecruitmentOnboardingMilestoneFeedbackPayload {
  day: 30 | 60 | 90;
  authorRole: 'manager' | 'agent';
  comment: string;
  score: number;
}

export interface RecruitmentOnboardingSuccessScoreEntry {
  applicationReference: string;
  agent: string;
  position: string;
  cohort: string;
  completionRate: number;
  milestoneRate: number;
  blockedIncidents: number;
  score: number;
  alert: 'OK' | 'Alerte' | 'Critique';
}

export interface RecruitmentOnboardingSuccessScoresResponse {
  generatedAt: string;
  thresholds: {
    warning: number;
    critical: number;
  };
  items: RecruitmentOnboardingSuccessScoreEntry[];
}

export interface RecruitmentOnboardingSyncLogEntry {
  id: string;
  applicationReference: string;
  agent: string;
  position: string;
  syncedAt: string;
  syncedBy: string;
  dossierReference: string;
  affectationReference: string;
  status: string;
  detail: string;
}

export interface RecruitmentRuleEngineRule {
  id: string;
  name: string;
  event: string;
  condition: string;
  action: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateRecruitmentRuleEngineRulePayload {
  name: string;
  event: string;
  condition: string;
  action: string;
  enabled?: boolean;
}

export interface SimulateRecruitmentRuleEnginePayload {
  event: string;
  context?: Record<string, unknown>;
}

export interface RecruitmentRuleSimulationMatch {
  ruleId: string;
  ruleName: string;
  action: string;
  wouldExecute: boolean;
  reason: string;
  context: Record<string, unknown>;
}

export interface RecruitmentRuleEngineSimulationResult {
  event: string;
  simulatedAt: string;
  matches: RecruitmentRuleSimulationMatch[];
}

export interface RecruitmentRuleExecutionEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  event: string;
  executedAt: string;
  outcome: string;
  detail: string;
}

export interface RecruitmentControlTowerItem {
  reference: string;
  candidate: string;
  campaign: string;
  position: string;
  status: RecruitmentApplicationStatus;
  receivedOn: string;
  interviewStatus: string;
  interviewSlot: string;
  onboardingStatus: string;
  onboardingProgress: number;
}

export interface RecruitmentControlTowerSummary {
  totalApplications: number;
  interviewsPlanned: number;
  onboardingActive: number;
  retained: number;
}

export interface RecruitmentControlTowerResponse {
  summary: RecruitmentControlTowerSummary;
  items: RecruitmentControlTowerItem[];
}

export interface RecruitmentControlTowerQuery extends CollectionQueryOptions {
  campaign?: string;
  status?: string;
}

export interface RecruitmentExecutiveDashboardCampaignEntry {
  campaignCode: string;
  campaignTitle: string;
  total: number;
  retained: number;
  rejected: number;
  conversion: number;
}

export interface RecruitmentExecutiveDashboardResponse {
  generatedAt: string;
  kpis: {
    totalApplications: number;
    retained: number;
    conversionInterviewToRetained: number;
    averageTimeToHireDays: number;
  };
  byCampaign: RecruitmentExecutiveDashboardCampaignEntry[];
}

export interface RecruitmentExecutiveDashboardExportResult {
  format: 'csv' | 'pdf';
  content: string;
}

export interface RecruitmentBiExportResponse {
  exportedAt: string;
  schemaVersion: string;
  datasets: Record<string, unknown[]>;
}

export interface RecruitmentBiExportCsvResponse {
  format: 'csv';
  exportedAt: string;
  schemaVersion: string;
  content: string;
}

export interface RecruitmentBiExportLogEntry {
  id: string;
  createdAt: string;
  requestedBy: string;
  format: 'json' | 'csv';
  records: number;
  status: string;
}

export interface RecruitmentObservabilityEvent {
  id: string;
  source: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}

export interface RecruitmentObservabilitySnapshot {
  generatedAt: string;
  thresholds: {
    apiP95Ms: number;
    errorRatePercent: number;
    staleDataMinutes: number;
  };
  metrics: {
    apiP95Ms: number;
    errorRatePercent: number;
    staleDataMinutes: number;
    e2eCriticalPassRate: number;
  };
  alerts: string[];
  recentEvents: RecruitmentObservabilityEvent[];
}

export interface CreateRecruitmentObservabilityEventPayload {
  source: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
}

interface ApplicationDto {
  reference?: string;
  requestRef?: string;
  request_ref?: string;
  candidate?: string;
  candidateName?: string;
  candidate_name?: string;
  candidateEmail?: string;
  candidate_email?: string;
  email?: string;
  candidatePhone?: string;
  candidate_phone?: string;
  phone?: string;
  identityNumber?: string;
  identity_number?: string;
  identity?: string;
  position?: string;
  positionTitle?: string;
  position_title?: string;
  campaign?: string;
  campaignTitle?: string;
  campaign_title?: string;
  source?: string;
  sourceName?: string;
  source_name?: string;
  channel?: string;
  canal?: string;
  origin?: string;
  origine?: string;
  status?: string;
  receivedOn?: string;
  received_on?: string;
  experienceYears?: number | string;
  experience_years?: number | string;
  skillsMatch?: number | string;
  skills_match?: number | string;
  educationLevel?: number | string;
  education_level?: number | string;
  interviewAverage?: number | string;
  interview_average?: number | string;
  testScore?: number | string;
  test_score?: number | string;
  statusHistory?: ApplicationStatusHistoryDto[];
  status_history?: ApplicationStatusHistoryDto[];
  comments?: ApplicationCommentDto[];
  commentaries?: ApplicationCommentDto[];
  comments_history?: ApplicationCommentDto[];
  attachments?: ApplicationAttachmentDto[];
  files?: ApplicationAttachmentDto[];
  documents?: ApplicationAttachmentDto[];
}

interface ApplicationStatusHistoryDto {
  fromStatus?: string;
  from_status?: string;
  toStatus?: string;
  to_status?: string;
  changedAt?: string;
  changed_at?: string;
  changedBy?: string;
  changed_by?: string;
  note?: string;
}

interface ApplicationCommentDto {
  id?: string;
  author?: string;
  createdAt?: string;
  created_at?: string;
  message?: string;
  text?: string;
}

interface ApplicationAttachmentDto {
  id?: string;
  fileName?: string;
  file_name?: string;
  name?: string;
  url?: string;
  fileDataUrl?: string;
  file_data_url?: string;
  path?: string;
  mimeType?: string;
  mime_type?: string;
  size?: number | string;
  uploadedAt?: string;
  uploaded_at?: string;
}

interface RecruitmentUploadedFileDto {
  id?: string;
  fileName?: string;
  file_name?: string;
  mimeType?: string;
  mime_type?: string;
  size?: number | string;
  url?: string;
  path?: string;
  uploadedAt?: string;
  uploaded_at?: string;
}

interface CampaignDto {
  code?: string;
  title?: string;
  name?: string;
  department?: string;
  departmentName?: string;
  department_name?: string;
  openings?: number | string;
  openPositions?: number | string;
  open_positions?: number | string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  status?: string;
  needPosition?: string;
  need_position?: string;
  targetPosition?: string;
  target_position?: string;
  needQuota?: number | string;
  need_quota?: number | string;
  quota?: number | string;
  needDeadline?: string;
  need_deadline?: string;
  deadline?: string;
  needOwner?: string;
  need_owner?: string;
  owner?: string;
}

interface OnboardingDto {
  agent?: string;
  agentName?: string;
  agent_name?: string;
  position?: string;
  positionTitle?: string;
  position_title?: string;
  startDate?: string;
  start_date?: string;
  checklist?: string[];
  tasks?: string[];
  checklistTasks?: OnboardingChecklistTaskDto[];
  checklist_tasks?: OnboardingChecklistTaskDto[];
  tasksDetailed?: OnboardingChecklistTaskDto[];
  task_assignments?: OnboardingChecklistTaskDto[];
  progress?: OnboardingChecklistProgressDto;
  checklistProgress?: OnboardingChecklistProgressDto;
  checklist_progress?: OnboardingChecklistProgressDto;
  templateId?: string;
  template_id?: string;
  history?: OnboardingHistoryEventDto[];
  onboardingHistory?: OnboardingHistoryEventDto[];
  onboarding_history?: OnboardingHistoryEventDto[];
  blockedTasksCount?: number | string;
  blocked_tasks_count?: number | string;
  escalatedTasksCount?: number | string;
  escalated_tasks_count?: number | string;
  status?: string;
  applicationReference?: string;
  application_reference?: string;
  applicationRef?: string;
  application_ref?: string;
}

interface OnboardingChecklistTaskDto {
  label?: string;
  title?: string;
  name?: string;
  assignedTo?: string;
  assigned_to?: string;
  owner?: string;
  status?: string;
  dueDate?: string;
  due_date?: string;
  blockedReason?: string;
  blocked_reason?: string;
  blockReason?: string;
  block_reason?: string;
  blockedSince?: string;
  blocked_since?: string;
  blockedAt?: string;
  blocked_at?: string;
  escalation?: OnboardingTaskEscalationDto;
  escalationInfo?: OnboardingTaskEscalationDto;
  escalation_info?: OnboardingTaskEscalationDto;
}

interface OnboardingChecklistProgressDto {
  total?: number | string;
  completed?: number | string;
  inProgress?: number | string;
  in_progress?: number | string;
  blocked?: number | string;
  todo?: number | string;
  completionRate?: number | string;
  completion_rate?: number | string;
  status?: string;
}

interface OnboardingTaskEscalationDto {
  level?: string;
  triggeredAt?: string;
  triggered_at?: string;
  delayDays?: number | string;
  delay_days?: number | string;
  target?: string;
}

interface OnboardingHistoryEventDto {
  id?: string;
  type?: string;
  taskLabel?: string;
  task_label?: string;
  detail?: string;
  message?: string;
  occurredAt?: string;
  occurred_at?: string;
  escalationLevel?: string;
  escalation_level?: string;
}

interface RecruitmentNotificationDto {
  id?: string;
  type?: string;
  severity?: string;
  status?: string;
  channel?: string;
  recipient?: string;
  reference?: string;
  applicationReference?: string;
  application_reference?: string;
  candidate?: string;
  campaign?: string;
  message?: string;
  trigger?: string;
  sentAt?: string;
  sent_at?: string;
}

interface RecruitmentAuditLogDto {
  id?: string;
  action?: string;
  entityType?: string;
  entity_type?: string;
  entityId?: string;
  entity_id?: string;
  reference?: string;
  actor?: string;
  user?: string;
  username?: string;
  outcome?: string;
  status?: string;
  detail?: string;
  message?: string;
  createdAt?: string;
  created_at?: string;
}

interface RecruitmentScoringCriterionDto {
  key?: string;
  label?: string;
  weight?: number | string;
  maxYears?: number | string;
  max_years?: number | string;
}

interface RecruitmentScoringPolicyDto {
  criteria?: RecruitmentScoringCriterionDto[];
  updatedAt?: string;
  updated_at?: string;
  updatedBy?: string;
  updated_by?: string;
}

interface RecruitmentApplicationScoreDetailDto {
  criterionKey?: string;
  criterion_key?: string;
  criterionLabel?: string;
  criterion_label?: string;
  weight?: number | string;
  rawScore?: number | string;
  raw_score?: number | string;
  weightedScore?: number | string;
  weighted_score?: number | string;
  justification?: string;
}

interface RecruitmentApplicationScoreDto {
  reference?: string;
  candidate?: string;
  position?: string;
  campaign?: string;
  status?: string;
  receivedOn?: string;
  received_on?: string;
  totalScore?: number | string;
  total_score?: number | string;
  rank?: number | string;
  details?: RecruitmentApplicationScoreDetailDto[];
}

interface RecruitmentApplicationScoresResponseDto {
  policyUpdatedAt?: string;
  policy_updated_at?: string;
  criteria?: RecruitmentScoringCriterionDto[];
  items?: RecruitmentApplicationScoreDto[];
}

interface RecruitmentShortlistSuggestionDto extends RecruitmentApplicationScoreDto {
  justification?: string;
  validationRequired?: boolean;
  validation_required?: boolean;
  validationStatus?: string;
  validation_status?: string;
  validatedAt?: string;
  validated_at?: string;
  validatedBy?: string;
  validated_by?: string;
  validationNote?: string;
  validation_note?: string;
}

interface RecruitmentShortlistSuggestionResponseDto {
  generatedAt?: string;
  generated_at?: string;
  topN?: number | string;
  top_n?: number | string;
  totalCandidates?: number | string;
  total_candidates?: number | string;
  criteriaVersion?: string;
  criteria_version?: string;
  suggested?: RecruitmentShortlistSuggestionDto[];
}

interface RecruitmentShortlistValidationDto {
  reference?: string;
  decision?: string;
  note?: string;
  validatedAt?: string;
  validated_at?: string;
  validatedBy?: string;
  validated_by?: string;
}

interface RecruitmentDuplicateCaseDto {
  id?: string;
  matchType?: string;
  match_type?: string;
  matchLabel?: string;
  match_label?: string;
  matchValue?: string;
  match_value?: string;
  count?: number | string;
  suggestedPrimaryReference?: string;
  suggested_primary_reference?: string;
  applications?: Array<{
    reference?: string;
    candidate?: string;
    status?: string;
    campaign?: string;
    position?: string;
  }>;
}

interface RecruitmentDuplicateLinkDto {
  id?: string;
  primaryReference?: string;
  primary_reference?: string;
  secondaryReference?: string;
  secondary_reference?: string;
  mode?: string;
  reason?: string;
  linkedAt?: string;
  linked_at?: string;
  linkedBy?: string;
  linked_by?: string;
}

interface RecruitmentDuplicateLinkResultDto {
  link?: RecruitmentDuplicateLinkDto;
  primary?: ApplicationDto;
  secondary?: ApplicationDto;
}

interface RecruitmentInterviewQuestionTemplateDto {
  id?: string;
  position?: string;
  version?: number | string;
  questions?: string[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  createdBy?: string;
  created_by?: string;
}

interface RecruitmentInterviewQuestionImportResultDto {
  importedCount?: number | string;
  imported_count?: number | string;
  errors?: string[];
  items?: RecruitmentInterviewQuestionTemplateDto[];
}

interface RecruitmentInterviewQuestionExportResultDto {
  format?: string;
  content?: string;
  itemsCount?: number | string;
  items_count?: number | string;
  exportedAt?: string;
  exported_at?: string;
}

interface RecruitmentInterviewEvaluationDto {
  interviewer?: string;
  technicalScore?: number | string;
  technical_score?: number | string;
  communicationScore?: number | string;
  communication_score?: number | string;
  cultureFitScore?: number | string;
  culture_fit_score?: number | string;
  recommendation?: string;
  comment?: string;
  submittedAt?: string;
  submitted_at?: string;
}

interface RecruitmentInterviewConsolidationDto {
  evaluators?: number | string;
  overallScore?: number | string;
  overall_score?: number | string;
  recommendation?: string;
}

interface RecruitmentInterviewHistoryEventDto {
  type?: string;
  detail?: string;
  at?: string;
  occurredAt?: string;
  occurred_at?: string;
  actor?: string;
}

interface RecruitmentInterviewScheduleDto {
  id?: string;
  applicationReference?: string;
  application_reference?: string;
  candidate?: string;
  position?: string;
  campaign?: string;
  slotStart?: string;
  slot_start?: string;
  slotEnd?: string;
  slot_end?: string;
  interviewers?: string[];
  panel?: string[];
  location?: string;
  status?: string;
  evaluations?: RecruitmentInterviewEvaluationDto[];
  history?: RecruitmentInterviewHistoryEventDto[];
  consolidation?: RecruitmentInterviewConsolidationDto;
}

interface RecruitmentWorkloadForecastEntryDto {
  recruiter?: string;
  targetPerWeek?: number | string;
  target_per_week?: number | string;
  currentWeekLoad?: number | string;
  current_week_load?: number | string;
  upcomingTwoWeeksLoad?: number | string;
  upcoming_two_weeks_load?: number | string;
  monthlyLoadEstimate?: number | string;
  monthly_load_estimate?: number | string;
  alert?: string;
}

interface RecruitmentWorkloadForecastResponseDto {
  generatedAt?: string;
  generated_at?: string;
  items?: RecruitmentWorkloadForecastEntryDto[];
}

interface RecruitmentCampaignBudgetAnalyticsEntryDto {
  campaignCode?: string;
  campaign_code?: string;
  campaignTitle?: string;
  campaign_title?: string;
  budgetAmount?: number | string;
  budget_amount?: number | string;
  expensesAmount?: number | string;
  expenses_amount?: number | string;
  variance?: number | string;
  hires?: number | string;
  applications?: number | string;
  costPerApplication?: number | string;
  cost_per_application?: number | string;
  costPerHire?: number | string;
  cost_per_hire?: number | string;
  currency?: string;
  updatedAt?: string;
  updated_at?: string;
  updatedBy?: string;
  updated_by?: string;
}

interface RecruitmentCampaignBudgetsResponseDto {
  generatedAt?: string;
  generated_at?: string;
  items?: RecruitmentCampaignBudgetAnalyticsEntryDto[];
}

interface RecruitmentOnboardingMilestoneFeedbackDto {
  id?: string;
  applicationReference?: string;
  application_reference?: string;
  day?: number | string;
  authorRole?: string;
  author_role?: string;
  author?: string;
  comment?: string;
  score?: number | string;
  createdAt?: string;
  created_at?: string;
}

interface RecruitmentOnboardingMilestoneDto {
  day?: number | string;
  targetDate?: string;
  target_date?: string;
  status?: string;
  feedbacks?: RecruitmentOnboardingMilestoneFeedbackDto[];
}

interface RecruitmentOnboarding306090ItemDto {
  applicationReference?: string;
  application_reference?: string;
  agent?: string;
  position?: string;
  startDate?: string;
  start_date?: string;
  milestones?: RecruitmentOnboardingMilestoneDto[];
}

interface RecruitmentOnboardingSuccessScoreEntryDto {
  applicationReference?: string;
  application_reference?: string;
  agent?: string;
  position?: string;
  cohort?: string;
  completionRate?: number | string;
  completion_rate?: number | string;
  milestoneRate?: number | string;
  milestone_rate?: number | string;
  blockedIncidents?: number | string;
  blocked_incidents?: number | string;
  score?: number | string;
  alert?: string;
}

interface RecruitmentOnboardingSuccessScoresResponseDto {
  generatedAt?: string;
  generated_at?: string;
  thresholds?: {
    warning?: number | string;
    critical?: number | string;
  };
  items?: RecruitmentOnboardingSuccessScoreEntryDto[];
}

interface RecruitmentOnboardingSyncLogEntryDto {
  id?: string;
  applicationReference?: string;
  application_reference?: string;
  agent?: string;
  position?: string;
  syncedAt?: string;
  synced_at?: string;
  syncedBy?: string;
  synced_by?: string;
  dossierReference?: string;
  dossier_reference?: string;
  affectationReference?: string;
  affectation_reference?: string;
  status?: string;
  detail?: string;
}

interface RecruitmentRuleEngineRuleDto {
  id?: string;
  name?: string;
  event?: string;
  condition?: string;
  action?: string;
  enabled?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  createdBy?: string;
  created_by?: string;
}

interface RecruitmentRuleSimulationMatchDto {
  ruleId?: string;
  rule_id?: string;
  ruleName?: string;
  rule_name?: string;
  action?: string;
  wouldExecute?: boolean;
  would_execute?: boolean;
  reason?: string;
  context?: Record<string, unknown>;
}

interface RecruitmentRuleEngineSimulationResultDto {
  event?: string;
  simulatedAt?: string;
  simulated_at?: string;
  matches?: RecruitmentRuleSimulationMatchDto[];
}

interface RecruitmentRuleExecutionEntryDto {
  id?: string;
  ruleId?: string;
  rule_id?: string;
  ruleName?: string;
  rule_name?: string;
  event?: string;
  executedAt?: string;
  executed_at?: string;
  outcome?: string;
  detail?: string;
}

interface RecruitmentControlTowerSummaryDto {
  totalApplications?: number | string;
  total_applications?: number | string;
  interviewsPlanned?: number | string;
  interviews_planned?: number | string;
  onboardingActive?: number | string;
  onboarding_active?: number | string;
  retained?: number | string;
}

interface RecruitmentControlTowerItemDto {
  reference?: string;
  candidate?: string;
  campaign?: string;
  position?: string;
  status?: string;
  receivedOn?: string;
  received_on?: string;
  interviewStatus?: string;
  interview_status?: string;
  interviewSlot?: string;
  interview_slot?: string;
  onboardingStatus?: string;
  onboarding_status?: string;
  onboardingProgress?: number | string;
  onboarding_progress?: number | string;
}

interface RecruitmentControlTowerResponseDto {
  summary?: RecruitmentControlTowerSummaryDto;
  items?: RecruitmentControlTowerItemDto[];
}

interface RecruitmentExecutiveDashboardCampaignEntryDto {
  campaignCode?: string;
  campaign_code?: string;
  campaignTitle?: string;
  campaign_title?: string;
  total?: number | string;
  retained?: number | string;
  rejected?: number | string;
  conversion?: number | string;
}

interface RecruitmentExecutiveDashboardResponseDto {
  generatedAt?: string;
  generated_at?: string;
  kpis?: {
    totalApplications?: number | string;
    total_applications?: number | string;
    retained?: number | string;
    conversionInterviewToRetained?: number | string;
    conversion_interview_to_retained?: number | string;
    averageTimeToHireDays?: number | string;
    average_time_to_hire_days?: number | string;
  };
  byCampaign?: RecruitmentExecutiveDashboardCampaignEntryDto[];
  by_campaign?: RecruitmentExecutiveDashboardCampaignEntryDto[];
}

interface RecruitmentExecutiveDashboardExportResultDto {
  format?: string;
  content?: string;
}

interface RecruitmentBiExportResponseDto {
  exportedAt?: string;
  exported_at?: string;
  schemaVersion?: string;
  schema_version?: string;
  datasets?: Record<string, unknown[]>;
}

interface RecruitmentBiExportCsvResponseDto {
  format?: string;
  exportedAt?: string;
  exported_at?: string;
  schemaVersion?: string;
  schema_version?: string;
  content?: string;
}

interface RecruitmentBiExportLogEntryDto {
  id?: string;
  createdAt?: string;
  created_at?: string;
  requestedBy?: string;
  requested_by?: string;
  format?: string;
  records?: number | string;
  status?: string;
}

interface RecruitmentObservabilityEventDto {
  id?: string;
  source?: string;
  message?: string;
  severity?: string;
  createdAt?: string;
  created_at?: string;
}

interface RecruitmentObservabilitySnapshotDto {
  generatedAt?: string;
  generated_at?: string;
  thresholds?: {
    apiP95Ms?: number | string;
    api_p95_ms?: number | string;
    errorRatePercent?: number | string;
    error_rate_percent?: number | string;
    staleDataMinutes?: number | string;
    stale_data_minutes?: number | string;
  };
  metrics?: {
    apiP95Ms?: number | string;
    api_p95_ms?: number | string;
    errorRatePercent?: number | string;
    error_rate_percent?: number | string;
    staleDataMinutes?: number | string;
    stale_data_minutes?: number | string;
    e2eCriticalPassRate?: number | string;
    e2e_critical_pass_rate?: number | string;
  };
  alerts?: string[];
  recentEvents?: RecruitmentObservabilityEventDto[];
  recent_events?: RecruitmentObservabilityEventDto[];
}

@Injectable({ providedIn: 'root' })
export class RecruitmentService {
  private readonly localApplicationsKey = 'rh_dev_recruitment_applications';
  private readonly localCampaignsKey = 'rh_dev_recruitment_campaigns';
  private readonly localOnboardingKey = 'rh_dev_recruitment_onboarding';
  private readonly localScoringPolicyKey = 'rh_dev_recruitment_scoring_policy';
  private readonly localShortlistValidationsKey = 'rh_dev_recruitment_shortlist_validations';
  private readonly localDuplicateLinksKey = 'rh_dev_recruitment_duplicate_links';
  private readonly localInterviewQuestionBankKey = 'rh_dev_recruitment_interview_question_bank';
  private readonly localInterviewsKey = 'rh_dev_recruitment_interviews';
  private readonly localCampaignBudgetsKey = 'rh_dev_recruitment_campaign_budgets';
  private readonly localOnboardingMilestonesKey = 'rh_dev_recruitment_onboarding_milestones';
  private readonly localOnboardingSyncLogsKey = 'rh_dev_recruitment_onboarding_sync_logs';
  private readonly localRuleEngineRulesKey = 'rh_dev_recruitment_rule_engine_rules';
  private readonly localRuleExecutionsKey = 'rh_dev_recruitment_rule_executions';
  private readonly localBiExportLogsKey = 'rh_dev_recruitment_bi_export_logs';
  private readonly localObservabilityEventsKey = 'rh_dev_recruitment_observability_events';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly http = inject(HttpClient);
  private readonly apiClient = inject(ApiClientService);
  private readonly defaultScoringPolicy: RecruitmentScoringPolicy = {
    criteria: [
      { key: 'experienceYears', label: 'Experience pertinente', weight: 25, maxYears: 10 },
      { key: 'skillsMatch', label: 'Adequation competences', weight: 30 },
      { key: 'educationLevel', label: 'Niveau academique', weight: 15 },
      { key: 'interviewAverage', label: 'Evaluation entretien', weight: 20 },
      { key: 'testScore', label: 'Score test technique', weight: 10 },
    ],
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };
  private readonly applicationStatusTransitions: Record<
    RecruitmentApplicationStatus,
    RecruitmentApplicationStatus[]
  > = {
    Nouveau: ['Preselection', 'Rejete'],
    Preselection: ['Entretien', 'Rejete'],
    Entretien: ['Retenu', 'Rejete'],
    Retenu: [],
    Rejete: [],
  };

  getApplications(query?: RecruitmentApplicationsQuery): Observable<Application[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      campaign: query?.campaign,
      position: query?.position,
      source: query?.source,
      receivedFrom: query?.receivedFrom,
      receivedTo: query?.receivedTo,
    });

    return this.apiClient
      .get<ApplicationDto[]>(
        API_ENDPOINTS.recruitment.applications,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapApplications(items)),
        map((items) => this.mergeByKey(items, this.readLocalApplications(), (item) => item.reference)),
        map((items) => this.applyLocalApplicationsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalApplicationsQuery(this.readLocalApplications(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createApplication(payload: CreateApplicationPayload): Observable<Application> {
    const normalizedPayload = this.normalizeCreateApplicationPayload(payload);

    return this.apiClient
      .post<ApplicationDto, CreateApplicationPayload>(
        API_ENDPOINTS.recruitment.applications,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeApplication(dto)),
        map((item) => {
          if (item.reference && item.candidate && item.position) {
            return item;
          }
          return this.appendLocalApplication(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalApplication(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  updateApplicationStatus(reference: string, payload: UpdateApplicationStatusPayload): Observable<Application> {
    const normalizedReference = String(reference || '').trim().toUpperCase();
    const normalizedPayload = this.normalizeUpdateApplicationStatusPayload(payload);

    return this.apiClient
      .put<ApplicationDto, UpdateApplicationStatusPayload>(
        API_ENDPOINTS.recruitment.applicationStatus(normalizedReference),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeApplication(dto, normalizedReference)),
        map((item) => {
          if (item.reference && item.candidate && item.position) {
            return item;
          }
          return this.updateLocalApplicationStatus(normalizedReference, normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.updateLocalApplicationStatus(normalizedReference, normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  addApplicationComment(reference: string, payload: CreateApplicationCommentPayload): Observable<Application> {
    const normalizedReference = String(reference || '').trim().toUpperCase();
    const normalizedPayload = this.normalizeCreateApplicationCommentPayload(payload);

    return this.apiClient
      .post<ApplicationDto, CreateApplicationCommentPayload>(
        API_ENDPOINTS.recruitment.applicationComments(normalizedReference),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeApplication(dto, normalizedReference)),
        map((item) => {
          if (item.reference && item.candidate && item.position) {
            return item;
          }
          return this.addLocalApplicationComment(normalizedReference, normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.addLocalApplicationComment(normalizedReference, normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  uploadApplicationAttachment(file: File): Observable<ApplicationAttachmentEntry> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.apiClient
      .post<RecruitmentUploadedFileDto, FormData>(
        API_ENDPOINTS.recruitment.uploads,
        formData,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeUploadedAttachment(dto, file)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.buildLocalUploadedAttachment(file));
          }
          return throwError(() => error);
        })
      );
  }

  downloadAttachment(url: string): Observable<Blob> {
    const normalized = String(url || '').trim();
    if (!normalized || normalized.startsWith('blob:')) {
      return throwError(() => new Error('URL de téléchargement invalide'));
    }

    const requestUrl = /^https?:\/\//i.test(normalized) ? normalized : normalized.startsWith('/') ? normalized : `/${normalized}`;
    return this.http.get(requestUrl, { responseType: 'blob' });
  }

  getCampaigns(query?: RecruitmentCampaignsQuery): Observable<Campaign[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      department: query?.department,
    });

    return this.apiClient
      .get<CampaignDto[]>(
        API_ENDPOINTS.recruitment.campaigns,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapCampaigns(items)),
        map((items) => this.mergeByKey(items, this.readLocalCampaigns(), (item) => item.code)),
        map((items) => this.applyLocalCampaignsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalCampaignsQuery(this.readLocalCampaigns(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createCampaign(payload: CreateCampaignPayload): Observable<Campaign> {
    const normalizedPayload = this.normalizeCreateCampaignPayload(payload);

    return this.apiClient
      .post<CampaignDto, CreateCampaignPayload>(
        API_ENDPOINTS.recruitment.campaigns,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeCampaign(dto)),
        map((item) => {
          if (item.code && item.title && item.department) {
            return item;
          }
          return this.appendLocalCampaign(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalCampaign(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getOnboarding(query?: RecruitmentOnboardingQuery): Observable<OnboardingItem[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      agent: query?.agent,
    });

    return this.apiClient
      .get<OnboardingDto[]>(
        API_ENDPOINTS.recruitment.onboarding,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapOnboarding(items)),
        map((items) => this.mergeByKey(items, this.readLocalOnboarding(), (item) => this.buildOnboardingKey(item))),
        map((items) => this.applyLocalOnboardingQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalOnboardingQuery(this.readLocalOnboarding(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createOnboarding(payload: CreateOnboardingPayload): Observable<OnboardingItem> {
    const normalizedPayload = this.normalizeCreateOnboardingPayload(payload);

    return this.apiClient
      .post<OnboardingDto, CreateOnboardingPayload>(
        API_ENDPOINTS.recruitment.onboarding,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeOnboarding(dto)),
        map((item) => {
          if (item.agent && item.position && item.startDate) {
            return item;
          }
          return this.appendLocalOnboarding(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalOnboarding(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getNotifications(query?: RecruitmentNotificationsQuery): Observable<RecruitmentNotificationEntry[]> {
    const params = buildCollectionQueryParams(query, {
      type: query?.type,
      severity: query?.severity,
      status: query?.status,
      reference: query?.reference,
    });

    return this.apiClient
      .get<RecruitmentNotificationDto[]>(
        API_ENDPOINTS.recruitment.notifications,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentNotifications(items)),
        map((items) => this.applyLocalRecruitmentNotificationsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(
              this.applyLocalRecruitmentNotificationsQuery(
                this.buildLocalRecruitmentNotificationsJournal(),
                query
              )
            );
          }
          return throwError(() => error);
        })
      );
  }

  getAuditLogs(query?: RecruitmentAuditLogsQuery): Observable<RecruitmentAuditLogEntry[]> {
    const params = buildCollectionQueryParams(query, {
      action: query?.action,
      actor: query?.actor,
      entityType: query?.entityType,
      outcome: query?.outcome,
      reference: query?.reference,
    });

    return this.apiClient
      .get<RecruitmentAuditLogDto[]>(
        API_ENDPOINTS.recruitment.auditLogs,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentAuditLogs(items)),
        map((items) => this.applyLocalRecruitmentAuditLogsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(
              this.applyLocalRecruitmentAuditLogsQuery(
                this.buildLocalRecruitmentAuditLogs(),
                query
              )
            );
          }
          return throwError(() => error);
        })
      );
  }

  getScoringPolicy(): Observable<RecruitmentScoringPolicy> {
    return this.apiClient
      .get<RecruitmentScoringPolicyDto>(
        API_ENDPOINTS.recruitment.scoringPolicy,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentScoringPolicy(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.readLocalScoringPolicy());
          }
          return throwError(() => error);
        })
      );
  }

  updateScoringPolicy(criteria: RecruitmentScoringCriterion[]): Observable<RecruitmentScoringPolicy> {
    const payload = {
      criteria: this.normalizeRecruitmentScoringCriteria(criteria),
    };
    return this.apiClient
      .put<RecruitmentScoringPolicyDto, typeof payload>(
        API_ENDPOINTS.recruitment.scoringPolicy,
        payload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentScoringPolicy(dto)),
        map((policy) => {
          this.writeLocalScoringPolicy(policy);
          return policy;
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            const local = this.updateLocalScoringPolicy(payload.criteria);
            return of(local);
          }
          return throwError(() => error);
        })
      );
  }

  getApplicationScores(query?: RecruitmentApplicationScoresQuery): Observable<RecruitmentApplicationScoresResponse> {
    const includeStatuses = Array.isArray(query?.includeStatuses)
      ? query.includeStatuses.join(',')
      : undefined;
    const params = buildCollectionQueryParams(query, {
      campaign: query?.campaign,
      position: query?.position,
      includeStatuses,
    });

    return this.apiClient
      .get<RecruitmentApplicationScoresResponseDto>(
        API_ENDPOINTS.recruitment.applicationScores,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentApplicationScoresResponse(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.buildLocalRecruitmentApplicationScoresResponse(query));
          }
          return throwError(() => error);
        })
      );
  }

  suggestShortlist(
    payload: RecruitmentShortlistSuggestionRequest
  ): Observable<RecruitmentShortlistSuggestionResponse> {
    const normalizedPayload = {
      topN: this.toStrictPositiveInt(payload.topN, 5),
      campaign: this.normalizeOptionalText(payload.campaign),
      position: this.normalizeOptionalText(payload.position),
      includeStatuses: Array.isArray(payload.includeStatuses) ? payload.includeStatuses : undefined,
    };

    return this.apiClient
      .post<RecruitmentShortlistSuggestionResponseDto, typeof normalizedPayload>(
        API_ENDPOINTS.recruitment.shortlistSuggest,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentShortlistSuggestionResponse(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.buildLocalRecruitmentShortlistSuggestionResponse(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getShortlistValidations(query?: CollectionQueryOptions): Observable<RecruitmentShortlistValidationEntry[]> {
    const params = buildCollectionQueryParams(query);
    return this.apiClient
      .get<RecruitmentShortlistValidationDto[]>(
        API_ENDPOINTS.recruitment.shortlistValidations,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentShortlistValidations(items)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.readLocalShortlistValidations());
          }
          return throwError(() => error);
        })
      );
  }

  validateShortlistEntry(
    reference: string,
    payload: Pick<RecruitmentShortlistValidationEntry, 'decision' | 'note'>
  ): Observable<RecruitmentShortlistValidationEntry> {
    const normalizedReference = String(reference || '').trim().toUpperCase();
    const normalizedPayload: { decision: 'VALIDATED' | 'REJECTED'; note?: string } = {
      decision: payload.decision === 'REJECTED' ? 'REJECTED' : 'VALIDATED',
      note: this.normalizeOptionalText(payload.note),
    };
    return this.apiClient
      .post<RecruitmentShortlistValidationDto, typeof normalizedPayload>(
        API_ENDPOINTS.recruitment.shortlistValidate(normalizedReference),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentShortlistValidation(dto)),
        map((entry) => {
          this.upsertLocalShortlistValidation(entry);
          return entry;
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.upsertLocalShortlistValidation({
              reference: normalizedReference,
              decision: normalizedPayload.decision,
              note: normalizedPayload.note,
              validatedAt: new Date().toISOString(),
              validatedBy: 'system',
            }));
          }
          return throwError(() => error);
        })
      );
  }

  getDuplicateCases(query?: CollectionQueryOptions): Observable<RecruitmentDuplicateCase[]> {
    const params = buildCollectionQueryParams(query);
    return this.apiClient
      .get<RecruitmentDuplicateCaseDto[]>(
        API_ENDPOINTS.recruitment.applicationDuplicates,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentDuplicateCases(items)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.buildLocalRecruitmentDuplicateCases());
          }
          return throwError(() => error);
        })
      );
  }

  getDuplicateLinks(query?: CollectionQueryOptions): Observable<RecruitmentDuplicateLink[]> {
    const params = buildCollectionQueryParams(query);
    return this.apiClient
      .get<RecruitmentDuplicateLinkDto[]>(
        API_ENDPOINTS.recruitment.applicationDuplicateLinks,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentDuplicateLinks(items)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.readLocalDuplicateLinks());
          }
          return throwError(() => error);
        })
      );
  }

  linkDuplicateProfiles(payload: {
    primaryReference: string;
    secondaryReference: string;
    mode: 'link' | 'merge';
    reason?: string;
  }): Observable<RecruitmentDuplicateLinkResult> {
    const normalizedPayload: {
      primaryReference: string;
      secondaryReference: string;
      mode: 'link' | 'merge';
      reason: string;
    } = {
      primaryReference: String(payload.primaryReference || '').trim().toUpperCase(),
      secondaryReference: String(payload.secondaryReference || '').trim().toUpperCase(),
      mode: payload.mode === 'merge' ? 'merge' : 'link',
      reason: this.normalizeOptionalText(payload.reason) || 'Traitement dedoublonnage manuel',
    };

    return this.apiClient
      .post<RecruitmentDuplicateLinkResultDto, typeof normalizedPayload>(
        API_ENDPOINTS.recruitment.applicationDuplicateLinkAction,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentDuplicateLinkResult(dto)),
        map((result) => {
          this.upsertLocalDuplicateLink(result.link);
          return result;
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.resolveLocalDuplicateLink(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getInterviewQuestionBank(query?: CollectionQueryOptions & { position?: string; latestOnly?: boolean }): Observable<RecruitmentInterviewQuestionTemplate[]> {
    const params = buildCollectionQueryParams(query, {
      position: query?.position,
      latestOnly: query?.latestOnly ? 'true' : undefined,
    });
    return this.apiClient
      .get<RecruitmentInterviewQuestionTemplateDto[]>(
        API_ENDPOINTS.recruitment.interviewQuestionBank,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentInterviewQuestionTemplates(items)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.readLocalInterviewQuestionBank(query));
          }
          return throwError(() => error);
        })
      );
  }

  createInterviewQuestionTemplate(payload: {
    position: string;
    questions: string[];
  }): Observable<RecruitmentInterviewQuestionTemplate> {
    const normalizedPayload = {
      position: String(payload.position || '').trim(),
      questions: this.normalizeInterviewQuestionList(payload.questions),
    };
    return this.apiClient
      .post<RecruitmentInterviewQuestionTemplateDto, typeof normalizedPayload>(
        API_ENDPOINTS.recruitment.interviewQuestionBank,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentInterviewQuestionTemplate(dto)),
        map((item) => this.appendLocalInterviewQuestionTemplate(item)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.createLocalInterviewQuestionTemplate(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  importInterviewQuestionBank(payload: {
    format: 'csv' | 'json';
    content?: string;
    items?: Array<{ position: string; questions: string[] }>;
  }): Observable<RecruitmentInterviewQuestionImportResult> {
    const normalizedPayload: {
      format: 'csv' | 'json';
      content?: string;
      items?: Array<{ position: string; questions: string[] }>;
    } = {
      format: payload.format === 'csv' ? 'csv' : 'json',
      content: this.normalizeOptionalText(payload.content),
      items: Array.isArray(payload.items)
        ? payload.items.map((item) => ({
            position: String(item.position || '').trim(),
            questions: this.normalizeInterviewQuestionList(item.questions),
          }))
        : undefined,
    };
    return this.apiClient
      .post<RecruitmentInterviewQuestionImportResultDto, typeof normalizedPayload>(
        API_ENDPOINTS.recruitment.interviewQuestionBankImport,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentInterviewQuestionImportResult(dto)),
        map((result) => {
          if (result.items.length > 0) {
            this.writeLocalInterviewQuestionBank(
              this.mergeInterviewQuestionTemplates(this.readLocalInterviewQuestionBank(), result.items)
            );
          }
          return result;
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.importLocalInterviewQuestionBank(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  exportInterviewQuestionBank(params?: { format?: 'csv' | 'json'; position?: string; latestOnly?: boolean }): Observable<RecruitmentInterviewQuestionExportResult> {
    const queryParams = {
      format: params?.format === 'csv' ? 'csv' : 'json',
      position: this.normalizeOptionalText(params?.position),
      latestOnly: params?.latestOnly ? 'true' : undefined,
    };
    return this.apiClient
      .get<RecruitmentInterviewQuestionExportResultDto>(
        API_ENDPOINTS.recruitment.interviewQuestionBankExport,
        queryParams,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentInterviewQuestionExportResult(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.exportLocalInterviewQuestionBank(params));
          }
          return throwError(() => error);
        })
      );
  }

  getInterviews(query?: RecruitmentInterviewsQuery): Observable<RecruitmentInterviewSchedule[]> {
    const params = buildCollectionQueryParams(query, {
      applicationReference: query?.applicationReference,
      campaign: query?.campaign,
      status: query?.status,
    });

    return this.apiClient
      .get<RecruitmentInterviewScheduleDto[]>(
        API_ENDPOINTS.recruitment.interviews,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentInterviewSchedules(items)),
        map((items) => this.mergeByKey(items, this.readLocalInterviews(), (item) => item.id)),
        map((items) => this.applyLocalRecruitmentInterviewsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalRecruitmentInterviewsQuery(this.readLocalInterviews(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createInterview(payload: CreateRecruitmentInterviewPayload): Observable<RecruitmentInterviewSchedule> {
    const normalizedPayload = this.normalizeCreateRecruitmentInterviewPayload(payload);
    return this.apiClient
      .post<RecruitmentInterviewScheduleDto, CreateRecruitmentInterviewPayload>(
        API_ENDPOINTS.recruitment.interviews,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentInterviewSchedule(dto)),
        map((interview) => this.upsertLocalInterview(interview)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.createLocalInterview(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  rescheduleInterview(
    interviewId: string,
    payload: RescheduleRecruitmentInterviewPayload
  ): Observable<RecruitmentInterviewSchedule> {
    const normalizedInterviewId = String(interviewId || '').trim().toUpperCase();
    const normalizedPayload = this.normalizeRescheduleRecruitmentInterviewPayload(payload);
    return this.apiClient
      .post<RecruitmentInterviewScheduleDto, RescheduleRecruitmentInterviewPayload>(
        API_ENDPOINTS.recruitment.interviewReschedule(normalizedInterviewId),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentInterviewSchedule(dto, normalizedInterviewId)),
        map((interview) => this.upsertLocalInterview(interview)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.rescheduleLocalInterview(normalizedInterviewId, normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  addInterviewEvaluation(
    interviewId: string,
    payload: CreateRecruitmentInterviewEvaluationPayload
  ): Observable<RecruitmentInterviewSchedule> {
    const normalizedInterviewId = String(interviewId || '').trim().toUpperCase();
    const normalizedPayload = this.normalizeCreateRecruitmentInterviewEvaluationPayload(payload);
    return this.apiClient
      .post<RecruitmentInterviewScheduleDto, CreateRecruitmentInterviewEvaluationPayload>(
        API_ENDPOINTS.recruitment.interviewEvaluations(normalizedInterviewId),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentInterviewSchedule(dto, normalizedInterviewId)),
        map((interview) => this.upsertLocalInterview(interview)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalInterviewEvaluation(normalizedInterviewId, normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getCampaignWorkloadForecast(): Observable<RecruitmentWorkloadForecastResponse> {
    return this.apiClient
      .get<RecruitmentWorkloadForecastResponseDto>(
        API_ENDPOINTS.recruitment.campaignWorkloadForecast,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentWorkloadForecastResponse(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.buildLocalRecruitmentWorkloadForecastResponse());
          }
          return throwError(() => error);
        })
      );
  }

  getCampaignBudgets(): Observable<RecruitmentCampaignBudgetsResponse> {
    return this.apiClient
      .get<RecruitmentCampaignBudgetsResponseDto>(
        API_ENDPOINTS.recruitment.campaignBudgets,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentCampaignBudgetsResponse(dto)),
        map((response) => {
          if (response.items.length > 0) {
            this.writeLocalCampaignBudgets(response.items);
          }
          return response;
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of({
              generatedAt: new Date().toISOString(),
              items: this.readLocalCampaignBudgets(),
            });
          }
          return throwError(() => error);
        })
      );
  }

  upsertCampaignBudget(
    payload: UpsertRecruitmentCampaignBudgetPayload
  ): Observable<RecruitmentCampaignBudgetAnalyticsEntry> {
    const normalizedPayload = this.normalizeUpsertRecruitmentCampaignBudgetPayload(payload);
    return this.apiClient
      .post<RecruitmentCampaignBudgetAnalyticsEntryDto, UpsertRecruitmentCampaignBudgetPayload>(
        API_ENDPOINTS.recruitment.campaignBudgets,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentCampaignBudgetUpsertResult(dto, normalizedPayload)),
        map((item) => this.upsertLocalCampaignBudget(item)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.upsertLocalCampaignBudget(this.buildLocalCampaignBudgetFromPayload(normalizedPayload)));
          }
          return throwError(() => error);
        })
      );
  }

  getOnboarding306090(query?: CollectionQueryOptions): Observable<RecruitmentOnboarding306090Item[]> {
    const params = buildCollectionQueryParams(query);
    return this.apiClient
      .get<RecruitmentOnboarding306090ItemDto[]>(
        API_ENDPOINTS.recruitment.onboarding306090,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentOnboarding306090(items)),
        map((items) => {
          if (items.length > 0) {
            this.writeLocalOnboardingMilestones(items);
          }
          return items;
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.readLocalOnboardingMilestones(query));
          }
          return throwError(() => error);
        })
      );
  }

  addOnboardingMilestoneFeedback(
    applicationReference: string,
    payload: CreateRecruitmentOnboardingMilestoneFeedbackPayload
  ): Observable<RecruitmentOnboardingMilestoneFeedback> {
    const normalizedReference = String(applicationReference || '').trim().toUpperCase();
    const normalizedPayload = this.normalizeCreateRecruitmentOnboardingMilestoneFeedbackPayload(payload);
    return this.apiClient
      .post<RecruitmentOnboardingMilestoneFeedbackDto, CreateRecruitmentOnboardingMilestoneFeedbackPayload>(
        API_ENDPOINTS.recruitment.onboarding306090Feedback(normalizedReference),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentOnboardingMilestoneFeedback(dto, normalizedReference, normalizedPayload)),
        map((feedback) => {
          this.appendLocalOnboardingMilestoneFeedback(feedback);
          return feedback;
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.createLocalOnboardingMilestoneFeedback(normalizedReference, normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getOnboardingSuccessScores(): Observable<RecruitmentOnboardingSuccessScoresResponse> {
    return this.apiClient
      .get<RecruitmentOnboardingSuccessScoresResponseDto>(
        API_ENDPOINTS.recruitment.onboardingSuccessScores,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentOnboardingSuccessScoresResponse(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.buildLocalRecruitmentOnboardingSuccessScoresResponse());
          }
          return throwError(() => error);
        })
      );
  }

  getOnboardingSyncLogs(query?: CollectionQueryOptions): Observable<RecruitmentOnboardingSyncLogEntry[]> {
    const params = buildCollectionQueryParams(query);
    return this.apiClient
      .get<RecruitmentOnboardingSyncLogEntryDto[]>(
        API_ENDPOINTS.recruitment.onboardingSyncLogs,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentOnboardingSyncLogs(items)),
        map((items) => this.mergeByKey(items, this.readLocalOnboardingSyncLogs(), (item) => item.id)),
        map((items) => this.applyLocalOnboardingSyncLogsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalOnboardingSyncLogsQuery(this.readLocalOnboardingSyncLogs(), query));
          }
          return throwError(() => error);
        })
      );
  }

  runOnboardingSync(applicationReference: string): Observable<RecruitmentOnboardingSyncLogEntry> {
    const normalizedReference = String(applicationReference || '').trim().toUpperCase();
    return this.apiClient
      .post<RecruitmentOnboardingSyncLogEntryDto, Record<string, never>>(
        API_ENDPOINTS.recruitment.onboardingSync(normalizedReference),
        {},
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentOnboardingSyncLog(dto, normalizedReference)),
        map((entry) => this.appendLocalOnboardingSyncLog(entry)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.createLocalOnboardingSyncLog(normalizedReference));
          }
          return throwError(() => error);
        })
      );
  }

  getRuleEngineRules(query?: CollectionQueryOptions): Observable<RecruitmentRuleEngineRule[]> {
    const params = buildCollectionQueryParams(query);
    return this.apiClient
      .get<RecruitmentRuleEngineRuleDto[]>(
        API_ENDPOINTS.recruitment.ruleEngineRules,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentRuleEngineRules(items)),
        map((items) => this.mergeByKey(items, this.readLocalRuleEngineRules(), (item) => item.id)),
        map((items) => this.applyLocalRuleEngineRulesQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalRuleEngineRulesQuery(this.readLocalRuleEngineRules(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createRuleEngineRule(
    payload: CreateRecruitmentRuleEngineRulePayload
  ): Observable<RecruitmentRuleEngineRule> {
    const normalizedPayload = this.normalizeCreateRecruitmentRuleEngineRulePayload(payload);
    return this.apiClient
      .post<RecruitmentRuleEngineRuleDto, CreateRecruitmentRuleEngineRulePayload>(
        API_ENDPOINTS.recruitment.ruleEngineRules,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentRuleEngineRule(dto)),
        map((rule) => this.upsertLocalRuleEngineRule(rule)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.createLocalRuleEngineRule(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  simulateRuleEngine(
    payload: SimulateRecruitmentRuleEnginePayload
  ): Observable<RecruitmentRuleEngineSimulationResult> {
    const normalizedPayload = this.normalizeSimulateRecruitmentRuleEnginePayload(payload);
    return this.apiClient
      .post<RecruitmentRuleEngineSimulationResultDto, SimulateRecruitmentRuleEnginePayload>(
        API_ENDPOINTS.recruitment.ruleEngineSimulate,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentRuleEngineSimulationResult(dto)),
        map((result) => {
          if (result.matches.length > 0) {
            const now = result.simulatedAt || new Date().toISOString();
            result.matches.forEach((match) => {
              this.appendLocalRuleExecution({
                id: '',
                ruleId: match.ruleId,
                ruleName: match.ruleName,
                event: result.event,
                executedAt: now,
                outcome: 'SIMULATED',
                detail: match.reason,
              });
            });
          }
          return result;
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.simulateLocalRuleEngine(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getRuleEngineExecutions(query?: CollectionQueryOptions): Observable<RecruitmentRuleExecutionEntry[]> {
    const params = buildCollectionQueryParams(query);
    return this.apiClient
      .get<RecruitmentRuleExecutionEntryDto[]>(
        API_ENDPOINTS.recruitment.ruleEngineExecutions,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentRuleExecutions(items)),
        map((items) => this.mergeByKey(items, this.readLocalRuleExecutions(), (item) => item.id)),
        map((items) => this.applyLocalRuleExecutionsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalRuleExecutionsQuery(this.readLocalRuleExecutions(), query));
          }
          return throwError(() => error);
        })
      );
  }

  getControlTowerView(query?: RecruitmentControlTowerQuery): Observable<RecruitmentControlTowerResponse> {
    const params = buildCollectionQueryParams(query, {
      campaign: query?.campaign,
      status: query?.status,
    });
    return this.apiClient
      .get<RecruitmentControlTowerResponseDto>(
        API_ENDPOINTS.recruitment.controlTower,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentControlTowerResponse(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.buildLocalRecruitmentControlTowerResponse(query));
          }
          return throwError(() => error);
        })
      );
  }

  getExecutiveDashboard(): Observable<RecruitmentExecutiveDashboardResponse> {
    return this.apiClient
      .get<RecruitmentExecutiveDashboardResponseDto>(
        API_ENDPOINTS.recruitment.executiveDashboard,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentExecutiveDashboardResponse(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.buildLocalRecruitmentExecutiveDashboardResponse());
          }
          return throwError(() => error);
        })
      );
  }

  exportExecutiveDashboard(format: 'csv' | 'pdf'): Observable<RecruitmentExecutiveDashboardExportResult> {
    const exportFormat: 'csv' | 'pdf' = format === 'pdf' ? 'pdf' : 'csv';
    const params = { format: exportFormat };
    return this.apiClient
      .get<RecruitmentExecutiveDashboardExportResultDto>(
        API_ENDPOINTS.recruitment.executiveDashboardExport,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentExecutiveDashboardExportResult(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.exportLocalExecutiveDashboard(params.format));
          }
          return throwError(() => error);
        })
      );
  }

  exportBiData(format: 'json' | 'csv'): Observable<RecruitmentBiExportResponse | RecruitmentBiExportCsvResponse> {
    const exportFormat: 'json' | 'csv' = format === 'csv' ? 'csv' : 'json';
    const params = { format: exportFormat };
    return this.apiClient
      .get<RecruitmentBiExportResponseDto | RecruitmentBiExportCsvResponseDto>(
        API_ENDPOINTS.recruitment.biExport,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentBiExportResponse(dto, params.format)),
        map((payload) => {
          const records = 'datasets' in payload
            ? Object.values(payload.datasets).reduce((sum, dataset) => sum + dataset.length, 0)
            : this.toNonNegativeInt(
              String(payload.content || '')
                .split('\n')
                .slice(1)
                .reduce((sum, row) => {
                  const parts = row.split(';');
                  return sum + this.toNonNegativeInt(parts[1], 0);
                }, 0),
              0
            );
          this.appendLocalBiExportLog({
            id: '',
            createdAt: new Date().toISOString(),
            requestedBy: 'frontend',
            format: params.format,
            records,
            status: 'SUCCESS',
          });
          return payload;
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.exportLocalBiData(params.format));
          }
          return throwError(() => error);
        })
      );
  }

  getBiExportLogs(query?: CollectionQueryOptions): Observable<RecruitmentBiExportLogEntry[]> {
    const params = buildCollectionQueryParams(query);
    return this.apiClient
      .get<RecruitmentBiExportLogEntryDto[]>(
        API_ENDPOINTS.recruitment.biExportLogs,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRecruitmentBiExportLogs(items)),
        map((items) => this.mergeByKey(items, this.readLocalBiExportLogs(), (item) => item.id)),
        map((items) => this.applyLocalBiExportLogsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalBiExportLogsQuery(this.readLocalBiExportLogs(), query));
          }
          return throwError(() => error);
        })
      );
  }

  getObservabilitySnapshot(): Observable<RecruitmentObservabilitySnapshot> {
    return this.apiClient
      .get<RecruitmentObservabilitySnapshotDto>(
        API_ENDPOINTS.recruitment.observability,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentObservabilitySnapshot(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.buildLocalRecruitmentObservabilitySnapshot());
          }
          return throwError(() => error);
        })
      );
  }

  pushObservabilityEvent(
    payload: CreateRecruitmentObservabilityEventPayload
  ): Observable<RecruitmentObservabilityEvent> {
    const normalizedPayload = this.normalizeCreateRecruitmentObservabilityEventPayload(payload);
    return this.apiClient
      .post<RecruitmentObservabilityEventDto, CreateRecruitmentObservabilityEventPayload>(
        API_ENDPOINTS.recruitment.observabilityEvents,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRecruitmentObservabilityEvent(dto)),
        map((event) => this.appendLocalObservabilityEvent(event)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.createLocalObservabilityEvent(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  private mapRecruitmentNotifications(items: RecruitmentNotificationDto[]): RecruitmentNotificationEntry[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((dto) => this.normalizeRecruitmentNotification(dto))
      .filter((item) => !!item.id && !!item.message);
  }

  private normalizeRecruitmentNotification(dto: RecruitmentNotificationDto): RecruitmentNotificationEntry {
    const type = this.normalizeRecruitmentNotificationType(
      readField(dto, ['type'], 'Alerte SLA candidature'),
      'Alerte SLA candidature'
    );
    const severity = this.normalizeRecruitmentNotificationSeverity(
      readField(dto, ['severity'], 'Alerte'),
      'Alerte'
    );
    const status = this.normalizeRecruitmentNotificationDeliveryStatus(
      readField(dto, ['status'], 'Envoyee'),
      'Envoyee'
    );
    const reference = this.normalizeOptionalText(
      toStringValue(
        readField(dto, ['reference', 'applicationReference', 'application_reference'], '')
      ).trim().toUpperCase()
    );
    const candidate = this.normalizeOptionalText(toStringValue(readField(dto, ['candidate'], '')).trim());
    const campaign = this.normalizeOptionalText(toStringValue(readField(dto, ['campaign'], '')).trim());
    const sentAt = this.normalizeHistoryChangedAt(
      toStringValue(readField(dto, ['sentAt', 'sent_at'], '')).trim(),
      ''
    );
    const message = toStringValue(readField(dto, ['message'], '')).trim();
    const trigger = toStringValue(readField(dto, ['trigger'], '')).trim() || 'Automatique';
    const channel = this.normalizeOptionalText(toStringValue(readField(dto, ['channel'], '')).trim()) || 'Email';
    const recipient = this.normalizeOptionalText(toStringValue(readField(dto, ['recipient'], '')).trim()) || 'responsable.rh';
    const id = this.normalizeOptionalText(toStringValue(readField(dto, ['id'], '')).trim())
      || `${type}-${reference || candidate || campaign || 'GLOBAL'}-${sentAt}`.replace(/\s+/g, '-').toUpperCase();

    return {
      id,
      type,
      severity,
      status,
      channel,
      recipient,
      reference,
      candidate,
      campaign,
      message: message || `${type} ${reference || candidate || ''}`.trim(),
      trigger,
      sentAt,
    };
  }

  private normalizeRecruitmentNotificationType(
    value: unknown,
    fallback: RecruitmentNotificationType
  ): RecruitmentNotificationType {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    if (normalized === 'relance entretien' || normalized === 'entretien reminder') return 'Relance entretien';
    if (normalized === 'relance validation' || normalized === 'validation reminder') return 'Relance validation';
    if (
      normalized === 'alerte sla candidature' ||
      normalized === 'sla alert' ||
      normalized === 'alerte sla'
    ) {
      return 'Alerte SLA candidature';
    }
    return fallback;
  }

  private normalizeRecruitmentNotificationSeverity(
    value: unknown,
    fallback: RecruitmentNotificationSeverity
  ): RecruitmentNotificationSeverity {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    if (normalized === 'info') return 'Info';
    if (normalized === 'alerte' || normalized === 'warning') return 'Alerte';
    if (normalized === 'critique' || normalized === 'critical') return 'Critique';
    return fallback;
  }

  private normalizeRecruitmentNotificationDeliveryStatus(
    value: unknown,
    fallback: RecruitmentNotificationDeliveryStatus
  ): RecruitmentNotificationDeliveryStatus {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    if (normalized === 'envoyee' || normalized === 'envoye' || normalized === 'sent') return 'Envoyee';
    if (normalized === 'en attente' || normalized === 'pending') return 'En attente';
    if (normalized === 'echec' || normalized === 'failed') return 'Echec';
    return fallback;
  }

  private applyLocalRecruitmentNotificationsQuery(
    items: RecruitmentNotificationEntry[],
    query?: RecruitmentNotificationsQuery
  ): RecruitmentNotificationEntry[] {
    let next = [...items];
    const type = (query?.type || '').trim().toLowerCase();
    const severity = (query?.severity || '').trim().toLowerCase();
    const status = (query?.status || '').trim().toLowerCase();
    const reference = (query?.reference || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (type) {
      next = next.filter((item) => item.type.toLowerCase().includes(type));
    }
    if (severity) {
      next = next.filter((item) => item.severity.toLowerCase().includes(severity));
    }
    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (reference) {
      next = next.filter((item) => String(item.reference || '').toLowerCase().includes(reference));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.type.toLowerCase().includes(search) ||
          item.severity.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.channel.toLowerCase().includes(search) ||
          item.recipient.toLowerCase().includes(search) ||
          item.message.toLowerCase().includes(search) ||
          item.trigger.toLowerCase().includes(search) ||
          String(item.reference || '').toLowerCase().includes(search) ||
          String(item.candidate || '').toLowerCase().includes(search) ||
          String(item.campaign || '').toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'sentAt').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readRecruitmentNotificationField(left, sortBy);
      const rightValue = this.readRecruitmentNotificationField(right, sortBy);
      const leftText = String(leftValue).toLowerCase();
      const rightText = String(rightValue).toLowerCase();
      if (leftText === rightText) return 0;
      if (leftText < rightText) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 100);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readRecruitmentNotificationField(item: RecruitmentNotificationEntry, field: string): string {
    switch (field) {
      case 'type':
        return item.type;
      case 'severity':
        return item.severity;
      case 'status':
        return item.status;
      case 'channel':
        return item.channel;
      case 'recipient':
        return item.recipient;
      case 'reference':
        return item.reference || '';
      case 'candidate':
        return item.candidate || '';
      case 'campaign':
        return item.campaign || '';
      case 'sentAt':
        return item.sentAt;
      default:
        return '';
    }
  }

  private buildLocalRecruitmentNotificationsJournal(): RecruitmentNotificationEntry[] {
    const applications = this.readLocalApplications();
    const onboardingItems = this.readLocalOnboarding();
    const campaignsByCode = new Map(
      this.readLocalCampaigns().map((campaign) => [String(campaign.code || '').trim().toUpperCase(), campaign])
    );

    const slaThresholdByStatus: Partial<Record<RecruitmentApplicationStatus, number>> = {
      Nouveau: 3,
      Preselection: 4,
      Entretien: 5,
    };
    const interviewReminderDelayDays = 2;
    const validationReminderDelayDays = 1;
    const notifications: RecruitmentNotificationEntry[] = [];

    applications.forEach((application) => {
      const stageChangedAt = this.applicationStageChangedAt(application);
      const stageAgeDays = this.daysSinceDate(stageChangedAt);
      const campaignOwner = campaignsByCode.get(String(application.campaign || '').trim().toUpperCase())?.needOwner || 'responsable.rh';
      const slaThreshold = slaThresholdByStatus[application.status];

      if (typeof slaThreshold === 'number' && stageAgeDays > slaThreshold) {
        const overdueDays = stageAgeDays - slaThreshold;
        const sentAt = this.addDaysToIsoDateTime(stageChangedAt, slaThreshold) || new Date().toISOString();
        notifications.push({
          id: `REC-NOTIF-SLA-${application.reference}-${slaThreshold}`,
          type: 'Alerte SLA candidature',
          severity: overdueDays >= 3 ? 'Critique' : 'Alerte',
          status: 'Envoyee',
          channel: 'Email',
          recipient: campaignOwner,
          reference: application.reference,
          candidate: application.candidate,
          campaign: application.campaign,
          message: `SLA depasse sur ${application.reference} (${application.status}) de ${overdueDays} jour(s).`,
          trigger: `SLA etape ${application.status} depasse (${slaThreshold} jour(s))`,
          sentAt,
        });
      }

      if (application.status === 'Entretien' && stageAgeDays >= interviewReminderDelayDays) {
        const sentAt = this.addDaysToIsoDateTime(stageChangedAt, interviewReminderDelayDays) || new Date().toISOString();
        notifications.push({
          id: `REC-NOTIF-ENTRETIEN-${application.reference}-${interviewReminderDelayDays}`,
          type: 'Relance entretien',
          severity: stageAgeDays >= 6 ? 'Critique' : 'Alerte',
          status: 'Envoyee',
          channel: 'Email',
          recipient: campaignOwner,
          reference: application.reference,
          candidate: application.candidate,
          campaign: application.campaign,
          message: `Relance entretien pour ${application.candidate} (${application.reference}) en attente depuis ${stageAgeDays} jour(s).`,
          trigger: `Etape entretien non finalisee`,
          sentAt,
        });
      }

      if (application.status === 'Retenu' && stageAgeDays >= validationReminderDelayDays) {
        const hasOnboarding = onboardingItems.some((item) => {
          const onboardingReference = String(item.applicationReference || '').trim().toUpperCase();
          return onboardingReference === application.reference;
        });
        if (!hasOnboarding) {
          const sentAt = this.addDaysToIsoDateTime(stageChangedAt, validationReminderDelayDays) || new Date().toISOString();
          notifications.push({
            id: `REC-NOTIF-VALIDATION-${application.reference}-${validationReminderDelayDays}`,
            type: 'Relance validation',
            severity: stageAgeDays >= 4 ? 'Critique' : 'Alerte',
            status: 'Envoyee',
            channel: 'Email',
            recipient: campaignOwner,
            reference: application.reference,
            candidate: application.candidate,
            campaign: application.campaign,
            message: `Validation d integration en attente pour ${application.reference}.`,
            trigger: 'Candidature retenue sans integration planifiee',
            sentAt,
          });
        }
      }
    });

    onboardingItems.forEach((item) => {
      const taskList = Array.isArray(item.checklistTasks) ? item.checklistTasks : [];
      taskList.forEach((task) => {
        if (task.status !== 'Bloquee') {
          return;
        }
        const blockedSince = this.normalizeOnboardingDate(task.blockedSince || task.dueDate || item.startDate || '');
        if (!blockedSince) {
          return;
        }
        const blockedDays = this.daysSinceDate(blockedSince);
        if (blockedDays < 1) {
          return;
        }
        const reference = this.normalizeOptionalText(String(item.applicationReference || '').trim().toUpperCase());
        const sentAt = this.addDaysToIsoDateTime(blockedSince, 1) || new Date().toISOString();
        const escalationLevel = task.escalation?.level ? ` ${task.escalation.level}` : '';
        notifications.push({
          id: `REC-NOTIF-BLOCK-${reference || item.agent}-${task.label}-${blockedSince}`
            .replace(/\s+/g, '-')
            .toUpperCase(),
          type: 'Relance validation',
          severity: task.escalation?.level === 'N3' || blockedDays >= 5 ? 'Critique' : 'Alerte',
          status: 'Envoyee',
          channel: 'Email',
          recipient: task.assignedTo || 'RH Operations',
          reference,
          candidate: item.agent,
          campaign: undefined,
          message: `Blocage onboarding: ${task.label} pour ${item.agent}.${escalationLevel ? ` Escalade${escalationLevel}.` : ''}`,
          trigger: task.blockedReason || 'Tache onboarding bloquee',
          sentAt,
        });
      });
    });

    const deduped = new Map<string, RecruitmentNotificationEntry>();
    notifications.forEach((entry) => {
      const key = `${entry.type}|${entry.reference || ''}|${entry.candidate || ''}|${entry.message}|${entry.sentAt}`.toLowerCase();
      if (!deduped.has(key)) {
        deduped.set(key, entry);
      }
    });

    return Array.from(deduped.values()).sort((left, right) => {
      const leftTs = Date.parse(left.sentAt);
      const rightTs = Date.parse(right.sentAt);
      const safeLeft = Number.isNaN(leftTs) ? 0 : leftTs;
      const safeRight = Number.isNaN(rightTs) ? 0 : rightTs;
      return safeRight - safeLeft;
    });
  }

  private mapRecruitmentAuditLogs(items: RecruitmentAuditLogDto[]): RecruitmentAuditLogEntry[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((dto) => this.normalizeRecruitmentAuditLog(dto))
      .filter((item) => !!item.id && !!item.action && !!item.actor);
  }

  private normalizeRecruitmentAuditLog(dto: RecruitmentAuditLogDto): RecruitmentAuditLogEntry {
    const action = this.normalizeRecruitmentAuditAction(
      readField(dto, ['action'], 'APPLICATION_STATUS_UPDATED'),
      'APPLICATION_STATUS_UPDATED'
    );
    const entityType = this.normalizeRecruitmentAuditEntityType(
      readField(dto, ['entityType', 'entity_type'], 'Application'),
      'Application'
    );
    const entityId = this.normalizeOptionalText(
      toStringValue(readField(dto, ['entityId', 'entity_id', 'reference'], '')).trim().toUpperCase()
    );
    const actor = this.normalizeOptionalText(
      toStringValue(readField(dto, ['actor', 'user', 'username'], '')).trim()
    ) || 'system';
    const outcome = this.normalizeRecruitmentAuditOutcome(
      readField(dto, ['outcome', 'status'], 'SUCCESS'),
      'SUCCESS'
    );
    const detail = this.normalizeOptionalText(
      toStringValue(readField(dto, ['detail', 'message'], '')).trim()
    ) || `${action} ${entityId || ''}`.trim();
    const createdAt = this.normalizeHistoryChangedAt(
      toStringValue(readField(dto, ['createdAt', 'created_at'], '')).trim(),
      ''
    );
    const id = this.normalizeOptionalText(toStringValue(readField(dto, ['id'], '')).trim())
      || `${action}-${entityType}-${entityId || actor}-${createdAt}`.replace(/\s+/g, '-').toUpperCase();

    return {
      id,
      action,
      entityType,
      entityId,
      actor,
      outcome,
      detail,
      createdAt,
    };
  }

  private normalizeRecruitmentAuditAction(
    value: unknown,
    fallback: RecruitmentAuditAction
  ): RecruitmentAuditAction {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
    if (normalized === 'APPLICATION_CREATED') return 'APPLICATION_CREATED';
    if (normalized === 'APPLICATION_STATUS_UPDATED') return 'APPLICATION_STATUS_UPDATED';
    if (normalized === 'APPLICATION_COMMENT_ADDED') return 'APPLICATION_COMMENT_ADDED';
    if (normalized === 'CAMPAIGN_CREATED') return 'CAMPAIGN_CREATED';
    if (normalized === 'ONBOARDING_CREATED') return 'ONBOARDING_CREATED';
    if (normalized === 'NOTIFICATION_SENT') return 'NOTIFICATION_SENT';
    return fallback;
  }

  private normalizeRecruitmentAuditEntityType(
    value: unknown,
    fallback: RecruitmentAuditLogEntry['entityType']
  ): RecruitmentAuditLogEntry['entityType'] {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    if (normalized === 'application') return 'Application';
    if (normalized === 'campaign' || normalized === 'campagne') return 'Campaign';
    if (normalized === 'onboarding' || normalized === 'integration') return 'Onboarding';
    if (normalized === 'notification' || normalized === 'notifications') return 'Notification';
    return fallback;
  }

  private normalizeRecruitmentAuditOutcome(
    value: unknown,
    fallback: RecruitmentAuditOutcome
  ): RecruitmentAuditOutcome {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
    if (normalized === 'SUCCESS' || normalized === 'SUCCES') return 'SUCCESS';
    if (normalized === 'DENIED' || normalized === 'REFUSED') return 'DENIED';
    if (normalized === 'FAILED' || normalized === 'ECHEC') return 'FAILED';
    return fallback;
  }

  private applyLocalRecruitmentAuditLogsQuery(
    items: RecruitmentAuditLogEntry[],
    query?: RecruitmentAuditLogsQuery
  ): RecruitmentAuditLogEntry[] {
    let next = [...items];
    const action = (query?.action || '').trim().toUpperCase();
    const actor = (query?.actor || '').trim().toLowerCase();
    const entityType = (query?.entityType || '').trim().toLowerCase();
    const outcome = (query?.outcome || '').trim().toUpperCase();
    const reference = (query?.reference || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (action) {
      next = next.filter((item) => item.action.includes(action));
    }
    if (actor) {
      next = next.filter((item) => item.actor.toLowerCase().includes(actor));
    }
    if (entityType) {
      next = next.filter((item) => item.entityType.toLowerCase().includes(entityType));
    }
    if (outcome) {
      next = next.filter((item) => item.outcome.includes(outcome));
    }
    if (reference) {
      next = next.filter((item) => String(item.entityId || '').toLowerCase().includes(reference));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.action.toLowerCase().includes(search) ||
          item.entityType.toLowerCase().includes(search) ||
          String(item.entityId || '').toLowerCase().includes(search) ||
          item.actor.toLowerCase().includes(search) ||
          item.outcome.toLowerCase().includes(search) ||
          item.detail.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'createdAt').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readRecruitmentAuditLogField(left, sortBy);
      const rightValue = this.readRecruitmentAuditLogField(right, sortBy);
      const leftText = String(leftValue).toLowerCase();
      const rightText = String(rightValue).toLowerCase();
      if (leftText === rightText) return 0;
      if (leftText < rightText) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 100);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readRecruitmentAuditLogField(item: RecruitmentAuditLogEntry, field: string): string {
    switch (field) {
      case 'action':
        return item.action;
      case 'entityType':
        return item.entityType;
      case 'entityId':
        return item.entityId || '';
      case 'actor':
        return item.actor;
      case 'outcome':
        return item.outcome;
      case 'createdAt':
        return item.createdAt;
      default:
        return '';
    }
  }

  private buildLocalRecruitmentAuditLogs(): RecruitmentAuditLogEntry[] {
    const entries: RecruitmentAuditLogEntry[] = [];
    const applications = this.readLocalApplications();
    const campaigns = this.readLocalCampaigns();
    const onboarding = this.readLocalOnboarding();
    const notifications = this.buildLocalRecruitmentNotificationsJournal();

    applications.forEach((application) => {
      const history = this.normalizeStatusHistory(
        application.statusHistory,
        application.status,
        application.receivedOn
      );
      const createdAt = history[0]?.changedAt || this.normalizeHistoryChangedAt(application.receivedOn, application.receivedOn);
      entries.push({
        id: `REC-AUDIT-APP-CREATE-${application.reference}`,
        action: 'APPLICATION_CREATED',
        entityType: 'Application',
        entityId: application.reference,
        actor: history[0]?.changedBy || 'system',
        outcome: 'SUCCESS',
        detail: `Creation candidature ${application.reference}`,
        createdAt,
      });

      history
        .filter((item) => !!item.fromStatus)
        .forEach((item) => {
          entries.push({
            id: `REC-AUDIT-APP-STATUS-${application.reference}-${item.changedAt}`.replace(/[^A-Z0-9-]/gi, '-'),
            action: 'APPLICATION_STATUS_UPDATED',
            entityType: 'Application',
            entityId: application.reference,
            actor: item.changedBy || 'system',
            outcome: 'SUCCESS',
            detail: `Transition ${item.fromStatus} -> ${item.toStatus}`,
            createdAt: item.changedAt,
          });
        });

      (application.comments || []).forEach((comment) => {
        entries.push({
          id: `REC-AUDIT-APP-COMMENT-${application.reference}-${comment.id}`.replace(/[^A-Z0-9-]/gi, '-'),
          action: 'APPLICATION_COMMENT_ADDED',
          entityType: 'Application',
          entityId: application.reference,
          actor: comment.author || 'system',
          outcome: 'SUCCESS',
          detail: `Commentaire ajoute sur ${application.reference}`,
          createdAt: this.normalizeHistoryChangedAt(comment.createdAt, application.receivedOn),
        });
      });
    });

    campaigns.forEach((campaign) => {
      entries.push({
        id: `REC-AUDIT-CAMP-CREATE-${campaign.code}`,
        action: 'CAMPAIGN_CREATED',
        entityType: 'Campaign',
        entityId: campaign.code,
        actor: campaign.needOwner || 'responsable.rh',
        outcome: 'SUCCESS',
        detail: `Creation campagne ${campaign.code}`,
        createdAt: this.normalizeHistoryChangedAt(campaign.startDate, campaign.startDate),
      });
    });

    onboarding.forEach((item) => {
      const entityId = this.normalizeOptionalText(item.applicationReference) || `${item.agent}-${item.position}-${item.startDate}`;
      entries.push({
        id: `REC-AUDIT-ONB-CREATE-${entityId}`.replace(/[^A-Z0-9-]/gi, '-'),
        action: 'ONBOARDING_CREATED',
        entityType: 'Onboarding',
        entityId,
        actor: 'rh.operations',
        outcome: 'SUCCESS',
        detail: `Creation parcours integration ${item.agent}`,
        createdAt: this.normalizeHistoryChangedAt(item.startDate, item.startDate),
      });
    });

    notifications.forEach((item) => {
      entries.push({
        id: `REC-AUDIT-NOTIF-${item.id}`,
        action: 'NOTIFICATION_SENT',
        entityType: 'Notification',
        entityId: item.reference || item.id,
        actor: item.recipient || 'system',
        outcome: item.status === 'Echec' ? 'FAILED' : 'SUCCESS',
        detail: `${item.type} - ${item.message}`,
        createdAt: this.normalizeHistoryChangedAt(item.sentAt, ''),
      });
    });

    const deduped = new Map<string, RecruitmentAuditLogEntry>();
    entries.forEach((entry) => {
      const key = `${entry.action}|${entry.entityType}|${entry.entityId || ''}|${entry.actor}|${entry.createdAt}|${entry.detail}`.toLowerCase();
      if (!deduped.has(key)) {
        deduped.set(key, entry);
      }
    });

    return Array.from(deduped.values()).sort((left, right) => {
      const leftTs = Date.parse(left.createdAt);
      const rightTs = Date.parse(right.createdAt);
      const safeLeft = Number.isNaN(leftTs) ? 0 : leftTs;
      const safeRight = Number.isNaN(rightTs) ? 0 : rightTs;
      return safeRight - safeLeft;
    });
  }

  private applicationStageChangedAt(application: Application): string {
    const history = this.normalizeStatusHistory(
      application.statusHistory,
      application.status,
      application.receivedOn
    );
    const sameStatusEntry = [...history]
      .reverse()
      .find((entry) => entry.toStatus === application.status);
    if (sameStatusEntry?.changedAt) {
      return sameStatusEntry.changedAt;
    }
    return this.normalizeHistoryChangedAt(application.receivedOn, application.receivedOn);
  }

  private daysSinceDate(value: string): number {
    const parsed = Date.parse(String(value || '').trim());
    if (Number.isNaN(parsed)) {
      return 0;
    }
    const elapsed = Date.now() - parsed;
    return Math.max(0, Math.floor(elapsed / 86400000));
  }

  private addDaysToIsoDateTime(value: string, days: number): string | undefined {
    const parsed = Date.parse(String(value || '').trim());
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    const safeDays = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
    return new Date(parsed + safeDays * 86400000).toISOString();
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

  private mapApplications(items: ApplicationDto[]): Application[] {
    return items
      .map((dto) => this.normalizeApplication(dto))
      .filter((item) => !!item.reference && !!item.candidate && !!item.position);
  }

  private normalizeApplication(dto: ApplicationDto, fallbackReference = ''): Application {
    const receivedOn = toStringValue(readField(dto, ['receivedOn', 'received_on'], '')).trim();
    const status = this.normalizeApplicationStatus(readField(dto, ['status'], 'Nouveau'), 'Nouveau');
    const reference = toStringValue(readField(dto, ['reference', 'requestRef', 'request_ref'], fallbackReference)).trim();
    return {
      reference,
      candidate: toStringValue(readField(dto, ['candidate', 'candidateName', 'candidate_name'], '')).trim(),
      candidateEmail: this.normalizeCandidateEmail(
        readField(dto, ['candidateEmail', 'candidate_email', 'email'], '')
      ),
      candidatePhone: this.normalizeCandidatePhone(
        readField(dto, ['candidatePhone', 'candidate_phone', 'phone'], '')
      ),
      identityNumber: this.normalizeCandidateIdentity(
        readField(dto, ['identityNumber', 'identity_number', 'identity'], '')
      ),
      position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')).trim(),
      campaign: toStringValue(readField(dto, ['campaign', 'campaignTitle', 'campaign_title'], '')).trim(),
      source: this.normalizeApplicationSource(
        readField(dto, ['source', 'sourceName', 'source_name', 'channel', 'canal', 'origin', 'origine'], 'Autre'),
        'Autre'
      ),
      status,
      receivedOn,
      experienceYears: this.toNonNegativeInt(
        readField(dto, ['experienceYears', 'experience_years'], this.derivePseudoExperienceYears(reference)),
        this.derivePseudoExperienceYears(reference)
      ),
      skillsMatch: this.toNonNegativeInt(
        readField(dto, ['skillsMatch', 'skills_match'], this.derivePseudoPercentage(reference, 'skillsMatch', 50, 92)),
        this.derivePseudoPercentage(reference, 'skillsMatch', 50, 92)
      ),
      educationLevel: this.toNonNegativeInt(
        readField(dto, ['educationLevel', 'education_level'], this.derivePseudoPercentage(reference, 'educationLevel', 45, 90)),
        this.derivePseudoPercentage(reference, 'educationLevel', 45, 90)
      ),
      interviewAverage: this.toNonNegativeInt(
        readField(dto, ['interviewAverage', 'interview_average'], status === 'Entretien' || status === 'Retenu'
          ? this.derivePseudoPercentage(reference, 'interviewAverage', 60, 92)
          : 0),
        status === 'Entretien' || status === 'Retenu'
          ? this.derivePseudoPercentage(reference, 'interviewAverage', 60, 92)
          : 0
      ),
      testScore: this.toNonNegativeInt(
        readField(dto, ['testScore', 'test_score'], this.derivePseudoPercentage(reference, 'testScore', 48, 94)),
        this.derivePseudoPercentage(reference, 'testScore', 48, 94)
      ),
      statusHistory: this.normalizeStatusHistory(
        readField(dto, ['statusHistory', 'status_history'], []),
        status,
        receivedOn
      ),
      comments: this.normalizeApplicationComments(
        readField(dto, ['comments', 'commentaries', 'comments_history'], [])
      ),
      attachments: this.normalizeApplicationAttachments(
        readField(dto, ['attachments', 'files', 'documents'], [])
      ),
    };
  }

  private normalizeCreateApplicationPayload(payload: CreateApplicationPayload): CreateApplicationPayload {
    const reference = this.normalizeOptionalText(payload.reference)?.toUpperCase();
    return {
      reference,
      candidate: String(payload.candidate || '').trim(),
      candidateEmail: this.normalizeCandidateEmail(payload.candidateEmail),
      candidatePhone: this.normalizeCandidatePhone(payload.candidatePhone),
      identityNumber: this.normalizeCandidateIdentity(payload.identityNumber),
      position: String(payload.position || '').trim(),
      campaign: String(payload.campaign || '').trim().toUpperCase(),
      source: this.normalizeApplicationSource(payload.source, 'Autre'),
      status: this.normalizeApplicationStatus(payload.status, 'Nouveau'),
      receivedOn: String(payload.receivedOn || '').trim(),
      experienceYears: this.toNonNegativeInt(payload.experienceYears, this.derivePseudoExperienceYears(reference || '')),
      skillsMatch: this.toNonNegativeInt(
        payload.skillsMatch,
        this.derivePseudoPercentage(reference || '', 'skillsMatch', 50, 92)
      ),
      educationLevel: this.toNonNegativeInt(
        payload.educationLevel,
        this.derivePseudoPercentage(reference || '', 'educationLevel', 45, 90)
      ),
      interviewAverage: this.toNonNegativeInt(
        payload.interviewAverage,
        this.derivePseudoPercentage(reference || '', 'interviewAverage', 60, 92)
      ),
      testScore: this.toNonNegativeInt(
        payload.testScore,
        this.derivePseudoPercentage(reference || '', 'testScore', 48, 94)
      ),
      allowDuplicate: !!payload.allowDuplicate,
      attachments: this.normalizeApplicationAttachments(payload.attachments || []),
    };
  }

  private normalizeUpdateApplicationStatusPayload(payload: UpdateApplicationStatusPayload): UpdateApplicationStatusPayload {
    return {
      status: this.normalizeApplicationStatus(payload.status, 'Nouveau'),
      note: this.normalizeOptionalText(payload.note),
      changedBy: this.normalizeOptionalText(payload.changedBy),
    };
  }

  private normalizeCreateApplicationCommentPayload(payload: CreateApplicationCommentPayload): CreateApplicationCommentPayload {
    return {
      message: String(payload.message || '').trim(),
      author: this.normalizeOptionalText(payload.author),
    };
  }

  private applyLocalApplicationsQuery(items: Application[], query?: RecruitmentApplicationsQuery): Application[] {
    let next = [...items];
    const status = (query?.status || '').trim().toLowerCase();
    const campaign = (query?.campaign || '').trim().toLowerCase();
    const position = (query?.position || '').trim().toLowerCase();
    const source = (query?.source || '').trim().toLowerCase();
    const receivedFrom = this.parseDateOnly(query?.receivedFrom);
    const receivedTo = this.parseDateOnly(query?.receivedTo);
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (campaign) {
      next = next.filter((item) => item.campaign.toLowerCase().includes(campaign));
    }
    if (position) {
      next = next.filter((item) => item.position.toLowerCase().includes(position));
    }
    if (source) {
      next = next.filter((item) => item.source.toLowerCase().includes(source));
    }
    if (receivedFrom) {
      const fromTimestamp = receivedFrom.getTime();
      next = next.filter((item) => {
        const timestamp = Date.parse(item.receivedOn);
        return !Number.isNaN(timestamp) && timestamp >= fromTimestamp;
      });
    }
    if (receivedTo) {
      const toTimestamp = receivedTo.getTime() + 86399999;
      next = next.filter((item) => {
        const timestamp = Date.parse(item.receivedOn);
        return !Number.isNaN(timestamp) && timestamp <= toTimestamp;
      });
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.candidate.toLowerCase().includes(search) ||
          String(item.candidateEmail || '').toLowerCase().includes(search) ||
          String(item.candidatePhone || '').toLowerCase().includes(search) ||
          String(item.identityNumber || '').toLowerCase().includes(search) ||
          item.position.toLowerCase().includes(search) ||
          item.campaign.toLowerCase().includes(search) ||
          item.source.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.receivedOn.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'receivedOn').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readApplicationField(left, sortBy);
      const rightValue = this.readApplicationField(right, sortBy);
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

  private readApplicationField(item: Application, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'candidate':
        return item.candidate;
      case 'candidateEmail':
        return item.candidateEmail || '';
      case 'candidatePhone':
        return item.candidatePhone || '';
      case 'identityNumber':
        return item.identityNumber || '';
      case 'position':
        return item.position;
      case 'campaign':
        return item.campaign;
      case 'source':
        return item.source;
      case 'status':
        return item.status;
      case 'receivedOn':
        return item.receivedOn;
      default:
        return '';
    }
  }

  private appendLocalApplication(payload: CreateApplicationPayload): Application {
    const current = this.readLocalApplications();
    const reference = this.normalizeOptionalText(payload.reference) || this.generateApplicationReference(current);
    const status = this.normalizeApplicationStatus(payload.status, 'Nouveau');
    const receivedOn = String(payload.receivedOn || '').trim();
    const duplicateMatches = this.findLocalDuplicateMatches(
      {
        candidateEmail: payload.candidateEmail,
        candidatePhone: payload.candidatePhone,
        identityNumber: payload.identityNumber,
      },
      current
    );
    if (duplicateMatches.length > 0 && !payload.allowDuplicate) {
      const detail = duplicateMatches
        .map((entry) => `${entry.reference} (${entry.matchTypes.join(', ')})`)
        .join(' | ');
      throw new HttpErrorResponse({
        status: 409,
        statusText: 'Conflict',
        error: {
          message: 'Doublon candidature detecte',
          errors: [`Doublon potentiel detecte: ${detail}`],
          detail: {
            duplicateMatches,
          },
        },
      });
    }
    const created: Application = {
      reference,
      candidate: String(payload.candidate || '').trim(),
      candidateEmail: this.normalizeCandidateEmail(payload.candidateEmail),
      candidatePhone: this.normalizeCandidatePhone(payload.candidatePhone),
      identityNumber: this.normalizeCandidateIdentity(payload.identityNumber),
      position: String(payload.position || '').trim(),
      campaign: String(payload.campaign || '').trim().toUpperCase(),
      source: this.normalizeApplicationSource(payload.source, 'Autre'),
      status,
      receivedOn,
      experienceYears: this.toNonNegativeInt(payload.experienceYears, this.derivePseudoExperienceYears(reference)),
      skillsMatch: this.toNonNegativeInt(payload.skillsMatch, this.derivePseudoPercentage(reference, 'skillsMatch', 50, 92)),
      educationLevel: this.toNonNegativeInt(payload.educationLevel, this.derivePseudoPercentage(reference, 'educationLevel', 45, 90)),
      interviewAverage: this.toNonNegativeInt(payload.interviewAverage, status === 'Entretien' || status === 'Retenu'
        ? this.derivePseudoPercentage(reference, 'interviewAverage', 60, 92)
        : 0),
      testScore: this.toNonNegativeInt(payload.testScore, this.derivePseudoPercentage(reference, 'testScore', 48, 94)),
      statusHistory: this.buildInitialStatusHistory(status, receivedOn),
      comments: [],
      attachments: this.normalizeApplicationAttachments(payload.attachments || []),
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalApplications(deduped);
    return created;
  }

  private updateLocalApplicationStatus(reference: string, payload: UpdateApplicationStatusPayload): Application {
    const normalizedReference = String(reference || '').trim().toUpperCase();
    if (!normalizedReference) {
      throw new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: { message: 'Reference candidature invalide' },
      });
    }

    const current = this.readLocalApplications();
    const index = current.findIndex((item) => item.reference === normalizedReference);
    if (index < 0) {
      throw new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { message: 'Candidature introuvable' },
      });
    }

    const currentItem = current[index];
    const targetStatus = this.normalizeApplicationStatus(payload.status, currentItem.status);
    if (targetStatus === currentItem.status) {
      return currentItem;
    }

    if (!this.isApplicationTransitionAllowed(currentItem.status, targetStatus)) {
      throw new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: {
          message: `Transition statut invalide: ${currentItem.status} -> ${targetStatus}`,
          errors: [`Transition statut invalide: ${currentItem.status} -> ${targetStatus}`],
        },
      });
    }

    const updated: Application = {
      ...currentItem,
      status: targetStatus,
      statusHistory: [
        ...this.normalizeStatusHistory(currentItem.statusHistory, currentItem.status, currentItem.receivedOn),
        this.buildStatusHistoryEntry(
          currentItem.status,
          targetStatus,
          payload.changedBy,
          payload.note
        ),
      ],
    };
    current[index] = updated;
    this.writeLocalApplications(current);
    return updated;
  }

  private addLocalApplicationComment(
    reference: string,
    payload: CreateApplicationCommentPayload
  ): Application {
    const normalizedReference = String(reference || '').trim().toUpperCase();
    if (!normalizedReference) {
      throw new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: { message: 'Reference candidature invalide' },
      });
    }

    const message = String(payload.message || '').trim();
    if (message.length < 2) {
      throw new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: {
          message: 'Commentaire invalide',
          errors: ['Commentaire requis (2 caracteres minimum)'],
        },
      });
    }

    const current = this.readLocalApplications();
    const index = current.findIndex((item) => item.reference === normalizedReference);
    if (index < 0) {
      throw new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { message: 'Candidature introuvable' },
      });
    }

    const currentItem = current[index];
    const currentComments = this.normalizeApplicationComments(currentItem.comments);
    const createdComment: ApplicationCommentEntry = {
      id: `COM-${normalizedReference}-${String(currentComments.length + 1).padStart(3, '0')}`,
      author: this.normalizeOptionalText(payload.author) || 'system',
      message,
      createdAt: new Date().toISOString(),
    };
    const updated: Application = {
      ...currentItem,
      comments: [...currentComments, createdComment],
    };
    current[index] = updated;
    this.writeLocalApplications(current);
    return updated;
  }

  private generateApplicationReference(existing: Application[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^APP-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `APP-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalApplications(): Application[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localApplicationsKey);
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
          const record = item as Partial<Application> & {
            statusHistory?: ApplicationStatusHistoryEntry[];
            status_history?: ApplicationStatusHistoryEntry[];
            comments?: ApplicationCommentEntry[];
            comments_history?: ApplicationCommentEntry[];
            attachments?: ApplicationAttachmentEntry[];
            files?: ApplicationAttachmentEntry[];
            documents?: ApplicationAttachmentEntry[];
            sourceName?: string;
            source_name?: string;
            channel?: string;
            canal?: string;
            origin?: string;
            origine?: string;
          };
          const receivedOn = String(record.receivedOn || '').trim();
          const status = this.normalizeApplicationStatus(record.status, 'Nouveau');
          const source = this.normalizeApplicationSource(
            readField(record, ['source', 'sourceName', 'source_name', 'channel', 'canal', 'origin', 'origine'], 'Autre'),
            'Autre'
          );
          return {
            reference: String(record.reference || '').trim(),
            candidate: String(record.candidate || '').trim(),
            candidateEmail: this.normalizeCandidateEmail(
              (record as { candidateEmail?: string; candidate_email?: string; email?: string }).candidateEmail
                || (record as { candidate_email?: string }).candidate_email
                || (record as { email?: string }).email
            ),
            candidatePhone: this.normalizeCandidatePhone(
              (record as { candidatePhone?: string; candidate_phone?: string; phone?: string }).candidatePhone
                || (record as { candidate_phone?: string }).candidate_phone
                || (record as { phone?: string }).phone
            ),
            identityNumber: this.normalizeCandidateIdentity(
              (record as { identityNumber?: string; identity_number?: string; identity?: string }).identityNumber
                || (record as { identity_number?: string }).identity_number
                || (record as { identity?: string }).identity
            ),
            position: String(record.position || '').trim(),
            campaign: String(record.campaign || '').trim(),
            source,
            status,
            receivedOn,
            experienceYears: this.toNonNegativeInt(
              (record as { experienceYears?: number; experience_years?: number }).experienceYears
                ?? (record as { experience_years?: number }).experience_years,
              this.derivePseudoExperienceYears(String(record.reference || '').trim())
            ),
            skillsMatch: this.toNonNegativeInt(
              (record as { skillsMatch?: number; skills_match?: number }).skillsMatch
                ?? (record as { skills_match?: number }).skills_match,
              this.derivePseudoPercentage(String(record.reference || '').trim(), 'skillsMatch', 50, 92)
            ),
            educationLevel: this.toNonNegativeInt(
              (record as { educationLevel?: number; education_level?: number }).educationLevel
                ?? (record as { education_level?: number }).education_level,
              this.derivePseudoPercentage(String(record.reference || '').trim(), 'educationLevel', 45, 90)
            ),
            interviewAverage: this.toNonNegativeInt(
              (record as { interviewAverage?: number; interview_average?: number }).interviewAverage
                ?? (record as { interview_average?: number }).interview_average,
              status === 'Entretien' || status === 'Retenu'
                ? this.derivePseudoPercentage(String(record.reference || '').trim(), 'interviewAverage', 60, 92)
                : 0
            ),
            testScore: this.toNonNegativeInt(
              (record as { testScore?: number; test_score?: number }).testScore
                ?? (record as { test_score?: number }).test_score,
              this.derivePseudoPercentage(String(record.reference || '').trim(), 'testScore', 48, 94)
            ),
            statusHistory: this.normalizeStatusHistory(
              record.statusHistory || record.status_history || [],
              status,
              receivedOn
            ),
            comments: this.normalizeApplicationComments(record.comments || record.comments_history || []),
            attachments: this.normalizeApplicationAttachments(
              record.attachments || record.files || record.documents || []
            ),
          } as Application;
        })
        .filter((item) => !!item.reference && !!item.candidate && !!item.position);
    } catch {
      return [];
    }
  }

  private writeLocalApplications(items: Application[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localApplicationsKey, JSON.stringify(items));
  }

  private normalizeApplicationStatus(
    value: unknown,
    fallback: RecruitmentApplicationStatus
  ): RecruitmentApplicationStatus {
    const raw = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    if (raw === 'nouveau') return 'Nouveau';
    if (raw === 'preselection' || raw === 'shortlist') return 'Preselection';
    if (raw === 'entretien') return 'Entretien';
    if (raw === 'retenu' || raw === 'accepte' || raw === 'embauche') return 'Retenu';
    if (raw === 'rejete') return 'Rejete';
    return fallback;
  }

  private normalizeApplicationSource(
    value: unknown,
    fallback: RecruitmentApplicationSource
  ): RecruitmentApplicationSource {
    const raw = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    if (
      raw === 'portailrh' ||
      raw === 'portail rh' ||
      raw === 'portail' ||
      raw === 'sitecarriere' ||
      raw === 'site carriere'
    ) {
      return 'Portail RH';
    }
    if (
      raw === 'jobboard' ||
      raw === 'linkedin' ||
      raw === 'apec' ||
      raw === 'indeed' ||
      raw === 'reseau social' ||
      raw === 'reseaux sociaux'
    ) {
      return 'Jobboard';
    }
    if (raw === 'cooptation' || raw === 'referral' || raw === 'recommandation') {
      return 'Cooptation';
    }
    if (raw === 'cabinet' || raw === 'agence' || raw === 'chasseur de tete' || raw === 'chasseurdetete') {
      return 'Cabinet';
    }
    if (raw === 'interne' || raw === 'mobilite interne' || raw === 'mobiliteinterne') {
      return 'Interne';
    }
    if (raw === 'autre' || raw === 'other') {
      return 'Autre';
    }
    return fallback;
  }

  private isApplicationTransitionAllowed(
    fromStatus: RecruitmentApplicationStatus,
    toStatus: RecruitmentApplicationStatus
  ): boolean {
    const allowedTargets = this.applicationStatusTransitions[fromStatus] || [];
    return allowedTargets.includes(toStatus);
  }

  private normalizeStatusHistory(
    value: unknown,
    currentStatus: RecruitmentApplicationStatus,
    receivedOn: string
  ): ApplicationStatusHistoryEntry[] {
    if (!Array.isArray(value)) {
      return this.buildInitialStatusHistory(currentStatus, receivedOn);
    }

    const normalized = value
      .map((entry) => {
        const fromRaw = readField(entry, ['fromStatus', 'from_status'], null);
        const toStatus = this.normalizeApplicationStatus(
          readField(entry, ['toStatus', 'to_status'], currentStatus),
          currentStatus
        );
        const changedAtRaw = toStringValue(readField(entry, ['changedAt', 'changed_at'], '')).trim();
        const changedBy = toStringValue(readField(entry, ['changedBy', 'changed_by'], '')).trim() || 'system';
        const note = this.normalizeOptionalText(readField(entry, ['note'], ''));
        const normalizedFrom =
          fromRaw === null || fromRaw === undefined || String(fromRaw).trim().length === 0
            ? null
            : this.normalizeApplicationStatus(fromRaw, currentStatus);

        return {
          fromStatus: normalizedFrom,
          toStatus,
          changedAt: this.normalizeHistoryChangedAt(changedAtRaw, receivedOn),
          changedBy,
          note,
        } as ApplicationStatusHistoryEntry;
      })
      .filter((entry) => !!entry.toStatus);

    if (normalized.length === 0) {
      return this.buildInitialStatusHistory(currentStatus, receivedOn);
    }

    normalized.sort((left, right) => {
      const leftTs = Date.parse(left.changedAt);
      const rightTs = Date.parse(right.changedAt);
      if (!Number.isNaN(leftTs) && !Number.isNaN(rightTs)) {
        return leftTs - rightTs;
      }
      return left.changedAt.localeCompare(right.changedAt);
    });
    return normalized;
  }

  private buildInitialStatusHistory(
    status: RecruitmentApplicationStatus,
    receivedOn: string
  ): ApplicationStatusHistoryEntry[] {
    return [
      {
        fromStatus: null,
        toStatus: status,
        changedAt: this.normalizeHistoryChangedAt('', receivedOn),
        changedBy: 'system',
        note: 'Initialisation',
      },
    ];
  }

  private buildStatusHistoryEntry(
    fromStatus: RecruitmentApplicationStatus,
    toStatus: RecruitmentApplicationStatus,
    changedBy: unknown,
    note: unknown
  ): ApplicationStatusHistoryEntry {
    return {
      fromStatus,
      toStatus,
      changedAt: new Date().toISOString(),
      changedBy: this.normalizeOptionalText(changedBy) || 'system',
      note: this.normalizeOptionalText(note),
    };
  }

  private normalizeHistoryChangedAt(changedAt: string, receivedOn: string): string {
    const parsedChangedAt = Date.parse(changedAt);
    if (!Number.isNaN(parsedChangedAt)) {
      return new Date(parsedChangedAt).toISOString();
    }

    const parsedReceivedOn = Date.parse(receivedOn);
    if (!Number.isNaN(parsedReceivedOn)) {
      return new Date(parsedReceivedOn).toISOString();
    }

    return new Date().toISOString();
  }

  private normalizeApplicationComments(value: unknown): ApplicationCommentEntry[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const normalized = value
      .map((entry) => {
        const id = this.normalizeOptionalText(toStringValue(readField(entry, ['id'], '')).trim());
        const message = this.normalizeOptionalText(toStringValue(readField(entry, ['message', 'text'], '')).trim());
        if (!message) {
          return null;
        }
        const author = toStringValue(readField(entry, ['author'], '')).trim() || 'system';
        const createdAtRaw = toStringValue(readField(entry, ['createdAt', 'created_at'], '')).trim();
        const createdAt = this.normalizeCommentCreatedAt(createdAtRaw);
        return {
          id: id || `COM-${createdAt}`,
          author,
          message,
          createdAt,
        } satisfies ApplicationCommentEntry;
      })
      .filter((entry): entry is ApplicationCommentEntry => !!entry);

    normalized.sort((left, right) => {
      const leftTs = Date.parse(left.createdAt);
      const rightTs = Date.parse(right.createdAt);
      if (!Number.isNaN(leftTs) && !Number.isNaN(rightTs)) {
        return leftTs - rightTs;
      }
      return left.createdAt.localeCompare(right.createdAt);
    });
    return normalized;
  }

  private normalizeCommentCreatedAt(value: string): string {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
    return new Date().toISOString();
  }

  private normalizeApplicationAttachments(value: unknown): ApplicationAttachmentEntry[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const normalized = value
      .map((entry) => {
        const fileName = this.normalizeOptionalText(
          toStringValue(readField(entry, ['fileName', 'file_name', 'name'], '')).trim()
        );
        const url = this.normalizeOptionalText(
          toStringValue(readField(entry, ['url', 'fileDataUrl', 'file_data_url', 'path'], '')).trim()
        );
        if (!fileName || !url) {
          return null;
        }
        const id = this.normalizeOptionalText(toStringValue(readField(entry, ['id'], '')).trim());
        const mimeType = toStringValue(readField(entry, ['mimeType', 'mime_type'], '')).trim() || 'application/octet-stream';
        const size = this.toNonNegativeInt(readField(entry, ['size'], 0), 0);
        const uploadedAtRaw = toStringValue(readField(entry, ['uploadedAt', 'uploaded_at'], '')).trim();
        const uploadedAt = this.normalizeCommentCreatedAt(uploadedAtRaw);
        return {
          id: id || `ATT-${uploadedAt}`,
          fileName,
          url,
          mimeType,
          size,
          uploadedAt,
        } satisfies ApplicationAttachmentEntry;
      })
      .filter((entry): entry is ApplicationAttachmentEntry => !!entry);

    normalized.sort((left, right) => {
      const leftTs = Date.parse(left.uploadedAt);
      const rightTs = Date.parse(right.uploadedAt);
      if (!Number.isNaN(leftTs) && !Number.isNaN(rightTs)) {
        return leftTs - rightTs;
      }
      return left.uploadedAt.localeCompare(right.uploadedAt);
    });
    return normalized;
  }

  private normalizeUploadedAttachment(
    dto: RecruitmentUploadedFileDto,
    fallbackFile: File
  ): ApplicationAttachmentEntry {
    const uploadedAt = this.normalizeCommentCreatedAt(
      toStringValue(readField(dto, ['uploadedAt', 'uploaded_at'], '')).trim()
    );
    return {
      id: this.normalizeOptionalText(toStringValue(readField(dto, ['id'], '')).trim()) || `ATT-${uploadedAt}`,
      fileName:
        this.normalizeOptionalText(
          toStringValue(readField(dto, ['fileName', 'file_name', 'name'], fallbackFile.name)).trim()
        ) || fallbackFile.name,
      url:
        this.normalizeOptionalText(
          toStringValue(readField(dto, ['url', 'path'], '')).trim()
        ) || '',
      mimeType:
        this.normalizeOptionalText(
          toStringValue(readField(dto, ['mimeType', 'mime_type'], fallbackFile.type)).trim()
        ) || fallbackFile.type || 'application/octet-stream',
      size: this.toNonNegativeInt(readField(dto, ['size'], fallbackFile.size), fallbackFile.size),
      uploadedAt,
    };
  }

  private buildLocalUploadedAttachment(file: File): ApplicationAttachmentEntry {
    const now = new Date().toISOString();
    return {
      id: `ATT-LOCAL-${Date.now()}`,
      fileName: file.name,
      url: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '',
      mimeType: file.type || 'application/octet-stream',
      size: this.toNonNegativeInt(file.size, 0),
      uploadedAt: now,
    };
  }

  private mapCampaigns(items: CampaignDto[]): Campaign[] {
    return items
      .map((dto) => this.normalizeCampaign(dto))
      .filter((item) => !!item.code && !!item.title && !!item.department);
  }

  private normalizeCampaign(dto: CampaignDto, fallbackCode = ''): Campaign {
    return {
      code: toStringValue(readField(dto, ['code'], fallbackCode)).trim(),
      title: toStringValue(readField(dto, ['title', 'name'], '')).trim(),
      department: toStringValue(readField(dto, ['department', 'departmentName', 'department_name'], '')).trim(),
      openings: this.toNonNegativeInt(readField(dto, ['openings', 'openPositions', 'open_positions'], 0), 0),
      startDate: toStringValue(readField(dto, ['startDate', 'start_date'], '')).trim(),
      endDate: toStringValue(readField(dto, ['endDate', 'end_date'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Planifiee')).trim() || 'Planifiee',
      needPosition: toStringValue(
        readField(dto, ['needPosition', 'need_position', 'targetPosition', 'target_position'], '')
      ).trim(),
      needQuota: this.toNonNegativeInt(readField(dto, ['needQuota', 'need_quota', 'quota'], 0), 0),
      needDeadline: toStringValue(readField(dto, ['needDeadline', 'need_deadline', 'deadline'], '')).trim(),
      needOwner: toStringValue(readField(dto, ['needOwner', 'need_owner', 'owner'], '')).trim(),
    };
  }

  private normalizeCreateCampaignPayload(payload: CreateCampaignPayload): CreateCampaignPayload {
    return {
      code: this.normalizeOptionalText(payload.code)?.toUpperCase(),
      title: String(payload.title || '').trim(),
      department: String(payload.department || '').trim(),
      openings: this.toNonNegativeInt(payload.openings, 1),
      startDate: String(payload.startDate || '').trim(),
      endDate: String(payload.endDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Planifiee',
      needPosition: String(payload.needPosition || '').trim(),
      needQuota: this.toNonNegativeInt(payload.needQuota, 1),
      needDeadline: String(payload.needDeadline || '').trim(),
      needOwner: String(payload.needOwner || '').trim(),
    };
  }

  private applyLocalCampaignsQuery(items: Campaign[], query?: RecruitmentCampaignsQuery): Campaign[] {
    let next = [...items];
    const status = (query?.status || '').trim().toLowerCase();
    const department = (query?.department || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (department) {
      next = next.filter((item) => item.department.toLowerCase().includes(department));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.code.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.department.toLowerCase().includes(search) ||
          String(item.openings).includes(search) ||
          item.startDate.toLowerCase().includes(search) ||
          item.endDate.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.needPosition.toLowerCase().includes(search) ||
          String(item.needQuota).includes(search) ||
          item.needDeadline.toLowerCase().includes(search) ||
          item.needOwner.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'startDate').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readCampaignField(left, sortBy);
      const rightValue = this.readCampaignField(right, sortBy);

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

  private readCampaignField(item: Campaign, field: string): string | number {
    switch (field) {
      case 'code':
        return item.code;
      case 'title':
        return item.title;
      case 'department':
        return item.department;
      case 'openings':
        return item.openings;
      case 'startDate':
        return item.startDate;
      case 'endDate':
        return item.endDate;
      case 'status':
        return item.status;
      case 'needPosition':
        return item.needPosition;
      case 'needQuota':
        return item.needQuota;
      case 'needDeadline':
        return item.needDeadline;
      case 'needOwner':
        return item.needOwner;
      default:
        return '';
    }
  }

  private appendLocalCampaign(payload: CreateCampaignPayload): Campaign {
    const current = this.readLocalCampaigns();
    const code = this.normalizeOptionalText(payload.code) || this.generateCampaignCode(payload.department, current);
    const created: Campaign = {
      code,
      title: String(payload.title || '').trim(),
      department: String(payload.department || '').trim(),
      openings: this.toNonNegativeInt(payload.openings, 1),
      startDate: String(payload.startDate || '').trim(),
      endDate: String(payload.endDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Planifiee',
      needPosition: String(payload.needPosition || '').trim(),
      needQuota: this.toNonNegativeInt(payload.needQuota, 1),
      needDeadline: String(payload.needDeadline || '').trim(),
      needOwner: String(payload.needOwner || '').trim(),
    };
    const deduped = current.filter((item) => item.code !== created.code);
    deduped.push(created);
    this.writeLocalCampaigns(deduped);
    return created;
  }

  private generateCampaignCode(department: string, existing: Campaign[]): string {
    const year = new Date().getFullYear();
    const departmentCode = this.normalizeIdPart(department).slice(0, 10) || 'RH';
    const prefix = `CMP-${departmentCode}-${year}`;
    const regex = new RegExp(`^${prefix}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.code);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `${prefix}-${String(maxExisting + 1).padStart(2, '0')}`;
  }

  private readLocalCampaigns(): Campaign[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localCampaignsKey);
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
          const record = item as Partial<Campaign>;
          return {
            code: String(record.code || '').trim(),
            title: String(record.title || '').trim(),
            department: String(record.department || '').trim(),
            openings: this.toNonNegativeInt(record.openings, 0),
            startDate: String(record.startDate || '').trim(),
            endDate: String(record.endDate || '').trim(),
            status: String(record.status || 'Planifiee').trim() || 'Planifiee',
            needPosition: String((record as { needPosition?: string }).needPosition || '').trim(),
            needQuota: this.toNonNegativeInt((record as { needQuota?: number }).needQuota, 0),
            needDeadline: String((record as { needDeadline?: string }).needDeadline || '').trim(),
            needOwner: String((record as { needOwner?: string }).needOwner || '').trim(),
          } as Campaign;
        })
        .filter((item) => !!item.code && !!item.title && !!item.department);
    } catch {
      return [];
    }
  }

  private writeLocalCampaigns(items: Campaign[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localCampaignsKey, JSON.stringify(items));
  }

  private mapOnboarding(items: OnboardingDto[]): OnboardingItem[] {
    return items
      .map((dto) => this.normalizeOnboarding(dto))
      .filter((item) => !!item.agent && !!item.position && !!item.startDate);
  }

  private normalizeOnboarding(dto: OnboardingDto): OnboardingItem {
    const checklist = this.normalizeChecklist(readField(dto, ['checklist', 'tasks'], []));
    const status = toStringValue(readField(dto, ['status'], 'Planifie')).trim() || 'Planifie';
    const checklistTasks = this.normalizeOnboardingChecklistTasks(
      readField(dto, ['checklistTasks', 'checklist_tasks', 'tasksDetailed', 'task_assignments'], []),
      checklist,
      status
    );
    const blockedTasksCount = checklistTasks.filter((task) => task.status === 'Bloquee').length;
    const escalatedTasksCount = checklistTasks.filter((task) => !!task.escalation).length;
    const history = this.normalizeOnboardingHistoryEvents(
      readField(dto, ['history', 'onboardingHistory', 'onboarding_history'], []),
      checklistTasks
    );

    return {
      agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim(),
      position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')).trim(),
      startDate: toStringValue(readField(dto, ['startDate', 'start_date'], '')).trim(),
      checklist: checklistTasks.map((task) => task.label),
      checklistTasks,
      progress: this.normalizeOnboardingChecklistProgress(
        readField(dto, ['progress', 'checklistProgress', 'checklist_progress'], null),
        checklistTasks,
        status
      ),
      templateId: this.normalizeOptionalText(
        toStringValue(readField(dto, ['templateId', 'template_id'], '')).trim()
      ),
      history,
      blockedTasksCount: this.toNonNegativeInt(
        readField(dto, ['blockedTasksCount', 'blocked_tasks_count'], blockedTasksCount),
        blockedTasksCount
      ),
      escalatedTasksCount: this.toNonNegativeInt(
        readField(dto, ['escalatedTasksCount', 'escalated_tasks_count'], escalatedTasksCount),
        escalatedTasksCount
      ),
      status,
      applicationReference: this.normalizeOptionalText(
        toStringValue(
          readField(
            dto,
            ['applicationReference', 'application_reference', 'applicationRef', 'application_ref'],
            ''
          )
        ).trim().toUpperCase()
      ),
    };
  }

  private normalizeCreateOnboardingPayload(payload: CreateOnboardingPayload): CreateOnboardingPayload {
    const checklist = this.normalizeChecklist(payload.checklist || []);
    const status = this.normalizeOptionalText(payload.status) || 'Planifie';
    const checklistTasks = this.normalizeOnboardingChecklistTasks(
      payload.checklistTasks || [],
      checklist,
      status
    );
    const history = this.normalizeOnboardingHistoryEvents(payload.history || [], checklistTasks);

    return {
      agent: String(payload.agent || '').trim(),
      position: String(payload.position || '').trim(),
      startDate: String(payload.startDate || '').trim(),
      checklist: checklistTasks.map((task) => task.label),
      checklistTasks,
      templateId: this.normalizeOptionalText(payload.templateId),
      history: history.length > 0 ? history : undefined,
      status,
      applicationReference: this.normalizeOptionalText(payload.applicationReference)?.toUpperCase(),
    };
  }

  private applyLocalOnboardingQuery(items: OnboardingItem[], query?: RecruitmentOnboardingQuery): OnboardingItem[] {
    let next = [...items];
    const status = (query?.status || '').trim().toLowerCase();
    const agent = (query?.agent || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (agent) {
      next = next.filter((item) => item.agent.toLowerCase().includes(agent));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.agent.toLowerCase().includes(search) ||
          item.position.toLowerCase().includes(search) ||
          item.startDate.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          String(item.applicationReference || '').toLowerCase().includes(search) ||
          item.checklist.some((step) => step.toLowerCase().includes(search)) ||
          (item.checklistTasks || []).some((task) => {
            return (
              task.label.toLowerCase().includes(search) ||
              task.assignedTo.toLowerCase().includes(search) ||
              task.status.toLowerCase().includes(search) ||
              String(task.blockedReason || '').toLowerCase().includes(search)
            );
          }) ||
          (item.history || []).some((event) => {
            return (
              event.type.toLowerCase().includes(search) ||
              event.taskLabel.toLowerCase().includes(search) ||
              event.detail.toLowerCase().includes(search)
            );
          })
        );
      });
    }

    const sortBy = (query?.sortBy || 'startDate').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readOnboardingField(left, sortBy);
      const rightValue = this.readOnboardingField(right, sortBy);
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

  private readOnboardingField(item: OnboardingItem, field: string): string {
    switch (field) {
      case 'agent':
        return item.agent;
      case 'position':
        return item.position;
      case 'startDate':
        return item.startDate;
      case 'status':
        return item.status;
      default:
        return '';
    }
  }

  private appendLocalOnboarding(payload: CreateOnboardingPayload): OnboardingItem {
    const current = this.readLocalOnboarding();
    const status = this.normalizeOptionalText(payload.status) || 'Planifie';
    const checklist = this.normalizeChecklist(payload.checklist || []);
    const checklistTasks = this.normalizeOnboardingChecklistTasks(
      payload.checklistTasks || [],
      checklist,
      status
    );
    const history = this.normalizeOnboardingHistoryEvents(payload.history || [], checklistTasks);
    const created: OnboardingItem = {
      agent: String(payload.agent || '').trim(),
      position: String(payload.position || '').trim(),
      startDate: String(payload.startDate || '').trim(),
      checklist: checklistTasks.map((task) => task.label),
      checklistTasks,
      progress: this.buildOnboardingChecklistProgress(checklistTasks, status),
      templateId: this.normalizeOptionalText(payload.templateId),
      history,
      blockedTasksCount: checklistTasks.filter((task) => task.status === 'Bloquee').length,
      escalatedTasksCount: checklistTasks.filter((task) => !!task.escalation).length,
      status,
      applicationReference: this.normalizeOptionalText(payload.applicationReference)?.toUpperCase(),
    };
    const createdKey = this.buildOnboardingKey(created);
    const duplicate = current.some((item) => this.buildOnboardingKey(item) === createdKey);
    if (duplicate) {
      throw new HttpErrorResponse({
        status: 409,
        statusText: 'Conflict',
        error: {
          message: 'Parcours integration deja existant',
          errors: ['Parcours integration deja existant'],
        },
      });
    }
    const deduped = current.filter((item) => this.buildOnboardingKey(item) !== createdKey);
    deduped.push(created);
    this.writeLocalOnboarding(deduped);
    return created;
  }

  private buildOnboardingKey(item: OnboardingItem): string {
    return `${item.agent}|${item.position}|${item.startDate}`.toLowerCase();
  }

  private readLocalOnboarding(): OnboardingItem[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localOnboardingKey);
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
          const record = item as Partial<OnboardingItem> & {
            checklistTasks?: OnboardingChecklistTask[];
            checklist_tasks?: OnboardingChecklistTask[];
            progress?: OnboardingChecklistProgress;
            checklistProgress?: OnboardingChecklistProgress;
            checklist_progress?: OnboardingChecklistProgress;
            templateId?: string;
            template_id?: string;
            history?: OnboardingHistoryEvent[];
            onboardingHistory?: OnboardingHistoryEvent[];
            onboarding_history?: OnboardingHistoryEvent[];
            blockedTasksCount?: number | string;
            blocked_tasks_count?: number | string;
            escalatedTasksCount?: number | string;
            escalated_tasks_count?: number | string;
          };
          const status = String(record.status || 'Planifie').trim() || 'Planifie';
          const checklist = this.normalizeChecklist(record.checklist || []);
          const checklistTasks = this.normalizeOnboardingChecklistTasks(
            record.checklistTasks || record.checklist_tasks || [],
            checklist,
            status
          );
          const blockedTasksCount = checklistTasks.filter((task) => task.status === 'Bloquee').length;
          const escalatedTasksCount = checklistTasks.filter((task) => !!task.escalation).length;
          const history = this.normalizeOnboardingHistoryEvents(
            record.history || record.onboardingHistory || record.onboarding_history || [],
            checklistTasks
          );
          return {
            agent: String(record.agent || '').trim(),
            position: String(record.position || '').trim(),
            startDate: String(record.startDate || '').trim(),
            checklist: checklistTasks.map((task) => task.label),
            checklistTasks,
            progress: this.normalizeOnboardingChecklistProgress(
              record.progress || record.checklistProgress || record.checklist_progress || null,
              checklistTasks,
              status
            ),
            templateId: this.normalizeOptionalText(
              String(record.templateId || record.template_id || '').trim()
            ),
            history,
            blockedTasksCount: this.toNonNegativeInt(
              record.blockedTasksCount || record.blocked_tasks_count,
              blockedTasksCount
            ),
            escalatedTasksCount: this.toNonNegativeInt(
              record.escalatedTasksCount || record.escalated_tasks_count,
              escalatedTasksCount
            ),
            status,
            applicationReference: this.normalizeOptionalText(
              String((record as { applicationReference?: string }).applicationReference || '').trim().toUpperCase()
            ),
          } as OnboardingItem;
        })
        .filter((item) => !!item.agent && !!item.position && !!item.startDate);
    } catch {
      return [];
    }
  }

  private writeLocalOnboarding(items: OnboardingItem[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localOnboardingKey, JSON.stringify(items));
  }

  private normalizeChecklist(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => String(item || '').trim())
      .filter((item) => item.length > 0);
  }

  private normalizeOnboardingTaskStatus(value: unknown, fallback: OnboardingTaskStatus = 'A faire'): OnboardingTaskStatus {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    if (normalized === 'bloquee' || normalized === 'bloque' || normalized === 'blocked') return 'Bloquee';
    if (normalized === 'en cours' || normalized === 'encours' || normalized === 'in_progress') return 'En cours';
    if (normalized === 'termine' || normalized === 'valide' || normalized === 'done') return 'Termine';
    if (normalized === 'a faire' || normalized === 'afaire' || normalized === 'todo') return 'A faire';
    return fallback;
  }

  private normalizeOnboardingChecklistTasks(
    value: unknown,
    checklist: string[],
    onboardingStatus: string
  ): OnboardingChecklistTask[] {
    if (Array.isArray(value) && value.length > 0) {
      return value
        .map((entry) => {
          const label = toStringValue(readField(entry, ['label', 'title', 'name'], '')).trim();
          if (!label) {
            return null;
          }
          const assignedTo = toStringValue(readField(entry, ['assignedTo', 'assigned_to', 'owner'], '')).trim() || 'RH Operations';
          const status = this.normalizeOnboardingTaskStatus(readField(entry, ['status'], 'A faire'), 'A faire');
          const dueDate = this.normalizeOnboardingDate(readField(entry, ['dueDate', 'due_date'], ''));
          const blockedReason = this.normalizeOptionalText(
            toStringValue(readField(entry, ['blockedReason', 'blocked_reason', 'blockReason', 'block_reason'], '')).trim()
          );
          const blockedSince = this.normalizeOnboardingDate(
            readField(entry, ['blockedSince', 'blocked_since', 'blockedAt', 'blocked_at'], '')
          );
          const escalation = this.normalizeOnboardingTaskEscalation(
            readField(entry, ['escalation', 'escalationInfo', 'escalation_info'], null),
            blockedSince || dueDate
          );
          if (status === 'Bloquee') {
            return {
              label,
              assignedTo,
              status,
              dueDate,
              blockedReason,
              blockedSince: blockedSince || dueDate,
              escalation,
            } as OnboardingChecklistTask;
          }
          return { label, assignedTo, status, dueDate } as OnboardingChecklistTask;
        })
        .filter((entry): entry is OnboardingChecklistTask => !!entry);
    }

    return this.buildOnboardingChecklistTasksFromChecklist(checklist, onboardingStatus);
  }

  private buildOnboardingChecklistTasksFromChecklist(
    checklist: string[],
    onboardingStatus: string
  ): OnboardingChecklistTask[] {
    const normalizedStatus = String(onboardingStatus || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    return checklist.map((label, index) => {
      let status: OnboardingTaskStatus = 'A faire';
      if (normalizedStatus === 'termine' || normalizedStatus === 'valide') {
        status = 'Termine';
      } else if (normalizedStatus === 'en cours') {
        if (index === 0) status = 'Termine';
        else if (index === 1) status = 'En cours';
      } else if (normalizedStatus === 'bloquee' || normalizedStatus === 'bloque') {
        if (index === 0) status = 'Bloquee';
      }
      return {
        label,
        assignedTo: 'RH Operations',
        status,
      };
    });
  }

  private normalizeOnboardingChecklistProgress(
    value: unknown,
    checklistTasks: OnboardingChecklistTask[],
    onboardingStatus: string
  ): OnboardingChecklistProgress {
    const fallbackProgress = this.buildOnboardingChecklistProgress(checklistTasks, onboardingStatus);
    if (value && typeof value === 'object') {
      const total = this.toNonNegativeInt(readField(value, ['total'], checklistTasks.length), checklistTasks.length);
      const completed = this.toNonNegativeInt(readField(value, ['completed'], 0), 0);
      const inProgress = this.toNonNegativeInt(readField(value, ['inProgress', 'in_progress'], 0), 0);
      const blocked = this.toNonNegativeInt(
        readField(value, ['blocked'], checklistTasks.filter((task) => task.status === 'Bloquee').length),
        0
      );
      const todo = this.toNonNegativeInt(readField(value, ['todo'], Math.max(0, total - completed - inProgress - blocked)), 0);
      const completionRate = Number(readField(value, ['completionRate', 'completion_rate'], this.computePercent(completed, total)));
      const statusRaw = String(readField(value, ['status'], '') || '').trim();
      const status = statusRaw === 'Termine' || statusRaw === 'En cours' || statusRaw === 'Non demarre' || statusRaw === 'Bloque'
        ? statusRaw
        : fallbackProgress.status;

      return {
        total,
        completed,
        inProgress,
        blocked,
        todo,
        completionRate: Number.isFinite(completionRate) ? completionRate : 0,
        status,
      };
    }
    return fallbackProgress;
  }

  private buildOnboardingChecklistProgress(
    checklistTasks: OnboardingChecklistTask[],
    onboardingStatus: string
  ): OnboardingChecklistProgress {
    const total = checklistTasks.length;
    const completed = checklistTasks.filter((task) => task.status === 'Termine').length;
    const inProgress = checklistTasks.filter((task) => task.status === 'En cours').length;
    const blocked = checklistTasks.filter((task) => task.status === 'Bloquee').length;
    const todo = Math.max(0, total - completed - inProgress - blocked);
    const completionRate = this.computePercent(completed, total);

    let status: OnboardingChecklistProgress['status'] = 'Non demarre';
    if (completionRate >= 100 || total > 0 && completed === total) {
      status = 'Termine';
    } else if (blocked > 0) {
      status = 'Bloque';
    } else if (inProgress > 0 || completed > 0) {
      status = 'En cours';
    } else {
      const normalized = String(onboardingStatus || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
      if (normalized === 'termine' || normalized === 'valide') status = 'Termine';
      else if (normalized === 'en cours') status = 'En cours';
      else if (normalized === 'bloquee' || normalized === 'bloque') status = 'Bloque';
    }

    return {
      total,
      completed,
      inProgress,
      blocked,
      todo,
      completionRate,
      status,
    };
  }

  private normalizeOnboardingDate(value: unknown): string | undefined {
    const dateRaw = String(value || '').trim();
    if (!dateRaw) {
      return undefined;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
      return dateRaw;
    }
    const parsed = Date.parse(dateRaw);
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    return new Date(parsed).toISOString().slice(0, 10);
  }

  private normalizeOnboardingEscalationLevel(value: unknown): OnboardingEscalationLevel | undefined {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    if (normalized === 'n1' || normalized === 'niveau1') return 'N1';
    if (normalized === 'n2' || normalized === 'niveau2') return 'N2';
    if (normalized === 'n3' || normalized === 'niveau3') return 'N3';
    return undefined;
  }

  private normalizeOnboardingTaskEscalation(
    value: unknown,
    fallbackDate?: string
  ): OnboardingTaskEscalation | undefined {
    if (!value || typeof value !== 'object') {
      return undefined;
    }
    const level = this.normalizeOnboardingEscalationLevel(readField(value, ['level'], ''));
    if (!level) {
      return undefined;
    }

    const triggeredAt = this.normalizeOnboardingDate(
      readField(value, ['triggeredAt', 'triggered_at'], fallbackDate || '')
    );
    const delayDays = this.toNonNegativeInt(readField(value, ['delayDays', 'delay_days'], 0), 0);
    const target = this.normalizeOptionalText(toStringValue(readField(value, ['target'], '')).trim()) || 'Manager RH';

    return {
      level,
      triggeredAt: triggeredAt || fallbackDate || '',
      delayDays,
      target,
    };
  }

  private normalizeOnboardingHistoryType(value: unknown): OnboardingHistoryEvent['type'] | undefined {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    if (normalized === 'blocage' || normalized === 'blocked') return 'Blocage';
    if (normalized === 'deblocage' || normalized === 'unblocked') return 'Deblocage';
    if (normalized === 'escalade auto' || normalized === 'escalade_auto' || normalized === 'auto escalation') {
      return 'Escalade auto';
    }
    return undefined;
  }

  private normalizeOnboardingHistoryEvents(
    value: unknown,
    checklistTasks: OnboardingChecklistTask[]
  ): OnboardingHistoryEvent[] {
    const automaticEvents = this.buildOnboardingHistoryFromTasks(checklistTasks);
    const manualEvents = Array.isArray(value)
      ? value
          .map((entry) => {
            const eventType = this.normalizeOnboardingHistoryType(readField(entry, ['type'], ''));
            const taskLabel = toStringValue(readField(entry, ['taskLabel', 'task_label'], '')).trim();
            const detail = toStringValue(readField(entry, ['detail', 'message'], '')).trim();
            const occurredAt = this.normalizeOnboardingDate(readField(entry, ['occurredAt', 'occurred_at'], ''));
            if (!eventType || !taskLabel || !detail || !occurredAt) {
              return null;
            }
            const escalationLevel = this.normalizeOnboardingEscalationLevel(
              readField(entry, ['escalationLevel', 'escalation_level'], '')
            );
            const id = this.normalizeOptionalText(toStringValue(readField(entry, ['id'], '')).trim())
              || `${eventType}-${taskLabel}-${occurredAt}`.replace(/\s+/g, '-').toUpperCase();
            return {
              id,
              type: eventType,
              taskLabel,
              detail,
              occurredAt,
              escalationLevel,
            } as OnboardingHistoryEvent;
          })
          .filter((entry): entry is OnboardingHistoryEvent => !!entry)
      : [];

    const merged = [...manualEvents, ...automaticEvents];
    const deduped = new Map<string, OnboardingHistoryEvent>();
    merged.forEach((event) => {
      const key = `${event.type}|${event.taskLabel}|${event.occurredAt}|${event.detail}|${event.escalationLevel || ''}`.toLowerCase();
      if (!deduped.has(key)) {
        deduped.set(key, event);
      }
    });
    return Array.from(deduped.values()).sort((left, right) => {
      const leftTime = Date.parse(left.occurredAt);
      const rightTime = Date.parse(right.occurredAt);
      const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
      const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
      return safeRight - safeLeft;
    });
  }

  private buildOnboardingHistoryFromTasks(checklistTasks: OnboardingChecklistTask[]): OnboardingHistoryEvent[] {
    const events: OnboardingHistoryEvent[] = [];
    checklistTasks.forEach((task) => {
      if (task.status !== 'Bloquee') {
        return;
      }
      const blockedDate = this.normalizeOnboardingDate(task.blockedSince || task.dueDate || '');
      if (blockedDate) {
        events.push({
          id: `BLOCAGE-${task.label}-${blockedDate}`.replace(/\s+/g, '-').toUpperCase(),
          type: 'Blocage',
          taskLabel: task.label,
          detail: task.blockedReason || `Blocage detecte sur la tache ${task.label}`,
          occurredAt: blockedDate,
        });
      }
      if (task.escalation?.level && task.escalation.triggeredAt) {
        events.push({
          id: `ESCALADE-${task.label}-${task.escalation.triggeredAt}-${task.escalation.level}`.replace(/\s+/g, '-').toUpperCase(),
          type: 'Escalade auto',
          taskLabel: task.label,
          detail: `Escalade ${task.escalation.level} vers ${task.escalation.target}`,
          occurredAt: task.escalation.triggeredAt,
          escalationLevel: task.escalation.level,
        });
      }
    });
    return events;
  }

  private normalizeCandidateEmail(value: unknown): string | undefined {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return undefined;
    }
    return normalized;
  }

  private normalizeCandidatePhone(value: unknown): string | undefined {
    const raw = String(value || '').trim();
    if (!raw) {
      return undefined;
    }
    const digits = raw.replace(/[^\d+]/g, '');
    if (digits.length < 8 || digits.length > 20) {
      return undefined;
    }
    return digits.startsWith('+') ? digits : `+${digits}`;
  }

  private normalizeCandidateIdentity(value: unknown): string | undefined {
    const normalized = String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '');
    return normalized.length > 0 ? normalized : undefined;
  }

  private derivePseudoSeed(reference: string, key: string): number {
    const source = `${String(reference || '').trim().toUpperCase()}|${key}`;
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = (hash << 5) - hash + source.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private derivePseudoPercentage(reference: string, key: string, min: number, max: number): number {
    const safeMin = Math.max(0, Math.floor(min));
    const safeMax = Math.max(safeMin, Math.floor(max));
    const spread = safeMax - safeMin + 1;
    const seed = this.derivePseudoSeed(reference, key);
    return safeMin + (seed % spread);
  }

  private derivePseudoExperienceYears(reference: string): number {
    return Math.max(0, this.derivePseudoPercentage(reference, 'experienceYears', 1, 8));
  }

  private normalizeRecruitmentScoringCriterionKey(
    value: unknown,
    fallback: RecruitmentScoringCriterion['key']
  ): RecruitmentScoringCriterion['key'] {
    const normalized = String(value || '').trim();
    if (normalized === 'experienceYears') return 'experienceYears';
    if (normalized === 'skillsMatch') return 'skillsMatch';
    if (normalized === 'educationLevel') return 'educationLevel';
    if (normalized === 'interviewAverage') return 'interviewAverage';
    if (normalized === 'testScore') return 'testScore';
    return fallback;
  }

  private scoringCriterionLabel(key: RecruitmentScoringCriterion['key']): string {
    if (key === 'experienceYears') return 'Experience pertinente';
    if (key === 'skillsMatch') return 'Adequation competences';
    if (key === 'educationLevel') return 'Niveau academique';
    if (key === 'interviewAverage') return 'Evaluation entretien';
    return 'Score test technique';
  }

  private normalizeRecruitmentScoringCriteria(value: unknown): RecruitmentScoringCriterion[] {
    const fallback = this.defaultScoringPolicy.criteria.map((entry) => ({ ...entry }));
    if (!Array.isArray(value) || value.length === 0) {
      return fallback;
    }

    const allowedKeys: RecruitmentScoringCriterion['key'][] = [
      'experienceYears',
      'skillsMatch',
      'educationLevel',
      'interviewAverage',
      'testScore',
    ];

    const byKey = new Map<RecruitmentScoringCriterion['key'], RecruitmentScoringCriterion>();
    value.forEach((entry) => {
      const fallbackKey = allowedKeys[byKey.size] || 'skillsMatch';
      const key = this.normalizeRecruitmentScoringCriterionKey(readField(entry, ['key'], fallbackKey), fallbackKey);
      const label = this.normalizeOptionalText(readField(entry, ['label'], '')) || this.scoringCriterionLabel(key);
      const weight = Math.max(1, this.toNonNegativeInt(readField(entry, ['weight'], 1), 1));
      const maxYears = key === 'experienceYears'
        ? Math.max(1, this.toNonNegativeInt(readField(entry, ['maxYears', 'max_years'], 10), 10))
        : undefined;
      byKey.set(key, {
        key,
        label,
        weight,
        maxYears,
      });
    });

    const normalized = Array.from(byKey.values());
    if (normalized.length === 0) {
      return fallback;
    }

    const totalWeight = normalized.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
      return fallback;
    }

    let remaining = 100;
    const rebalanced = normalized.map((item, index) => {
      if (index === normalized.length - 1) {
        return {
          ...item,
          weight: Math.max(1, remaining),
        };
      }
      const computed = Math.max(1, Math.round((item.weight / totalWeight) * 100));
      remaining -= computed;
      return {
        ...item,
        weight: computed,
      };
    });

    const currentTotal = rebalanced.reduce((sum, item) => sum + item.weight, 0);
    if (currentTotal !== 100) {
      const delta = 100 - currentTotal;
      const last = rebalanced[rebalanced.length - 1];
      last.weight = Math.max(1, last.weight + delta);
    }

    return rebalanced;
  }

  private normalizeRecruitmentScoringPolicy(dto: RecruitmentScoringPolicyDto | null | undefined): RecruitmentScoringPolicy {
    const criteria = this.normalizeRecruitmentScoringCriteria(readField(dto || {}, ['criteria'], []));
    const updatedAt = this.normalizeHistoryChangedAt(
      toStringValue(readField(dto || {}, ['updatedAt', 'updated_at'], '')).trim(),
      ''
    );
    const updatedBy = this.normalizeOptionalText(
      toStringValue(readField(dto || {}, ['updatedBy', 'updated_by'], '')).trim()
    ) || 'system';

    return {
      criteria,
      updatedAt,
      updatedBy,
    };
  }

  private readLocalScoringPolicy(): RecruitmentScoringPolicy {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return {
        ...this.defaultScoringPolicy,
        criteria: this.defaultScoringPolicy.criteria.map((entry) => ({ ...entry })),
      };
    }

    const raw = window.localStorage.getItem(this.localScoringPolicyKey);
    if (!raw) {
      return {
        ...this.defaultScoringPolicy,
        criteria: this.defaultScoringPolicy.criteria.map((entry) => ({ ...entry })),
      };
    }
    try {
      const parsed = JSON.parse(raw) as RecruitmentScoringPolicyDto;
      return this.normalizeRecruitmentScoringPolicy(parsed);
    } catch {
      return {
        ...this.defaultScoringPolicy,
        criteria: this.defaultScoringPolicy.criteria.map((entry) => ({ ...entry })),
      };
    }
  }

  private writeLocalScoringPolicy(policy: RecruitmentScoringPolicy): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localScoringPolicyKey, JSON.stringify(policy));
  }

  private updateLocalScoringPolicy(criteria: RecruitmentScoringCriterion[]): RecruitmentScoringPolicy {
    const updated: RecruitmentScoringPolicy = {
      criteria: this.normalizeRecruitmentScoringCriteria(criteria),
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
    this.writeLocalScoringPolicy(updated);
    return updated;
  }

  private normalizeRecruitmentScoreDetail(
    value: RecruitmentApplicationScoreDetailDto | RecruitmentApplicationScoreDetail
  ): RecruitmentApplicationScoreDetail {
    const criterionKey = this.normalizeRecruitmentScoringCriterionKey(
      readField(value, ['criterionKey', 'criterion_key'], 'skillsMatch'),
      'skillsMatch'
    );
    const criterionLabel = this.normalizeOptionalText(
      toStringValue(readField(value, ['criterionLabel', 'criterion_label'], '')).trim()
    ) || this.scoringCriterionLabel(criterionKey);
    const weight = Math.max(1, this.toNonNegativeInt(readField(value, ['weight'], 1), 1));
    const rawScore = Math.min(100, this.toNonNegativeInt(readField(value, ['rawScore', 'raw_score'], 0), 0));
    const weightedScore = Math.round(((rawScore * weight) / 100) * 10) / 10;
    const justification = this.normalizeOptionalText(readField(value, ['justification'], ''))
      || 'Critere evalue automatiquement';
    return {
      criterionKey,
      criterionLabel,
      weight,
      rawScore,
      weightedScore,
      justification,
    };
  }

  private scoreLocalApplication(
    application: Application,
    criteria: RecruitmentScoringCriterion[]
  ): RecruitmentApplicationScoreEntry {
    const reference = String(application.reference || '').trim().toUpperCase();
    const details = criteria.map((criterion) => {
      if (criterion.key === 'experienceYears') {
        const maxYears = Math.max(1, this.toNonNegativeInt(criterion.maxYears, 10));
        const years = this.toNonNegativeInt(
          application.experienceYears,
          this.derivePseudoExperienceYears(reference)
        );
        const rawScore = Math.min(100, Math.round((Math.min(maxYears, years) / maxYears) * 100));
        return this.normalizeRecruitmentScoreDetail({
          criterionKey: criterion.key,
          criterionLabel: criterion.label,
          weight: criterion.weight,
          rawScore,
          justification: `${years} an(s) d experience sur cible ${maxYears} an(s).`,
        });
      }

      const fallback = this.derivePseudoPercentage(reference, criterion.key, 45, 92);
      const valueByCriterion = (() => {
        if (criterion.key === 'skillsMatch') return application.skillsMatch;
        if (criterion.key === 'educationLevel') return application.educationLevel;
        if (criterion.key === 'interviewAverage') return application.interviewAverage;
        return application.testScore;
      })();
      const rawScore = Math.min(100, this.toNonNegativeInt(valueByCriterion, fallback));
      const justification = criterion.key === 'skillsMatch'
        ? `Matching competences estime a ${rawScore}%.`
        : criterion.key === 'educationLevel'
          ? `Niveau academique converti en score ${rawScore}%.`
          : criterion.key === 'interviewAverage'
            ? rawScore > 0
              ? `Evaluation entretien moyenne ${rawScore}%.`
              : 'Entretien non encore conduit, score provisoire.'
            : `Resultat test technique ${rawScore}%.`;

      return this.normalizeRecruitmentScoreDetail({
        criterionKey: criterion.key,
        criterionLabel: criterion.label,
        weight: criterion.weight,
        rawScore,
        justification,
      });
    });

    const totalScore = Math.round(details.reduce((sum, detail) => sum + detail.weightedScore, 0) * 10) / 10;
    return {
      reference,
      candidate: application.candidate,
      position: application.position,
      campaign: application.campaign,
      status: application.status,
      receivedOn: application.receivedOn,
      totalScore,
      rank: 0,
      details,
    };
  }

  private normalizeRecruitmentApplicationScore(
    value: RecruitmentApplicationScoreDto,
    fallbackRank: number
  ): RecruitmentApplicationScoreEntry | null {
    const reference = String(readField(value, ['reference'], '') || '').trim().toUpperCase();
    const candidate = String(readField(value, ['candidate'], '') || '').trim();
    const position = String(readField(value, ['position'], '') || '').trim();
    const campaign = String(readField(value, ['campaign'], '') || '').trim();
    const status = this.normalizeApplicationStatus(readField(value, ['status'], 'Nouveau'), 'Nouveau');
    const receivedOn = String(readField(value, ['receivedOn', 'received_on'], '') || '').trim();
    if (!reference || !candidate || !position) {
      return null;
    }
    const details = Array.isArray(readField(value, ['details'], []))
      ? (readField(value, ['details'], []) as RecruitmentApplicationScoreDetailDto[]).map((entry) =>
          this.normalizeRecruitmentScoreDetail(entry)
        )
      : [];
    const totalScore = Math.round(this.toNonNegativeInt(
      readField(value, ['totalScore', 'total_score'], details.reduce((sum, item) => sum + item.weightedScore, 0)),
      Math.round(details.reduce((sum, item) => sum + item.weightedScore, 0))
    ) * 10) / 10;
    const rank = this.toStrictPositiveInt(readField(value, ['rank'], fallbackRank), fallbackRank);
    return {
      reference,
      candidate,
      position,
      campaign,
      status,
      receivedOn,
      totalScore,
      rank,
      details,
    };
  }

  private normalizeRecruitmentApplicationScoresResponse(
    dto: RecruitmentApplicationScoresResponseDto
  ): RecruitmentApplicationScoresResponse {
    const policy = this.normalizeRecruitmentScoringPolicy({
      criteria: readField(dto || {}, ['criteria'], this.readLocalScoringPolicy().criteria),
      updatedAt: readField(dto || {}, ['policyUpdatedAt', 'policy_updated_at'], this.readLocalScoringPolicy().updatedAt),
      updatedBy: this.readLocalScoringPolicy().updatedBy,
    });
    this.writeLocalScoringPolicy(policy);

    const itemsRaw = Array.isArray(readField(dto || {}, ['items'], []))
      ? (readField(dto || {}, ['items'], []) as RecruitmentApplicationScoreDto[])
      : [];
    const items = itemsRaw
      .map((entry, index) => this.normalizeRecruitmentApplicationScore(entry, index + 1))
      .filter((entry): entry is RecruitmentApplicationScoreEntry => !!entry)
      .sort((left, right) => {
        if (left.totalScore !== right.totalScore) {
          return right.totalScore - left.totalScore;
        }
        const leftTs = Date.parse(left.receivedOn);
        const rightTs = Date.parse(right.receivedOn);
        const safeLeft = Number.isNaN(leftTs) ? 0 : leftTs;
        const safeRight = Number.isNaN(rightTs) ? 0 : rightTs;
        return safeRight - safeLeft;
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    return {
      policyUpdatedAt: policy.updatedAt,
      criteria: policy.criteria,
      items,
    };
  }

  private buildLocalRecruitmentApplicationScoresResponse(
    query?: RecruitmentApplicationScoresQuery
  ): RecruitmentApplicationScoresResponse {
    const policy = this.readLocalScoringPolicy();
    const campaign = String(query?.campaign || '').trim().toLowerCase();
    const position = String(query?.position || '').trim().toLowerCase();
    const includeStatuses = Array.isArray(query?.includeStatuses) ? query?.includeStatuses : [];
    const statusSet = new Set(includeStatuses);

    let items = this.readLocalApplications()
      .filter((application) => {
        if (campaign && !application.campaign.toLowerCase().includes(campaign)) {
          return false;
        }
        if (position && !application.position.toLowerCase().includes(position)) {
          return false;
        }
        if (statusSet.size > 0 && !statusSet.has(application.status)) {
          return false;
        }
        return true;
      })
      .map((application) => this.scoreLocalApplication(application, policy.criteria))
      .sort((left, right) => {
        if (left.totalScore !== right.totalScore) {
          return right.totalScore - left.totalScore;
        }
        const leftTs = Date.parse(left.receivedOn);
        const rightTs = Date.parse(right.receivedOn);
        const safeLeft = Number.isNaN(leftTs) ? 0 : leftTs;
        const safeRight = Number.isNaN(rightTs) ? 0 : rightTs;
        return safeRight - safeLeft;
      });

    const search = String(query?.q || '').trim().toLowerCase();
    if (search) {
      items = items.filter((item) =>
        item.reference.toLowerCase().includes(search)
        || item.candidate.toLowerCase().includes(search)
        || item.position.toLowerCase().includes(search)
        || item.campaign.toLowerCase().includes(search)
        || item.status.toLowerCase().includes(search)
      );
    }

    const sortBy = String(query?.sortBy || 'totalScore').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    items.sort((left, right) => {
      const leftValue = this.readRecruitmentScoreField(left, sortBy);
      const rightValue = this.readRecruitmentScoreField(right, sortBy);
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
    const paged = items.slice(offset, offset + limit).map((item, index) => ({
      ...item,
      rank: offset + index + 1,
    }));

    return {
      policyUpdatedAt: policy.updatedAt,
      criteria: policy.criteria,
      items: paged,
    };
  }

  private readRecruitmentScoreField(item: RecruitmentApplicationScoreEntry, field: string): string | number {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'candidate':
        return item.candidate;
      case 'position':
        return item.position;
      case 'campaign':
        return item.campaign;
      case 'status':
        return item.status;
      case 'receivedOn':
        return item.receivedOn;
      case 'rank':
        return item.rank;
      case 'totalScore':
      default:
        return item.totalScore;
    }
  }

  private normalizeRecruitmentShortlistSuggestion(
    value: RecruitmentShortlistSuggestionDto,
    fallbackRank: number
  ): RecruitmentShortlistSuggestion | null {
    const score = this.normalizeRecruitmentApplicationScore(value, fallbackRank);
    if (!score) {
      return null;
    }
    const justification = this.normalizeOptionalText(readField(value, ['justification'], ''))
      || score.details
        .slice()
        .sort((left, right) => right.weightedScore - left.weightedScore)
        .slice(0, 2)
        .map((detail) => `${detail.criterionLabel}: ${detail.rawScore}%`)
        .join(' | ');
    const validationStatusRaw = String(readField(value, ['validationStatus', 'validation_status'], 'PENDING') || '').trim().toUpperCase();
    const validationStatus: RecruitmentShortlistSuggestion['validationStatus'] =
      validationStatusRaw === 'VALIDATED'
        ? 'VALIDATED'
        : validationStatusRaw === 'REJECTED'
          ? 'REJECTED'
          : 'PENDING';
    const validatedAt = this.normalizeOptionalText(
      toStringValue(readField(value, ['validatedAt', 'validated_at'], '')).trim()
    );
    return {
      ...score,
      justification,
      validationRequired: !!readField(value, ['validationRequired', 'validation_required'], true),
      validationStatus,
      validatedAt,
      validatedBy: this.normalizeOptionalText(
        toStringValue(readField(value, ['validatedBy', 'validated_by'], '')).trim()
      ),
      validationNote: this.normalizeOptionalText(
        toStringValue(readField(value, ['validationNote', 'validation_note'], '')).trim()
      ),
    };
  }

  private normalizeRecruitmentShortlistSuggestionResponse(
    dto: RecruitmentShortlistSuggestionResponseDto
  ): RecruitmentShortlistSuggestionResponse {
    const generatedAt = this.normalizeHistoryChangedAt(
      toStringValue(readField(dto || {}, ['generatedAt', 'generated_at'], '')).trim(),
      ''
    );
    const topN = this.toStrictPositiveInt(readField(dto || {}, ['topN', 'top_n'], 5), 5);
    const totalCandidates = this.toNonNegativeInt(
      readField(dto || {}, ['totalCandidates', 'total_candidates'], 0),
      0
    );
    const criteriaVersion = this.normalizeOptionalText(
      toStringValue(readField(dto || {}, ['criteriaVersion', 'criteria_version'], '')).trim()
    ) || this.readLocalScoringPolicy().updatedAt;
    const suggestedRaw = Array.isArray(readField(dto || {}, ['suggested'], []))
      ? (readField(dto || {}, ['suggested'], []) as RecruitmentShortlistSuggestionDto[])
      : [];
    const suggested = suggestedRaw
      .map((entry, index) => this.normalizeRecruitmentShortlistSuggestion(entry, index + 1))
      .filter((entry): entry is RecruitmentShortlistSuggestion => !!entry);

    return {
      generatedAt,
      topN,
      totalCandidates: Math.max(totalCandidates, suggested.length),
      criteriaVersion,
      suggested,
    };
  }

  private buildLocalRecruitmentShortlistSuggestionResponse(payload: {
    topN: number;
    campaign?: string;
    position?: string;
    includeStatuses?: RecruitmentApplicationStatus[];
  }): RecruitmentShortlistSuggestionResponse {
    const fallbackStatuses: RecruitmentApplicationStatus[] = ['Nouveau', 'Preselection', 'Entretien'];
    const scores = this.buildLocalRecruitmentApplicationScoresResponse({
      campaign: payload.campaign,
      position: payload.position,
      includeStatuses: payload.includeStatuses && payload.includeStatuses.length > 0
        ? payload.includeStatuses
        : fallbackStatuses,
      limit: 500,
      page: 1,
      sortBy: 'totalScore',
      sortOrder: 'desc',
    });
    const validationsByReference = new Map(
      this.readLocalShortlistValidations().map((entry) => [entry.reference, entry])
    );
    const topN = this.toStrictPositiveInt(payload.topN, 5);
    const suggested = scores.items.slice(0, topN).map((entry) => {
      const strongest = [...entry.details]
        .sort((left, right) => right.weightedScore - left.weightedScore)
        .slice(0, 2);
      const validation = validationsByReference.get(entry.reference);
      return {
        ...entry,
        justification: strongest.map((item) => `${item.criterionLabel}: ${item.rawScore}%`).join(' | ')
          || 'Score global prioritaire',
        validationRequired: true,
        validationStatus: validation?.decision || 'PENDING',
        validatedAt: validation?.validatedAt,
        validatedBy: validation?.validatedBy,
        validationNote: validation?.note,
      } as RecruitmentShortlistSuggestion;
    });

    return {
      generatedAt: new Date().toISOString(),
      topN,
      totalCandidates: scores.items.length,
      criteriaVersion: scores.policyUpdatedAt,
      suggested,
    };
  }

  private normalizeRecruitmentShortlistValidation(
    dto: RecruitmentShortlistValidationDto | RecruitmentShortlistValidationEntry
  ): RecruitmentShortlistValidationEntry {
    const reference = String(readField(dto, ['reference'], '') || '').trim().toUpperCase();
    const decisionRaw = String(readField(dto, ['decision'], 'VALIDATED') || '').trim().toUpperCase();
    const decision: RecruitmentShortlistValidationEntry['decision'] =
      decisionRaw === 'REJECTED' ? 'REJECTED' : 'VALIDATED';
    const note = this.normalizeOptionalText(readField(dto, ['note'], ''));
    const validatedAt = this.normalizeHistoryChangedAt(
      toStringValue(readField(dto, ['validatedAt', 'validated_at'], '')).trim(),
      ''
    );
    const validatedBy = this.normalizeOptionalText(
      toStringValue(readField(dto, ['validatedBy', 'validated_by'], '')).trim()
    ) || 'system';
    return {
      reference,
      decision,
      note,
      validatedAt,
      validatedBy,
    };
  }

  private mapRecruitmentShortlistValidations(items: RecruitmentShortlistValidationDto[]): RecruitmentShortlistValidationEntry[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((entry) => this.normalizeRecruitmentShortlistValidation(entry))
      .filter((entry) => !!entry.reference);
  }

  private readLocalShortlistValidations(): RecruitmentShortlistValidationEntry[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }
    const raw = window.localStorage.getItem(this.localShortlistValidationsKey);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((entry) => this.normalizeRecruitmentShortlistValidation(entry as RecruitmentShortlistValidationDto))
        .filter((entry) => !!entry.reference);
    } catch {
      return [];
    }
  }

  private writeLocalShortlistValidations(items: RecruitmentShortlistValidationEntry[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localShortlistValidationsKey, JSON.stringify(items));
  }

  private upsertLocalShortlistValidation(
    entry: RecruitmentShortlistValidationEntry
  ): RecruitmentShortlistValidationEntry {
    const current = this.readLocalShortlistValidations();
    const index = current.findIndex((item) => item.reference === entry.reference);
    if (index >= 0) {
      current[index] = entry;
    } else {
      current.push(entry);
    }
    this.writeLocalShortlistValidations(current);
    return entry;
  }

  private normalizeRecruitmentDuplicateCase(
    dto: RecruitmentDuplicateCaseDto
  ): RecruitmentDuplicateCase | null {
    const id = this.normalizeOptionalText(toStringValue(readField(dto, ['id'], '')).trim());
    const matchTypeRaw = String(readField(dto, ['matchType', 'match_type'], '') || '').trim().toLowerCase();
    const matchType: RecruitmentDuplicateCase['matchType'] =
      matchTypeRaw === 'phone'
        ? 'phone'
        : matchTypeRaw === 'identity'
          ? 'identity'
          : matchTypeRaw === 'email'
            ? 'email'
            : 'email';
    const matchValue = this.normalizeOptionalText(toStringValue(readField(dto, ['matchValue', 'match_value'], '')).trim());
    const applicationsRaw = Array.isArray(readField(dto, ['applications'], []))
      ? (readField(dto, ['applications'], []) as RecruitmentDuplicateCase['applications'])
      : [];
    const applications = applicationsRaw
      .map((item) => ({
        reference: String(readField(item, ['reference'], '') || '').trim().toUpperCase(),
        candidate: String(readField(item, ['candidate'], '') || '').trim(),
        status: this.normalizeApplicationStatus(readField(item, ['status'], 'Nouveau'), 'Nouveau'),
        campaign: String(readField(item, ['campaign'], '') || '').trim(),
        position: String(readField(item, ['position'], '') || '').trim(),
      }))
      .filter((item) => !!item.reference && !!item.candidate && !!item.position);
    if (!id || !matchValue || applications.length < 2) {
      return null;
    }
    return {
      id,
      matchType,
      matchLabel: this.normalizeOptionalText(readField(dto, ['matchLabel', 'match_label'], ''))
        || (matchType === 'phone' ? 'telephone' : matchType === 'identity' ? 'identite' : 'email'),
      matchValue,
      count: this.toStrictPositiveInt(readField(dto, ['count'], applications.length), applications.length),
      suggestedPrimaryReference: this.normalizeOptionalText(
        toStringValue(readField(dto, ['suggestedPrimaryReference', 'suggested_primary_reference'], '')).trim().toUpperCase()
      ),
      applications,
    };
  }

  private mapRecruitmentDuplicateCases(items: RecruitmentDuplicateCaseDto[]): RecruitmentDuplicateCase[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((entry) => this.normalizeRecruitmentDuplicateCase(entry))
      .filter((entry): entry is RecruitmentDuplicateCase => !!entry)
      .sort((left, right) => right.count - left.count);
  }

  private findLocalDuplicateMatches(
    candidate: { candidateEmail?: unknown; candidatePhone?: unknown; identityNumber?: unknown },
    existingItems: Application[],
    currentReference = ''
  ): RecruitmentDuplicateCandidateMatch[] {
    const normalizedReference = String(currentReference || '').trim().toUpperCase();
    const candidateEmail = this.normalizeCandidateEmail(candidate.candidateEmail);
    const candidatePhone = this.normalizeCandidatePhone(candidate.candidatePhone);
    const identityNumber = this.normalizeCandidateIdentity(candidate.identityNumber);
    if (!candidateEmail && !candidatePhone && !identityNumber) {
      return [];
    }

    return existingItems
      .filter((item) => item.reference !== normalizedReference)
      .map((item) => {
        const matchTypes: Array<'email' | 'phone' | 'identity'> = [];
        if (
          candidateEmail
          && this.normalizeCandidateEmail(item.candidateEmail)
          && this.normalizeCandidateEmail(item.candidateEmail) === candidateEmail
        ) {
          matchTypes.push('email');
        }
        if (
          candidatePhone
          && this.normalizeCandidatePhone(item.candidatePhone)
          && this.normalizeCandidatePhone(item.candidatePhone) === candidatePhone
        ) {
          matchTypes.push('phone');
        }
        if (
          identityNumber
          && this.normalizeCandidateIdentity(item.identityNumber)
          && this.normalizeCandidateIdentity(item.identityNumber) === identityNumber
        ) {
          matchTypes.push('identity');
        }
        if (matchTypes.length === 0) {
          return null;
        }
        return {
          reference: item.reference,
          candidate: item.candidate,
          status: item.status,
          campaign: item.campaign,
          position: item.position,
          matchTypes,
        } satisfies RecruitmentDuplicateCandidateMatch;
      })
      .filter((entry): entry is RecruitmentDuplicateCandidateMatch => !!entry);
  }

  private buildLocalRecruitmentDuplicateCases(): RecruitmentDuplicateCase[] {
    const bySignature = new Map<string, Application[]>();
    this.readLocalApplications().forEach((application) => {
      const email = this.normalizeCandidateEmail(application.candidateEmail);
      const phone = this.normalizeCandidatePhone(application.candidatePhone);
      const identity = this.normalizeCandidateIdentity(application.identityNumber);
      const signatures = [
        email ? `email:${email}` : '',
        phone ? `phone:${phone}` : '',
        identity ? `identity:${identity}` : '',
      ].filter((entry) => !!entry);
      signatures.forEach((signature) => {
        const current = bySignature.get(signature) || [];
        current.push(application);
        bySignature.set(signature, current);
      });
    });

    const cases: RecruitmentDuplicateCase[] = [];
    bySignature.forEach((applications, signature) => {
      if (applications.length < 2) {
        return;
      }
      const [rawType, rawValue] = signature.split(':');
      const matchType: RecruitmentDuplicateCase['matchType'] =
        rawType === 'phone' ? 'phone' : rawType === 'identity' ? 'identity' : 'email';
      const applicationsList = applications
        .map((item) => ({
          reference: item.reference,
          candidate: item.candidate,
          status: item.status,
          campaign: item.campaign,
          position: item.position,
        }))
        .sort((left, right) => left.reference.localeCompare(right.reference));
      const caseId = `DEDUP-${matchType.toUpperCase()}-${this.derivePseudoSeed(applicationsList.map((item) => item.reference).join('|'), rawValue || '')}`;
      cases.push({
        id: caseId,
        matchType,
        matchLabel: matchType === 'phone' ? 'telephone' : matchType === 'identity' ? 'identite' : 'email',
        matchValue: rawValue || '',
        count: applicationsList.length,
        suggestedPrimaryReference: applicationsList[0]?.reference,
        applications: applicationsList,
      });
    });
    return cases.sort((left, right) => right.count - left.count);
  }

  private normalizeRecruitmentDuplicateLink(dto: RecruitmentDuplicateLinkDto): RecruitmentDuplicateLink | null {
    const id = this.normalizeOptionalText(toStringValue(readField(dto, ['id'], '')).trim());
    const primaryReference = this.normalizeOptionalText(
      toStringValue(readField(dto, ['primaryReference', 'primary_reference'], '')).trim().toUpperCase()
    );
    const secondaryReference = this.normalizeOptionalText(
      toStringValue(readField(dto, ['secondaryReference', 'secondary_reference'], '')).trim().toUpperCase()
    );
    if (!id || !primaryReference || !secondaryReference) {
      return null;
    }
    const modeRaw = String(readField(dto, ['mode'], 'link') || '').trim().toLowerCase();
    const mode: RecruitmentDuplicateLink['mode'] = modeRaw === 'merge' ? 'merge' : 'link';
    const reason = this.normalizeOptionalText(readField(dto, ['reason'], '')) || 'Traitement dedoublonnage manuel';
    const linkedAt = this.normalizeHistoryChangedAt(
      toStringValue(readField(dto, ['linkedAt', 'linked_at'], '')).trim(),
      ''
    );
    const linkedBy = this.normalizeOptionalText(
      toStringValue(readField(dto, ['linkedBy', 'linked_by'], '')).trim()
    ) || 'system';
    return {
      id,
      primaryReference,
      secondaryReference,
      mode,
      reason,
      linkedAt,
      linkedBy,
    };
  }

  private mapRecruitmentDuplicateLinks(items: RecruitmentDuplicateLinkDto[]): RecruitmentDuplicateLink[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((entry) => this.normalizeRecruitmentDuplicateLink(entry))
      .filter((entry): entry is RecruitmentDuplicateLink => !!entry);
  }

  private readLocalDuplicateLinks(): RecruitmentDuplicateLink[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }
    const raw = window.localStorage.getItem(this.localDuplicateLinksKey);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((entry) => this.normalizeRecruitmentDuplicateLink(entry as RecruitmentDuplicateLinkDto))
        .filter((entry): entry is RecruitmentDuplicateLink => !!entry);
    } catch {
      return [];
    }
  }

  private writeLocalDuplicateLinks(items: RecruitmentDuplicateLink[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localDuplicateLinksKey, JSON.stringify(items));
  }

  private upsertLocalDuplicateLink(link: RecruitmentDuplicateLink): RecruitmentDuplicateLink {
    const current = this.readLocalDuplicateLinks();
    const index = current.findIndex(
      (item) =>
        item.primaryReference === link.primaryReference
        && item.secondaryReference === link.secondaryReference
    );
    if (index >= 0) {
      current[index] = link;
    } else {
      current.push(link);
    }
    this.writeLocalDuplicateLinks(current);
    return link;
  }

  private normalizeRecruitmentDuplicateLinkResult(
    dto: RecruitmentDuplicateLinkResultDto
  ): RecruitmentDuplicateLinkResult {
    const link = this.normalizeRecruitmentDuplicateLink(readField(dto, ['link'], {} as RecruitmentDuplicateLinkDto))
      || {
        id: `DEDUP-LINK-${Date.now()}`,
        primaryReference: '',
        secondaryReference: '',
        mode: 'link',
        reason: 'Traitement dedoublonnage manuel',
        linkedAt: new Date().toISOString(),
        linkedBy: 'system',
      };
    const primary = this.normalizeApplication(readField(dto, ['primary'], {} as ApplicationDto), link.primaryReference);
    const secondary = this.normalizeApplication(readField(dto, ['secondary'], {} as ApplicationDto), link.secondaryReference);
    return {
      link,
      primary,
      secondary,
    };
  }

  private resolveLocalDuplicateLink(payload: {
    primaryReference: string;
    secondaryReference: string;
    mode: 'link' | 'merge';
    reason: string;
  }): RecruitmentDuplicateLinkResult {
    const applications = this.readLocalApplications();
    const primaryIndex = applications.findIndex((item) => item.reference === payload.primaryReference);
    const secondaryIndex = applications.findIndex((item) => item.reference === payload.secondaryReference);
    if (primaryIndex < 0 || secondaryIndex < 0) {
      throw new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { message: 'Candidature introuvable pour operation dedoublonnage' },
      });
    }
    const now = new Date().toISOString();
    const link: RecruitmentDuplicateLink = {
      id: `DEDUP-LINK-${Date.now()}`,
      primaryReference: payload.primaryReference,
      secondaryReference: payload.secondaryReference,
      mode: payload.mode,
      reason: payload.reason,
      linkedAt: now,
      linkedBy: 'system',
    };

    const primary = { ...applications[primaryIndex] };
    const secondary = { ...applications[secondaryIndex] };
    if (payload.mode === 'merge') {
      const mergedComments = this.normalizeApplicationComments([
        ...(primary.comments || []),
        ...(secondary.comments || []),
      ]);
      const mergedAttachments = this.normalizeApplicationAttachments([
        ...(primary.attachments || []),
        ...(secondary.attachments || []),
      ]);
      const mergedHistory = this.normalizeStatusHistory(
        [...(primary.statusHistory || []), ...(secondary.statusHistory || [])],
        primary.status,
        primary.receivedOn
      );
      primary.comments = mergedComments;
      primary.attachments = mergedAttachments;
      primary.statusHistory = mergedHistory;

      const fromStatus = secondary.status;
      secondary.status = 'Rejete';
      secondary.statusHistory = [
        ...(secondary.statusHistory || []),
        this.buildStatusHistoryEntry(fromStatus, 'Rejete', 'system', `Fusion vers ${primary.reference}`),
      ];
    }
    applications[primaryIndex] = primary;
    applications[secondaryIndex] = secondary;
    this.writeLocalApplications(applications);
    this.upsertLocalDuplicateLink(link);
    return {
      link,
      primary,
      secondary,
    };
  }

  private normalizeInterviewQuestionList(value: unknown): string[] {
    let rawItems: unknown[] = [];
    if (Array.isArray(value)) {
      rawItems = value;
    } else if (typeof value === 'string') {
      rawItems = value.split(/\r?\n/);
    }
    return rawItems
      .map((entry) => String(entry || '').trim().replace(/\s+/g, ' '))
      .filter((entry) => entry.length > 0);
  }

  private normalizeRecruitmentInterviewQuestionTemplate(
    dto: RecruitmentInterviewQuestionTemplateDto
  ): RecruitmentInterviewQuestionTemplate {
    const position = String(readField(dto, ['position'], '') || '').trim();
    const version = this.toStrictPositiveInt(readField(dto, ['version'], 1), 1);
    const id = this.normalizeOptionalText(toStringValue(readField(dto, ['id'], '')).trim())
      || this.buildInterviewQuestionTemplateId(position, version);
    const questions = this.normalizeInterviewQuestionList(readField(dto, ['questions'], []));
    const createdAt = this.normalizeHistoryChangedAt(
      toStringValue(readField(dto, ['createdAt', 'created_at'], '')).trim(),
      ''
    );
    const updatedAt = this.normalizeHistoryChangedAt(
      toStringValue(readField(dto, ['updatedAt', 'updated_at'], '')).trim(),
      createdAt
    );
    const createdBy = this.normalizeOptionalText(
      toStringValue(readField(dto, ['createdBy', 'created_by'], '')).trim()
    ) || 'system';
    return {
      id,
      position,
      version,
      questions,
      createdAt,
      updatedAt,
      createdBy,
    };
  }

  private mapRecruitmentInterviewQuestionTemplates(
    items: RecruitmentInterviewQuestionTemplateDto[]
  ): RecruitmentInterviewQuestionTemplate[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((entry) => this.normalizeRecruitmentInterviewQuestionTemplate(entry))
      .filter((entry) => !!entry.id && !!entry.position && entry.questions.length > 0)
      .sort((left, right) => {
        if (left.position !== right.position) {
          return left.position.localeCompare(right.position);
        }
        return right.version - left.version;
      });
  }

  private defaultInterviewQuestionTemplates(): RecruitmentInterviewQuestionTemplate[] {
    return [
      {
        id: 'IQB-ANALYSTE-RECRUTEMENT-V1',
        position: 'Analyste Recrutement',
        version: 1,
        questions: [
          'Comment structurez-vous un processus de sourcing pour un poste penurique ?',
          'Quelle methode utilisez-vous pour evaluer l objectivite d un entretien ?',
          'Donnez un exemple de KPI recrutement que vous avez fait progresser.',
        ],
        createdAt: '2026-03-14T09:00:00.000Z',
        updatedAt: '2026-03-14T09:00:00.000Z',
        createdBy: 'responsable.rh',
      },
      {
        id: 'IQB-GESTIONNAIRE-PAIE-V1',
        position: 'Gestionnaire Paie',
        version: 1,
        questions: [
          'Expliquez votre methode de controle d un bulletin avant validation.',
          'Comment traitez-vous une anomalie de cotisation detectee apres cloture ?',
          'Quel est votre plan de secours si le cycle paie est bloque la veille de paie ?',
        ],
        createdAt: '2026-03-10T08:30:00.000Z',
        updatedAt: '2026-03-10T08:30:00.000Z',
        createdBy: 'manager.paie',
      },
    ];
  }

  private readLocalInterviewQuestionBank(
    query?: CollectionQueryOptions & { position?: string; latestOnly?: boolean }
  ): RecruitmentInterviewQuestionTemplate[] {
    let items = this.defaultInterviewQuestionTemplates();
    if (this.fallbackEnabled && this.hasLocalStorage()) {
      const raw = window.localStorage.getItem(this.localInterviewQuestionBankKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            items = this.mapRecruitmentInterviewQuestionTemplates(parsed as RecruitmentInterviewQuestionTemplateDto[]);
          }
        } catch {
          items = this.defaultInterviewQuestionTemplates();
        }
      }
    }

    const position = String(query?.position || '').trim().toLowerCase();
    const search = String(query?.q || '').trim().toLowerCase();
    if (position) {
      items = items.filter((item) => item.position.toLowerCase().includes(position));
    }
    if (search) {
      items = items.filter((item) => {
        return (
          item.id.toLowerCase().includes(search)
          || item.position.toLowerCase().includes(search)
          || item.questions.some((question) => question.toLowerCase().includes(search))
        );
      });
    }
    if (query?.latestOnly) {
      const byPosition = new Map<string, RecruitmentInterviewQuestionTemplate>();
      items.forEach((item) => {
        const key = item.position.toLowerCase();
        const current = byPosition.get(key);
        if (!current || item.version > current.version) {
          byPosition.set(key, item);
        }
      });
      items = Array.from(byPosition.values());
    }

    items.sort((left, right) => {
      if (left.position !== right.position) {
        return left.position.localeCompare(right.position);
      }
      return right.version - left.version;
    });

    if (!query) {
      return items;
    }
    const limit = this.toStrictPositiveInt(query.limit, 200);
    const page = this.toStrictPositiveInt(query.page, 1);
    const offset = (page - 1) * limit;
    return items.slice(offset, offset + limit);
  }

  private writeLocalInterviewQuestionBank(items: RecruitmentInterviewQuestionTemplate[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localInterviewQuestionBankKey, JSON.stringify(items));
  }

  private buildInterviewQuestionTemplateId(position: string, version: number): string {
    const normalizedPosition = String(position || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'POSTE';
    return `IQB-${normalizedPosition.slice(0, 40)}-V${version}`;
  }

  private mergeInterviewQuestionTemplates(
    existing: RecruitmentInterviewQuestionTemplate[],
    incoming: RecruitmentInterviewQuestionTemplate[]
  ): RecruitmentInterviewQuestionTemplate[] {
    const map = new Map<string, RecruitmentInterviewQuestionTemplate>();
    existing.forEach((entry) => map.set(entry.id, entry));
    incoming.forEach((entry) => map.set(entry.id, entry));
    return Array.from(map.values()).sort((left, right) => {
      if (left.position !== right.position) {
        return left.position.localeCompare(right.position);
      }
      return right.version - left.version;
    });
  }

  private appendLocalInterviewQuestionTemplate(
    template: RecruitmentInterviewQuestionTemplate
  ): RecruitmentInterviewQuestionTemplate {
    const current = this.readLocalInterviewQuestionBank();
    const merged = this.mergeInterviewQuestionTemplates(current, [template]);
    this.writeLocalInterviewQuestionBank(merged);
    return template;
  }

  private createLocalInterviewQuestionTemplate(payload: {
    position: string;
    questions: string[];
  }): RecruitmentInterviewQuestionTemplate {
    const current = this.readLocalInterviewQuestionBank();
    const samePosition = current.filter((item) => item.position.toLowerCase() === payload.position.toLowerCase());
    const maxVersion = samePosition.reduce((max, item) => Math.max(max, item.version), 0);
    const nextVersion = maxVersion + 1;
    const now = new Date().toISOString();
    const created: RecruitmentInterviewQuestionTemplate = {
      id: this.buildInterviewQuestionTemplateId(payload.position, nextVersion),
      position: payload.position,
      version: nextVersion,
      questions: this.normalizeInterviewQuestionList(payload.questions),
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    };
    this.writeLocalInterviewQuestionBank([...current, created]);
    return created;
  }

  private normalizeRecruitmentInterviewQuestionImportResult(
    dto: RecruitmentInterviewQuestionImportResultDto
  ): RecruitmentInterviewQuestionImportResult {
    const items = this.mapRecruitmentInterviewQuestionTemplates(readField(dto || {}, ['items'], []));
    const errors = Array.isArray(readField(dto || {}, ['errors'], []))
      ? (readField(dto || {}, ['errors'], []) as unknown[]).map((entry) => String(entry || '').trim()).filter((entry) => !!entry)
      : [];
    const importedCount = this.toNonNegativeInt(
      readField(dto || {}, ['importedCount', 'imported_count'], items.length),
      items.length
    );
    return {
      importedCount,
      errors,
      items,
    };
  }

  private importLocalInterviewQuestionBank(payload: {
    format: 'csv' | 'json';
    content?: string;
    items?: Array<{ position: string; questions: string[] }>;
  }): RecruitmentInterviewQuestionImportResult {
    const entries: Array<{ position: string; questions: string[] }> = [];
    if (payload.format === 'csv') {
      const lines = String(payload.content || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      lines.forEach((line, index) => {
        if (index === 0 && /position/i.test(line) && /questions?/i.test(line)) {
          return;
        }
        const parts = line.split(';');
        const position = String(parts[0] || '').trim();
        const questions = parts
          .slice(1)
          .join(';')
          .split('|')
          .map((question) => question.trim())
          .filter((question) => question.length > 0);
        if (position && questions.length > 0) {
          entries.push({ position, questions });
        }
      });
    } else if (Array.isArray(payload.items)) {
      payload.items.forEach((item) => {
        const position = String(item.position || '').trim();
        const questions = this.normalizeInterviewQuestionList(item.questions);
        if (position && questions.length > 0) {
          entries.push({ position, questions });
        }
      });
    }

    const created: RecruitmentInterviewQuestionTemplate[] = [];
    const errors: string[] = [];
    entries.forEach((entry, index) => {
      if (entry.position.length < 2) {
        errors.push(`Ligne ${index + 1}: poste invalide`);
        return;
      }
      if (entry.questions.length === 0) {
        errors.push(`Ligne ${index + 1}: aucune question`);
        return;
      }
      created.push(this.createLocalInterviewQuestionTemplate(entry));
    });
    return {
      importedCount: created.length,
      errors,
      items: created,
    };
  }

  private normalizeRecruitmentInterviewQuestionExportResult(
    dto: RecruitmentInterviewQuestionExportResultDto
  ): RecruitmentInterviewQuestionExportResult {
    const formatRaw = String(readField(dto || {}, ['format'], 'json') || '').trim().toLowerCase();
    const format: RecruitmentInterviewQuestionExportResult['format'] = formatRaw === 'csv' ? 'csv' : 'json';
    const content = String(readField(dto || {}, ['content'], '') || '');
    const itemsCount = this.toNonNegativeInt(
      readField(dto || {}, ['itemsCount', 'items_count'], 0),
      0
    );
    const exportedAt = this.normalizeHistoryChangedAt(
      toStringValue(readField(dto || {}, ['exportedAt', 'exported_at'], '')).trim(),
      ''
    );
    return {
      format,
      content,
      itemsCount,
      exportedAt,
    };
  }

  private exportLocalInterviewQuestionBank(params?: {
    format?: 'csv' | 'json';
    position?: string;
    latestOnly?: boolean;
  }): RecruitmentInterviewQuestionExportResult {
    const format: RecruitmentInterviewQuestionExportResult['format'] = params?.format === 'csv' ? 'csv' : 'json';
    const items = this.readLocalInterviewQuestionBank({
      position: params?.position,
      latestOnly: params?.latestOnly,
      limit: 500,
      page: 1,
    });
    if (format === 'csv') {
      const lines = ['position;version;questions'];
      items.forEach((item) => {
        const sanitizedPosition = item.position.replace(/;/g, ',');
        const questions = item.questions
          .map((question) => question.replace(/[;\n\r|]/g, ' ').trim())
          .join(' | ');
        lines.push(`${sanitizedPosition};${item.version};${questions}`);
      });
      return {
        format,
        content: lines.join('\n'),
        itemsCount: items.length,
        exportedAt: new Date().toISOString(),
      };
    }
    return {
      format,
      content: JSON.stringify(items, null, 2),
      itemsCount: items.length,
      exportedAt: new Date().toISOString(),
    };
  }

  private applyLocalCollectionOptions<T>(
    items: T[],
    query: CollectionQueryOptions | undefined,
    options: {
      searchText: (item: T) => string;
      sortValue: (item: T, sortBy: string) => unknown;
    }
  ): T[] {
    let next = [...items];
    const search = String(query?.q || '').trim().toLowerCase();
    if (search) {
      next = next.filter((item) => options.searchText(item).toLowerCase().includes(search));
    }

    const sortBy = String(query?.sortBy || '').trim();
    const sortOrder = String(query?.sortOrder || 'desc').trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
    if (sortBy) {
      next.sort((left, right) => {
        const leftValue = options.sortValue(left, sortBy);
        const rightValue = options.sortValue(right, sortBy);
        const compared = this.compareLocalValues(leftValue, rightValue);
        return sortOrder === 'asc' ? compared : -compared;
      });
    }

    const page = this.toStrictPositiveInt(query?.page, 1);
    const limit = this.toStrictPositiveInt(query?.limit, Math.max(1, next.length || 1));
    const start = Math.max(0, (page - 1) * limit);
    return next.slice(start, start + limit);
  }

  private compareLocalValues(left: unknown, right: unknown): number {
    const leftNumber = this.toComparableNumber(left);
    const rightNumber = this.toComparableNumber(right);
    if (leftNumber !== null && rightNumber !== null) {
      return leftNumber - rightNumber;
    }
    const leftText = String(left || '').toLowerCase();
    const rightText = String(right || '').toLowerCase();
    return leftText.localeCompare(rightText);
  }

  private toComparableNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    const dateLike = Date.parse(String(value || '').trim());
    if (!Number.isNaN(dateLike)) {
      return dateLike;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return null;
  }

  private mapRecruitmentInterviewSchedules(items: RecruitmentInterviewScheduleDto[]): RecruitmentInterviewSchedule[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((item) => this.normalizeRecruitmentInterviewSchedule(item))
      .filter((item) => !!item.id);
  }

  private normalizeRecruitmentInterviewSchedule(
    dto: RecruitmentInterviewScheduleDto,
    fallbackId = ''
  ): RecruitmentInterviewSchedule {
    const id = String(readField(dto || {}, ['id'], fallbackId || this.buildLocalInterviewId()) || '')
      .trim()
      .toUpperCase();
    const applicationReference = String(
      readField(dto || {}, ['applicationReference', 'application_reference'], '')
    ).trim().toUpperCase();
    const candidate = String(readField(dto || {}, ['candidate'], '') || '').trim();
    const position = String(readField(dto || {}, ['position'], '') || '').trim();
    const campaign = String(readField(dto || {}, ['campaign'], '') || '').trim();
    const slotStart = this.normalizeHistoryChangedAt(
      String(readField(dto || {}, ['slotStart', 'slot_start'], '') || '').trim(),
      new Date().toISOString()
    );
    const slotEnd = this.normalizeHistoryChangedAt(
      String(readField(dto || {}, ['slotEnd', 'slot_end'], '') || '').trim(),
      slotStart
    );
    const interviewersRaw = readField(dto || {}, ['interviewers', 'panel'], []);
    const interviewers = Array.isArray(interviewersRaw)
      ? Array.from(new Set(interviewersRaw.map((item) => String(item || '').trim()).filter((item) => !!item)))
      : [];
    const location = String(readField(dto || {}, ['location'], 'A definir') || '').trim() || 'A definir';
    const status = this.normalizeRecruitmentInterviewStatus(readField(dto || {}, ['status'], 'Planifie'), 'Planifie');
    const evaluations = this.mapRecruitmentInterviewEvaluations(readField(dto || {}, ['evaluations'], []));
    const history = this.mapRecruitmentInterviewHistory(readField(dto || {}, ['history'], []));
    const consolidation = this.normalizeRecruitmentInterviewConsolidation(
      readField(dto || {}, ['consolidation'], {}),
      evaluations
    );
    return {
      id,
      applicationReference,
      candidate,
      position,
      campaign,
      slotStart,
      slotEnd,
      interviewers,
      location,
      status,
      evaluations,
      history,
      consolidation,
    };
  }

  private normalizeRecruitmentInterviewStatus(
    value: unknown,
    fallback: RecruitmentInterviewStatus
  ): RecruitmentInterviewStatus {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    if (normalized === 'planifie' || normalized === 'planned') return 'Planifie';
    if (normalized === 'replanifie' || normalized === 'rescheduled') return 'Replanifie';
    if (normalized === 'termine' || normalized === 'completed') return 'Termine';
    if (normalized === 'annule' || normalized === 'cancelled' || normalized === 'canceled') return 'Annule';
    return fallback;
  }

  private mapRecruitmentInterviewEvaluations(input: unknown): RecruitmentInterviewEvaluation[] {
    if (!Array.isArray(input)) {
      return [];
    }
    return input
      .map((entry) => this.normalizeRecruitmentInterviewEvaluation(entry as RecruitmentInterviewEvaluationDto))
      .filter((entry) => !!entry.interviewer);
  }

  private normalizeRecruitmentInterviewEvaluation(
    dto: RecruitmentInterviewEvaluationDto
  ): RecruitmentInterviewEvaluation {
    const recommendationRaw = String(readField(dto || {}, ['recommendation'], 'Go') || '')
      .toLowerCase()
      .trim();
    return {
      interviewer: String(readField(dto || {}, ['interviewer'], '') || '').trim(),
      technicalScore: Math.max(0, Math.min(100, this.toNonNegativeInt(readField(dto || {}, ['technicalScore', 'technical_score'], 0), 0))),
      communicationScore: Math.max(0, Math.min(100, this.toNonNegativeInt(readField(dto || {}, ['communicationScore', 'communication_score'], 0), 0))),
      cultureFitScore: Math.max(0, Math.min(100, this.toNonNegativeInt(readField(dto || {}, ['cultureFitScore', 'culture_fit_score'], 0), 0))),
      recommendation: recommendationRaw === 'no-go' || recommendationRaw === 'nogo' ? 'No-Go' : 'Go',
      comment: String(readField(dto || {}, ['comment'], '') || '').trim(),
      submittedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['submittedAt', 'submitted_at'], '') || '').trim(),
        new Date().toISOString()
      ),
    };
  }

  private mapRecruitmentInterviewHistory(input: unknown): RecruitmentInterviewHistoryEvent[] {
    if (!Array.isArray(input)) {
      return [];
    }
    return input
      .map((entry) => {
        const dto = entry as RecruitmentInterviewHistoryEventDto;
        return {
          type: String(readField(dto || {}, ['type'], 'Event') || '').trim() || 'Event',
          detail: String(readField(dto || {}, ['detail'], '') || '').trim() || 'Event',
          at: this.normalizeHistoryChangedAt(
            String(readField(dto || {}, ['at', 'occurredAt', 'occurred_at'], '') || '').trim(),
            new Date().toISOString()
          ),
          actor: String(readField(dto || {}, ['actor'], 'system') || '').trim() || 'system',
        };
      })
      .sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
  }

  private normalizeRecruitmentInterviewConsolidation(
    dto: RecruitmentInterviewConsolidationDto,
    evaluations: RecruitmentInterviewEvaluation[]
  ): RecruitmentInterviewConsolidation {
    const recommendationRaw = String(readField(dto || {}, ['recommendation'], '') || '').toLowerCase().trim();
    let recommendation: RecruitmentInterviewConsolidation['recommendation'] = 'Pending';
    if (recommendationRaw === 'go') recommendation = 'Go';
    if (recommendationRaw === 'no-go' || recommendationRaw === 'nogo') recommendation = 'No-Go';
    const evaluators = this.toNonNegativeInt(
      readField(dto || {}, ['evaluators'], evaluations.length),
      evaluations.length
    );
    const overallScore = Math.max(
      0,
      Math.min(100, this.toNonNegativeInt(readField(dto || {}, ['overallScore', 'overall_score'], 0), 0))
    );
    if (evaluators === 0 && evaluations.length > 0) {
      return this.buildLocalRecruitmentInterviewConsolidation(evaluations);
    }
    if (recommendation === 'Pending' && evaluations.length > 0) {
      return this.buildLocalRecruitmentInterviewConsolidation(evaluations);
    }
    return { evaluators, overallScore, recommendation };
  }

  private normalizeCreateRecruitmentInterviewPayload(
    payload: CreateRecruitmentInterviewPayload
  ): CreateRecruitmentInterviewPayload {
    return {
      applicationReference: String(payload.applicationReference || '').trim().toUpperCase(),
      slotStart: this.normalizeHistoryChangedAt(String(payload.slotStart || '').trim(), new Date().toISOString()),
      slotEnd: this.normalizeHistoryChangedAt(String(payload.slotEnd || '').trim(), new Date().toISOString()),
      interviewers: Array.from(new Set(
        (Array.isArray(payload.interviewers) ? payload.interviewers : [])
          .map((entry) => String(entry || '').trim())
          .filter((entry) => !!entry)
      )),
      location: this.normalizeOptionalText(payload.location) || 'A definir',
    };
  }

  private normalizeRescheduleRecruitmentInterviewPayload(
    payload: RescheduleRecruitmentInterviewPayload
  ): RescheduleRecruitmentInterviewPayload {
    return {
      slotStart: this.normalizeHistoryChangedAt(String(payload.slotStart || '').trim(), new Date().toISOString()),
      slotEnd: this.normalizeHistoryChangedAt(String(payload.slotEnd || '').trim(), new Date().toISOString()),
      interviewers: Array.from(new Set(
        (Array.isArray(payload.interviewers) ? payload.interviewers : [])
          .map((entry) => String(entry || '').trim())
          .filter((entry) => !!entry)
      )),
      location: this.normalizeOptionalText(payload.location) || 'A definir',
      reason: this.normalizeOptionalText(payload.reason) || 'Replanification manuelle',
    };
  }

  private normalizeCreateRecruitmentInterviewEvaluationPayload(
    payload: CreateRecruitmentInterviewEvaluationPayload
  ): CreateRecruitmentInterviewEvaluationPayload {
    return {
      interviewer: String(payload.interviewer || '').trim(),
      technicalScore: Math.max(0, Math.min(100, this.toNonNegativeInt(payload.technicalScore, 0))),
      communicationScore: Math.max(0, Math.min(100, this.toNonNegativeInt(payload.communicationScore, 0))),
      cultureFitScore: Math.max(0, Math.min(100, this.toNonNegativeInt(payload.cultureFitScore, 0))),
      recommendation: payload.recommendation === 'No-Go' ? 'No-Go' : 'Go',
      comment: this.normalizeOptionalText(payload.comment) || '',
    };
  }

  private applyLocalRecruitmentInterviewsQuery(
    items: RecruitmentInterviewSchedule[],
    query?: RecruitmentInterviewsQuery
  ): RecruitmentInterviewSchedule[] {
    const applicationReference = String(query?.applicationReference || '').trim().toUpperCase();
    const campaign = String(query?.campaign || '').trim().toLowerCase();
    const status = String(query?.status || '').trim().toLowerCase();
    let next = [...items];
    if (applicationReference) {
      next = next.filter((item) => String(item.applicationReference || '').trim().toUpperCase() === applicationReference);
    }
    if (campaign) {
      next = next.filter((item) => String(item.campaign || '').toLowerCase().includes(campaign));
    }
    if (status) {
      next = next.filter((item) => String(item.status || '').toLowerCase().includes(status));
    }
    return this.applyLocalCollectionOptions(next, query, {
      searchText: (item) => `${item.id} ${item.applicationReference} ${item.candidate} ${item.position} ${item.campaign} ${item.location} ${item.status}`,
      sortValue: (item, sortBy) => {
        if (sortBy === 'slotEnd') return item.slotEnd;
        if (sortBy === 'candidate') return item.candidate;
        if (sortBy === 'status') return item.status;
        return item.slotStart;
      },
    });
  }

  private readLocalInterviews(): RecruitmentInterviewSchedule[] {
    if (!this.hasLocalStorage()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(this.localInterviewsKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((entry) => this.normalizeRecruitmentInterviewSchedule(entry as RecruitmentInterviewScheduleDto));
    } catch {
      return [];
    }
  }

  private writeLocalInterviews(items: RecruitmentInterviewSchedule[]): void {
    if (!this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localInterviewsKey, JSON.stringify(items));
  }

  private upsertLocalInterview(interview: RecruitmentInterviewSchedule): RecruitmentInterviewSchedule {
    const current = this.readLocalInterviews();
    const index = current.findIndex((item) => item.id === interview.id);
    if (index >= 0) {
      current[index] = interview;
    } else {
      current.push(interview);
    }
    this.writeLocalInterviews(current);
    return interview;
  }

  private buildLocalInterviewId(): string {
    const year = new Date().getFullYear();
    const current = this.readLocalInterviews();
    const regex = new RegExp(`^INT-${year}-(\\d+)$`);
    const max = current.reduce((acc, item) => {
      const match = regex.exec(String(item.id || ''));
      if (!match) return acc;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(acc, value) : acc;
    }, 0);
    return `INT-${year}-${String(max + 1).padStart(3, '0')}`;
  }

  private createLocalInterview(payload: CreateRecruitmentInterviewPayload): RecruitmentInterviewSchedule {
    const applications = this.readLocalApplications();
    const linked = applications.find((item) => item.reference === payload.applicationReference);
    const created: RecruitmentInterviewSchedule = {
      id: this.buildLocalInterviewId(),
      applicationReference: payload.applicationReference,
      candidate: linked?.candidate || '',
      position: linked?.position || '',
      campaign: linked?.campaign || '',
      slotStart: this.normalizeHistoryChangedAt(payload.slotStart, new Date().toISOString()),
      slotEnd: this.normalizeHistoryChangedAt(payload.slotEnd, payload.slotStart),
      interviewers: Array.isArray(payload.interviewers) ? payload.interviewers : [],
      location: this.normalizeOptionalText(payload.location) || 'A definir',
      status: 'Planifie',
      evaluations: [],
      history: [
        {
          type: 'Creation',
          detail: `Reservation creneau entretien ${payload.applicationReference}`,
          at: new Date().toISOString(),
          actor: 'system',
        },
      ],
      consolidation: {
        evaluators: 0,
        overallScore: 0,
        recommendation: 'Pending',
      },
    };
    return this.upsertLocalInterview(created);
  }

  private rescheduleLocalInterview(
    interviewId: string,
    payload: RescheduleRecruitmentInterviewPayload
  ): RecruitmentInterviewSchedule {
    const current = this.readLocalInterviews();
    const index = current.findIndex((item) => item.id === interviewId);
    let target: RecruitmentInterviewSchedule;
    if (index >= 0) {
      target = {
        ...current[index],
        slotStart: payload.slotStart,
        slotEnd: payload.slotEnd,
        location: payload.location || current[index].location,
        interviewers: payload.interviewers?.length ? payload.interviewers : current[index].interviewers,
        status: 'Replanifie',
        history: [
          {
            type: 'Replanification',
            detail: payload.reason || 'Replanification manuelle',
            at: new Date().toISOString(),
            actor: 'system',
          },
          ...(current[index].history || []),
        ],
      };
      current[index] = target;
    } else {
      target = {
        id: interviewId,
        applicationReference: '',
        candidate: '',
        position: '',
        campaign: '',
        slotStart: payload.slotStart,
        slotEnd: payload.slotEnd,
        interviewers: payload.interviewers || [],
        location: payload.location || 'A definir',
        status: 'Replanifie',
        evaluations: [],
        history: [
          {
            type: 'Replanification',
            detail: payload.reason || 'Replanification manuelle',
            at: new Date().toISOString(),
            actor: 'system',
          },
        ],
        consolidation: {
          evaluators: 0,
          overallScore: 0,
          recommendation: 'Pending',
        },
      };
      current.push(target);
    }
    this.writeLocalInterviews(current);
    return target;
  }

  private appendLocalInterviewEvaluation(
    interviewId: string,
    payload: CreateRecruitmentInterviewEvaluationPayload
  ): RecruitmentInterviewSchedule {
    const current = this.readLocalInterviews();
    const index = current.findIndex((item) => item.id === interviewId);
    if (index < 0) {
      const created = this.createLocalInterview({
        applicationReference: '',
        slotStart: new Date().toISOString(),
        slotEnd: new Date().toISOString(),
        interviewers: [payload.interviewer],
        location: 'A definir',
      });
      created.id = interviewId;
      this.upsertLocalInterview(created);
      return this.appendLocalInterviewEvaluation(interviewId, payload);
    }
    const interview = current[index];
    const nextEvaluation: RecruitmentInterviewEvaluation = {
      interviewer: payload.interviewer,
      technicalScore: payload.technicalScore,
      communicationScore: payload.communicationScore,
      cultureFitScore: payload.cultureFitScore,
      recommendation: payload.recommendation === 'No-Go' ? 'No-Go' : 'Go',
      comment: payload.comment || '',
      submittedAt: new Date().toISOString(),
    };
    const existingIndex = interview.evaluations.findIndex((item) => item.interviewer === payload.interviewer);
    if (existingIndex >= 0) {
      interview.evaluations[existingIndex] = nextEvaluation;
    } else {
      interview.evaluations = [...interview.evaluations, nextEvaluation];
    }
    interview.consolidation = this.buildLocalRecruitmentInterviewConsolidation(interview.evaluations);
    if (interview.interviewers.length > 0 && interview.evaluations.length >= interview.interviewers.length) {
      interview.status = 'Termine';
    }
    current[index] = interview;
    this.writeLocalInterviews(current);
    return interview;
  }

  private buildLocalRecruitmentInterviewConsolidation(
    evaluations: RecruitmentInterviewEvaluation[]
  ): RecruitmentInterviewConsolidation {
    if (!evaluations.length) {
      return {
        evaluators: 0,
        overallScore: 0,
        recommendation: 'Pending',
      };
    }
    const averages = evaluations.map((entry) => {
      return (entry.technicalScore + entry.communicationScore + entry.cultureFitScore) / 3;
    });
    const overallScore = Math.round((averages.reduce((sum, value) => sum + value, 0) / averages.length) * 10) / 10;
    const goVotes = evaluations.filter((entry) => entry.recommendation === 'Go').length;
    const recommendation: RecruitmentInterviewConsolidation['recommendation'] =
      goVotes >= Math.ceil(evaluations.length / 2) ? 'Go' : 'No-Go';
    return {
      evaluators: evaluations.length,
      overallScore,
      recommendation,
    };
  }

  private normalizeRecruitmentWorkloadForecastResponse(
    dto: RecruitmentWorkloadForecastResponseDto
  ): RecruitmentWorkloadForecastResponse {
    return {
      generatedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['generatedAt', 'generated_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      items: Array.isArray(readField(dto || {}, ['items'], []))
        ? (readField(dto || {}, ['items'], []) as unknown[]).map((entry) =>
          this.normalizeRecruitmentWorkloadForecastEntry(entry as RecruitmentWorkloadForecastEntryDto)
        )
        : [],
    };
  }

  private normalizeRecruitmentWorkloadForecastEntry(
    dto: RecruitmentWorkloadForecastEntryDto
  ): RecruitmentWorkloadForecastEntry {
    const currentWeekLoad = this.toNonNegativeInt(readField(dto || {}, ['currentWeekLoad', 'current_week_load'], 0), 0);
    const targetPerWeek = Math.max(1, this.toNonNegativeInt(readField(dto || {}, ['targetPerWeek', 'target_per_week'], 6), 6));
    const ratio = currentWeekLoad / Math.max(1, targetPerWeek);
    const alertRaw = String(readField(dto || {}, ['alert'], '') || '').trim();
    const alert = alertRaw === 'Surcharge' || alertRaw === 'Sous-charge'
      ? alertRaw
      : ratio > 1.2
        ? 'Surcharge'
        : ratio < 0.5
          ? 'Sous-charge'
          : 'OK';
    return {
      recruiter: String(readField(dto || {}, ['recruiter'], '') || '').trim(),
      targetPerWeek,
      currentWeekLoad,
      upcomingTwoWeeksLoad: this.toNonNegativeInt(readField(dto || {}, ['upcomingTwoWeeksLoad', 'upcoming_two_weeks_load'], 0), 0),
      monthlyLoadEstimate: this.toNonNegativeInt(readField(dto || {}, ['monthlyLoadEstimate', 'monthly_load_estimate'], 0), 0),
      alert,
    };
  }

  private buildLocalRecruitmentWorkloadForecastResponse(): RecruitmentWorkloadForecastResponse {
    const interviews = this.readLocalInterviews();
    const now = new Date();
    const nowTs = now.getTime();
    const twoWeeksTs = nowTs + 14 * 86400000;
    const currentWeekKey = this.localWeekKey(nowTs);
    const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const byRecruiter = new Map<string, RecruitmentWorkloadForecastEntry>();

    interviews.forEach((interview) => {
      const startTs = Date.parse(interview.slotStart);
      interview.interviewers.forEach((recruiter) => {
        if (!byRecruiter.has(recruiter)) {
          byRecruiter.set(recruiter, {
            recruiter,
            targetPerWeek: 6,
            currentWeekLoad: 0,
            upcomingTwoWeeksLoad: 0,
            monthlyLoadEstimate: 0,
            alert: 'OK',
          });
        }
        const bucket = byRecruiter.get(recruiter) as RecruitmentWorkloadForecastEntry;
        if (!Number.isNaN(startTs)) {
          const weekKey = this.localWeekKey(startTs);
          const date = new Date(startTs);
          const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
          if (weekKey === currentWeekKey) {
            bucket.currentWeekLoad += 1;
          }
          if (startTs >= nowTs && startTs <= twoWeeksTs) {
            bucket.upcomingTwoWeeksLoad += 1;
          }
          if (monthKey === currentMonthKey) {
            bucket.monthlyLoadEstimate += 1;
          }
        }
      });
    });

    const items = Array.from(byRecruiter.values()).map((entry) => {
      const ratio = entry.currentWeekLoad / Math.max(1, entry.targetPerWeek);
      const alert: RecruitmentWorkloadForecastEntry['alert'] = ratio > 1.2
        ? 'Surcharge'
        : ratio < 0.5
          ? 'Sous-charge'
          : 'OK';
      return { ...entry, alert };
    });

    return {
      generatedAt: new Date().toISOString(),
      items,
    };
  }

  private localWeekKey(timestamp: number): string {
    const date = new Date(timestamp);
    const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = utc.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    utc.setUTCDate(utc.getUTCDate() - diffToMonday);
    return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(utc.getUTCDate()).padStart(2, '0')}`;
  }

  private normalizeRecruitmentCampaignBudgetsResponse(
    dto: RecruitmentCampaignBudgetsResponseDto
  ): RecruitmentCampaignBudgetsResponse {
    return {
      generatedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['generatedAt', 'generated_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      items: Array.isArray(readField(dto || {}, ['items'], []))
        ? (readField(dto || {}, ['items'], []) as unknown[]).map((entry) =>
          this.normalizeRecruitmentCampaignBudgetAnalyticsEntry(entry as RecruitmentCampaignBudgetAnalyticsEntryDto)
        )
        : [],
    };
  }

  private normalizeRecruitmentCampaignBudgetAnalyticsEntry(
    dto: RecruitmentCampaignBudgetAnalyticsEntryDto
  ): RecruitmentCampaignBudgetAnalyticsEntry {
    return {
      campaignCode: String(readField(dto || {}, ['campaignCode', 'campaign_code'], '') || '').trim().toUpperCase(),
      campaignTitle: String(readField(dto || {}, ['campaignTitle', 'campaign_title'], '') || '').trim(),
      budgetAmount: this.toNonNegativeInt(readField(dto || {}, ['budgetAmount', 'budget_amount'], 0), 0),
      expensesAmount: this.toNonNegativeInt(readField(dto || {}, ['expensesAmount', 'expenses_amount'], 0), 0),
      variance: this.toNonNegativeInt(readField(dto || {}, ['variance'], 0), 0),
      hires: this.toNonNegativeInt(readField(dto || {}, ['hires'], 0), 0),
      applications: this.toNonNegativeInt(readField(dto || {}, ['applications'], 0), 0),
      costPerApplication: this.toNonNegativeInt(readField(dto || {}, ['costPerApplication', 'cost_per_application'], 0), 0),
      costPerHire: this.toNonNegativeInt(readField(dto || {}, ['costPerHire', 'cost_per_hire'], 0), 0),
      currency: String(readField(dto || {}, ['currency'], 'GNF') || '').trim().toUpperCase() || 'GNF',
      updatedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['updatedAt', 'updated_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      updatedBy: String(readField(dto || {}, ['updatedBy', 'updated_by'], 'system') || '').trim() || 'system',
    };
  }

  private normalizeUpsertRecruitmentCampaignBudgetPayload(
    payload: UpsertRecruitmentCampaignBudgetPayload
  ): UpsertRecruitmentCampaignBudgetPayload {
    return {
      campaignCode: String(payload.campaignCode || '').trim().toUpperCase(),
      budgetAmount: this.toNonNegativeInt(payload.budgetAmount, 0),
      expensesAmount: this.toNonNegativeInt(payload.expensesAmount, 0),
      currency: String(payload.currency || 'GNF').trim().toUpperCase() || 'GNF',
    };
  }

  private normalizeRecruitmentCampaignBudgetUpsertResult(
    dto: RecruitmentCampaignBudgetAnalyticsEntryDto,
    fallbackPayload: UpsertRecruitmentCampaignBudgetPayload
  ): RecruitmentCampaignBudgetAnalyticsEntry {
    const normalized = this.normalizeRecruitmentCampaignBudgetAnalyticsEntry(dto);
    if (normalized.campaignCode) {
      return normalized;
    }
    return this.buildLocalCampaignBudgetFromPayload(fallbackPayload);
  }

  private buildLocalCampaignBudgetFromPayload(
    payload: UpsertRecruitmentCampaignBudgetPayload
  ): RecruitmentCampaignBudgetAnalyticsEntry {
    const campaigns = this.readLocalCampaigns();
    const applications = this.readLocalApplications().filter(
      (item) => String(item.campaign || '').trim().toUpperCase() === payload.campaignCode
    );
    const hires = applications.filter((item) => item.status === 'Retenu').length;
    const campaign = campaigns.find((item) => String(item.code || '').trim().toUpperCase() === payload.campaignCode);
    const costPerApplication = applications.length > 0 ? Math.round(payload.expensesAmount / applications.length) : 0;
    const costPerHire = hires > 0 ? Math.round(payload.expensesAmount / hires) : 0;
    return {
      campaignCode: payload.campaignCode,
      campaignTitle: campaign?.title || payload.campaignCode,
      budgetAmount: payload.budgetAmount,
      expensesAmount: payload.expensesAmount,
      variance: payload.budgetAmount - payload.expensesAmount,
      hires,
      applications: applications.length,
      costPerApplication,
      costPerHire,
      currency: payload.currency || 'GNF',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
  }

  private readLocalCampaignBudgets(): RecruitmentCampaignBudgetAnalyticsEntry[] {
    if (!this.hasLocalStorage()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(this.localCampaignBudgetsKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item) => this.normalizeRecruitmentCampaignBudgetAnalyticsEntry(item as RecruitmentCampaignBudgetAnalyticsEntryDto));
    } catch {
      return [];
    }
  }

  private writeLocalCampaignBudgets(items: RecruitmentCampaignBudgetAnalyticsEntry[]): void {
    if (!this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localCampaignBudgetsKey, JSON.stringify(items));
  }

  private upsertLocalCampaignBudget(
    item: RecruitmentCampaignBudgetAnalyticsEntry
  ): RecruitmentCampaignBudgetAnalyticsEntry {
    const current = this.readLocalCampaignBudgets();
    const index = current.findIndex((entry) => entry.campaignCode === item.campaignCode);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.push(item);
    }
    this.writeLocalCampaignBudgets(current);
    return item;
  }

  private mapRecruitmentOnboarding306090(items: RecruitmentOnboarding306090ItemDto[]): RecruitmentOnboarding306090Item[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((item) => this.normalizeRecruitmentOnboarding306090Item(item))
      .filter((item) => !!item.applicationReference);
  }

  private normalizeRecruitmentOnboarding306090Item(
    dto: RecruitmentOnboarding306090ItemDto
  ): RecruitmentOnboarding306090Item {
    const applicationReference = String(
      readField(dto || {}, ['applicationReference', 'application_reference'], '')
    ).trim().toUpperCase();
    const startDate = this.normalizeOnboardingDate(
      String(readField(dto || {}, ['startDate', 'start_date'], '') || '').trim()
    ) || new Date().toISOString().slice(0, 10);
    const milestonesInput = readField(dto || {}, ['milestones'], []);
    const milestones = Array.isArray(milestonesInput)
      ? milestonesInput.map((entry) => this.normalizeRecruitmentOnboardingMilestone(entry as RecruitmentOnboardingMilestoneDto))
      : [];
    const ensuredMilestones: RecruitmentOnboardingMilestone[] = [30, 60, 90].map((day) => {
      const existing = milestones.find((entry) => entry.day === day);
      if (existing) {
        return existing;
      }
      const targetDate = this.addDaysIso(startDate, day) || startDate;
      const targetTs = Date.parse(`${targetDate}T23:59:59.999Z`);
      const status: RecruitmentOnboardingMilestone['status'] =
        !Number.isNaN(targetTs) && Date.now() > targetTs ? 'En retard' : 'A venir';
      return {
        day: day as 30 | 60 | 90,
        targetDate,
        status,
        feedbacks: [],
      };
    });

    return {
      applicationReference,
      agent: String(readField(dto || {}, ['agent'], '') || '').trim(),
      position: String(readField(dto || {}, ['position'], '') || '').trim(),
      startDate,
      milestones: ensuredMilestones,
    };
  }

  private normalizeRecruitmentOnboardingMilestone(
    dto: RecruitmentOnboardingMilestoneDto
  ): RecruitmentOnboardingMilestone {
    const day = this.normalizeMilestoneDay(readField(dto || {}, ['day'], 30), 30);
    const targetDate = this.normalizeOnboardingDate(
      String(readField(dto || {}, ['targetDate', 'target_date'], '') || '').trim()
    ) || new Date().toISOString().slice(0, 10);
    const statusRaw = String(readField(dto || {}, ['status'], 'A venir') || '').trim().toLowerCase();
    const status: RecruitmentOnboardingMilestone['status'] =
      statusRaw === 'complete' || statusRaw === 'termine' || statusRaw === 'completee'
        ? 'Complete'
        : statusRaw === 'en retard' || statusRaw === 'retard'
          ? 'En retard'
          : 'A venir';
    const feedbacksInput = readField(dto || {}, ['feedbacks'], []);
    const feedbacks = Array.isArray(feedbacksInput)
      ? feedbacksInput.map((entry) => this.normalizeRecruitmentOnboardingMilestoneFeedback(entry as RecruitmentOnboardingMilestoneFeedbackDto))
      : [];
    return {
      day,
      targetDate,
      status,
      feedbacks,
    };
  }

  private normalizeCreateRecruitmentOnboardingMilestoneFeedbackPayload(
    payload: CreateRecruitmentOnboardingMilestoneFeedbackPayload
  ): CreateRecruitmentOnboardingMilestoneFeedbackPayload {
    return {
      day: this.normalizeMilestoneDay(payload.day, 30),
      authorRole: payload.authorRole === 'agent' ? 'agent' : 'manager',
      comment: String(payload.comment || '').trim(),
      score: Math.max(0, Math.min(100, this.toNonNegativeInt(payload.score, 0))),
    };
  }

  private normalizeRecruitmentOnboardingMilestoneFeedback(
    dto: RecruitmentOnboardingMilestoneFeedbackDto,
    fallbackReference = '',
    fallbackPayload?: CreateRecruitmentOnboardingMilestoneFeedbackPayload
  ): RecruitmentOnboardingMilestoneFeedback {
    return {
      id: String(readField(dto || {}, ['id'], `ONB-FB-${Date.now()}`) || '').trim().toUpperCase(),
      applicationReference: String(
        readField(dto || {}, ['applicationReference', 'application_reference'], fallbackReference)
      ).trim().toUpperCase(),
      day: this.normalizeMilestoneDay(readField(dto || {}, ['day'], fallbackPayload?.day || 30), 30),
      authorRole: String(readField(dto || {}, ['authorRole', 'author_role'], fallbackPayload?.authorRole || 'manager')) === 'agent'
        ? 'agent'
        : 'manager',
      author: String(readField(dto || {}, ['author'], 'system') || '').trim() || 'system',
      comment: String(readField(dto || {}, ['comment'], fallbackPayload?.comment || '') || '').trim(),
      score: Math.max(0, Math.min(100, this.toNonNegativeInt(readField(dto || {}, ['score'], fallbackPayload?.score || 0), 0))),
      createdAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['createdAt', 'created_at'], '') || '').trim(),
        new Date().toISOString()
      ),
    };
  }

  private normalizeMilestoneDay(value: unknown, fallback: 30 | 60 | 90): 30 | 60 | 90 {
    const numeric = this.toNonNegativeInt(value, fallback);
    if (numeric === 60) return 60;
    if (numeric === 90) return 90;
    return 30;
  }

  private readLocalOnboardingMilestones(
    query?: CollectionQueryOptions
  ): RecruitmentOnboarding306090Item[] {
    const fromStorage = this.readLocalOnboardingMilestonesRaw();
    const base = fromStorage.length > 0 ? fromStorage : this.buildLocalOnboardingMilestonesFromOnboarding();
    if (fromStorage.length === 0 && base.length > 0) {
      this.writeLocalOnboardingMilestones(base);
    }
    return this.applyLocalCollectionOptions(base, query, {
      searchText: (item) => `${item.applicationReference} ${item.agent} ${item.position} ${item.startDate}`,
      sortValue: (item, sortBy) => {
        if (sortBy === 'agent') return item.agent;
        if (sortBy === 'position') return item.position;
        return item.startDate;
      },
    });
  }

  private readLocalOnboardingMilestonesRaw(): RecruitmentOnboarding306090Item[] {
    if (!this.hasLocalStorage()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(this.localOnboardingMilestonesKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((entry) => this.normalizeRecruitmentOnboarding306090Item(entry as RecruitmentOnboarding306090ItemDto));
    } catch {
      return [];
    }
  }

  private writeLocalOnboardingMilestones(items: RecruitmentOnboarding306090Item[]): void {
    if (!this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localOnboardingMilestonesKey, JSON.stringify(items));
  }

  private buildLocalOnboardingMilestonesFromOnboarding(): RecruitmentOnboarding306090Item[] {
    const onboarding = this.readLocalOnboarding();
    return onboarding.map((item) => {
      const startDate = this.normalizeOnboardingDate(item.startDate) || new Date().toISOString().slice(0, 10);
      const reference = String(item.applicationReference || '').trim().toUpperCase()
        || `ONB-${this.normalizeIdPart(item.agent)}-${startDate}`;
      const milestones: RecruitmentOnboardingMilestone[] = [30, 60, 90].map((day) => {
        const targetDate = this.addDaysIso(startDate, day) || startDate;
        const targetTs = Date.parse(`${targetDate}T23:59:59.999Z`);
        const status: RecruitmentOnboardingMilestone['status'] =
          !Number.isNaN(targetTs) && Date.now() > targetTs ? 'En retard' : 'A venir';
        return {
          day: day as 30 | 60 | 90,
          targetDate,
          status,
          feedbacks: [],
        };
      });
      return {
        applicationReference: reference,
        agent: item.agent,
        position: item.position,
        startDate,
        milestones,
      };
    });
  }

  private appendLocalOnboardingMilestoneFeedback(
    feedback: RecruitmentOnboardingMilestoneFeedback
  ): RecruitmentOnboardingMilestoneFeedback {
    const base = this.readLocalOnboardingMilestonesRaw();
    const current = base.length > 0 ? base : this.buildLocalOnboardingMilestonesFromOnboarding();
    const reference = feedback.applicationReference;
    let index = current.findIndex((item) => item.applicationReference === reference);
    if (index < 0) {
      const onboardingItem = this.readLocalOnboarding().find((item) => {
        return String(item.applicationReference || '').trim().toUpperCase() === reference;
      });
      const startDate = this.normalizeOnboardingDate(onboardingItem?.startDate || '') || new Date().toISOString().slice(0, 10);
      current.push({
        applicationReference: reference,
        agent: onboardingItem?.agent || '',
        position: onboardingItem?.position || '',
        startDate,
        milestones: [30, 60, 90].map((day) => ({
          day: day as 30 | 60 | 90,
          targetDate: this.addDaysIso(startDate, day) || startDate,
          status: 'A venir',
          feedbacks: [],
        })),
      });
      index = current.length - 1;
    }
    const item = current[index];
    const milestoneIndex = item.milestones.findIndex((entry) => entry.day === feedback.day);
    if (milestoneIndex >= 0) {
      const milestone = item.milestones[milestoneIndex];
      const exists = milestone.feedbacks.some((entry) => entry.id === feedback.id);
      milestone.feedbacks = exists
        ? milestone.feedbacks.map((entry) => (entry.id === feedback.id ? feedback : entry))
        : [feedback, ...milestone.feedbacks];
      milestone.status = 'Complete';
      item.milestones[milestoneIndex] = milestone;
    }
    current[index] = item;
    this.writeLocalOnboardingMilestones(current);
    return feedback;
  }

  private createLocalOnboardingMilestoneFeedback(
    applicationReference: string,
    payload: CreateRecruitmentOnboardingMilestoneFeedbackPayload
  ): RecruitmentOnboardingMilestoneFeedback {
    const created: RecruitmentOnboardingMilestoneFeedback = {
      id: `ONB-FB-${applicationReference}-${payload.day}-${Date.now()}`.toUpperCase(),
      applicationReference,
      day: payload.day,
      authorRole: payload.authorRole,
      author: 'system',
      comment: payload.comment,
      score: payload.score,
      createdAt: new Date().toISOString(),
    };
    return this.appendLocalOnboardingMilestoneFeedback(created);
  }

  private normalizeRecruitmentOnboardingSuccessScoresResponse(
    dto: RecruitmentOnboardingSuccessScoresResponseDto
  ): RecruitmentOnboardingSuccessScoresResponse {
    const thresholdsInput = readField(dto || {}, ['thresholds'], {});
    return {
      generatedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['generatedAt', 'generated_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      thresholds: {
        warning: this.toNonNegativeInt(readField(thresholdsInput || {}, ['warning'], 75), 75),
        critical: this.toNonNegativeInt(readField(thresholdsInput || {}, ['critical'], 60), 60),
      },
      items: Array.isArray(readField(dto || {}, ['items'], []))
        ? (readField(dto || {}, ['items'], []) as unknown[]).map((entry) =>
          this.normalizeRecruitmentOnboardingSuccessScoreEntry(entry as RecruitmentOnboardingSuccessScoreEntryDto)
        )
        : [],
    };
  }

  private normalizeRecruitmentOnboardingSuccessScoreEntry(
    dto: RecruitmentOnboardingSuccessScoreEntryDto
  ): RecruitmentOnboardingSuccessScoreEntry {
    const alertRaw = String(readField(dto || {}, ['alert'], 'OK') || '').trim();
    const alert: RecruitmentOnboardingSuccessScoreEntry['alert'] =
      alertRaw === 'Alerte' || alertRaw === 'Critique' ? alertRaw : 'OK';
    return {
      applicationReference: String(
        readField(dto || {}, ['applicationReference', 'application_reference'], '')
      ).trim().toUpperCase(),
      agent: String(readField(dto || {}, ['agent'], '') || '').trim(),
      position: String(readField(dto || {}, ['position'], '') || '').trim(),
      cohort: String(readField(dto || {}, ['cohort'], '') || '').trim(),
      completionRate: this.toNonNegativeInt(readField(dto || {}, ['completionRate', 'completion_rate'], 0), 0),
      milestoneRate: this.toNonNegativeInt(readField(dto || {}, ['milestoneRate', 'milestone_rate'], 0), 0),
      blockedIncidents: this.toNonNegativeInt(readField(dto || {}, ['blockedIncidents', 'blocked_incidents'], 0), 0),
      score: this.toNonNegativeInt(readField(dto || {}, ['score'], 0), 0),
      alert,
    };
  }

  private buildLocalRecruitmentOnboardingSuccessScoresResponse(): RecruitmentOnboardingSuccessScoresResponse {
    const milestones = this.readLocalOnboardingMilestones();
    const onboardingByReference = new Map(
      this.readLocalOnboarding().map((item) => [String(item.applicationReference || '').trim().toUpperCase(), item])
    );
    const items = milestones.map((entry) => {
      const onboarding = onboardingByReference.get(entry.applicationReference);
      const completionRate = this.toNonNegativeInt(onboarding?.progress?.completionRate, 0);
      const blockedIncidents = this.toNonNegativeInt(onboarding?.progress?.blocked, 0);
      const milestoneCompletion = entry.milestones.filter((item) => item.status === 'Complete').length;
      const milestoneRate = Math.round((milestoneCompletion / 3) * 100);
      const score = Math.max(
        0,
        Math.round((completionRate * 0.5 + milestoneRate * 0.5) - Math.min(30, blockedIncidents * 8))
      );
      const alert: RecruitmentOnboardingSuccessScoreEntry['alert'] =
        score < 60 ? 'Critique' : score < 75 ? 'Alerte' : 'OK';
      return {
        applicationReference: entry.applicationReference,
        agent: entry.agent,
        position: entry.position,
        cohort: String(entry.startDate || '').slice(0, 7),
        completionRate,
        milestoneRate,
        blockedIncidents,
        score,
        alert,
      };
    });
    return {
      generatedAt: new Date().toISOString(),
      thresholds: {
        warning: 75,
        critical: 60,
      },
      items,
    };
  }

  private mapRecruitmentOnboardingSyncLogs(
    items: RecruitmentOnboardingSyncLogEntryDto[]
  ): RecruitmentOnboardingSyncLogEntry[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((item) => this.normalizeRecruitmentOnboardingSyncLog(item))
      .filter((item) => !!item.id);
  }

  private normalizeRecruitmentOnboardingSyncLog(
    dto: RecruitmentOnboardingSyncLogEntryDto,
    fallbackReference = ''
  ): RecruitmentOnboardingSyncLogEntry {
    return {
      id: String(readField(dto || {}, ['id'], `ONB-SYNC-${Date.now()}`) || '').trim().toUpperCase(),
      applicationReference: String(
        readField(dto || {}, ['applicationReference', 'application_reference'], fallbackReference)
      ).trim().toUpperCase(),
      agent: String(readField(dto || {}, ['agent'], '') || '').trim(),
      position: String(readField(dto || {}, ['position'], '') || '').trim(),
      syncedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['syncedAt', 'synced_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      syncedBy: String(readField(dto || {}, ['syncedBy', 'synced_by'], 'system') || '').trim() || 'system',
      dossierReference: String(
        readField(dto || {}, ['dossierReference', 'dossier_reference'], '')
      ).trim().toUpperCase(),
      affectationReference: String(
        readField(dto || {}, ['affectationReference', 'affectation_reference'], '')
      ).trim().toUpperCase(),
      status: String(readField(dto || {}, ['status'], 'SUCCESS') || '').trim() || 'SUCCESS',
      detail: String(readField(dto || {}, ['detail'], '') || '').trim(),
    };
  }

  private readLocalOnboardingSyncLogs(): RecruitmentOnboardingSyncLogEntry[] {
    if (!this.hasLocalStorage()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(this.localOnboardingSyncLogsKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((entry) => this.normalizeRecruitmentOnboardingSyncLog(entry as RecruitmentOnboardingSyncLogEntryDto));
    } catch {
      return [];
    }
  }

  private writeLocalOnboardingSyncLogs(items: RecruitmentOnboardingSyncLogEntry[]): void {
    if (!this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localOnboardingSyncLogsKey, JSON.stringify(items));
  }

  private appendLocalOnboardingSyncLog(
    entry: RecruitmentOnboardingSyncLogEntry
  ): RecruitmentOnboardingSyncLogEntry {
    const current = this.readLocalOnboardingSyncLogs();
    const index = current.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      current[index] = entry;
    } else {
      current.push(entry);
    }
    this.writeLocalOnboardingSyncLogs(current);
    return entry;
  }

  private createLocalOnboardingSyncLog(applicationReference: string): RecruitmentOnboardingSyncLogEntry {
    const onboarding = this.readLocalOnboarding().find((item) => {
      return String(item.applicationReference || '').trim().toUpperCase() === applicationReference;
    });
    const created: RecruitmentOnboardingSyncLogEntry = {
      id: `ONB-SYNC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
      applicationReference,
      agent: onboarding?.agent || '',
      position: onboarding?.position || '',
      syncedAt: new Date().toISOString(),
      syncedBy: 'system',
      dossierReference: `DOS-${new Date().getFullYear()}-${String(this.readLocalOnboardingSyncLogs().length + 1).padStart(3, '0')}`,
      affectationReference: `AFF-${new Date().getFullYear()}-${String(this.readLocalOnboardingSyncLogs().length + 1).padStart(3, '0')}`,
      status: 'SUCCESS',
      detail: 'Creation dossier et affectation automatique',
    };
    return this.appendLocalOnboardingSyncLog(created);
  }

  private applyLocalOnboardingSyncLogsQuery(
    items: RecruitmentOnboardingSyncLogEntry[],
    query?: CollectionQueryOptions
  ): RecruitmentOnboardingSyncLogEntry[] {
    return this.applyLocalCollectionOptions(items, query, {
      searchText: (item) => `${item.id} ${item.applicationReference} ${item.agent} ${item.position} ${item.status} ${item.detail}`,
      sortValue: (item, sortBy) => {
        if (sortBy === 'agent') return item.agent;
        if (sortBy === 'applicationReference') return item.applicationReference;
        return item.syncedAt;
      },
    });
  }

  private mapRecruitmentRuleEngineRules(items: RecruitmentRuleEngineRuleDto[]): RecruitmentRuleEngineRule[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((item) => this.normalizeRecruitmentRuleEngineRule(item))
      .filter((item) => !!item.id);
  }

  private normalizeRecruitmentRuleEngineRule(dto: RecruitmentRuleEngineRuleDto): RecruitmentRuleEngineRule {
    return {
      id: String(readField(dto || {}, ['id'], '') || '').trim().toUpperCase(),
      name: String(readField(dto || {}, ['name'], '') || '').trim(),
      event: String(readField(dto || {}, ['event'], '') || '').trim(),
      condition: String(readField(dto || {}, ['condition'], '') || '').trim(),
      action: String(readField(dto || {}, ['action'], '') || '').trim(),
      enabled: !!readField(dto || {}, ['enabled'], true),
      createdAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['createdAt', 'created_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      updatedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['updatedAt', 'updated_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      createdBy: String(readField(dto || {}, ['createdBy', 'created_by'], 'system') || '').trim() || 'system',
    };
  }

  private normalizeCreateRecruitmentRuleEngineRulePayload(
    payload: CreateRecruitmentRuleEngineRulePayload
  ): CreateRecruitmentRuleEngineRulePayload {
    return {
      name: String(payload.name || '').trim(),
      event: String(payload.event || '').trim(),
      condition: String(payload.condition || '').trim(),
      action: String(payload.action || '').trim(),
      enabled: payload.enabled !== false,
    };
  }

  private readLocalRuleEngineRules(): RecruitmentRuleEngineRule[] {
    if (!this.hasLocalStorage()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(this.localRuleEngineRulesKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item) => this.normalizeRecruitmentRuleEngineRule(item as RecruitmentRuleEngineRuleDto));
    } catch {
      return [];
    }
  }

  private writeLocalRuleEngineRules(items: RecruitmentRuleEngineRule[]): void {
    if (!this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localRuleEngineRulesKey, JSON.stringify(items));
  }

  private upsertLocalRuleEngineRule(rule: RecruitmentRuleEngineRule): RecruitmentRuleEngineRule {
    const current = this.readLocalRuleEngineRules();
    const index = current.findIndex((item) => item.id === rule.id);
    if (index >= 0) {
      current[index] = rule;
    } else {
      current.push(rule);
    }
    this.writeLocalRuleEngineRules(current);
    return rule;
  }

  private createLocalRuleEngineRule(
    payload: CreateRecruitmentRuleEngineRulePayload
  ): RecruitmentRuleEngineRule {
    const current = this.readLocalRuleEngineRules();
    const created: RecruitmentRuleEngineRule = {
      id: `REC-RULE-${String(current.length + 1).padStart(3, '0')}`,
      name: payload.name,
      event: payload.event,
      condition: payload.condition,
      action: payload.action,
      enabled: payload.enabled !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
    };
    return this.upsertLocalRuleEngineRule(created);
  }

  private applyLocalRuleEngineRulesQuery(
    items: RecruitmentRuleEngineRule[],
    query?: CollectionQueryOptions
  ): RecruitmentRuleEngineRule[] {
    return this.applyLocalCollectionOptions(items, query, {
      searchText: (item) => `${item.id} ${item.name} ${item.event} ${item.condition} ${item.action}`,
      sortValue: (item, sortBy) => {
        if (sortBy === 'name') return item.name;
        if (sortBy === 'event') return item.event;
        return item.updatedAt;
      },
    });
  }

  private normalizeSimulateRecruitmentRuleEnginePayload(
    payload: SimulateRecruitmentRuleEnginePayload
  ): SimulateRecruitmentRuleEnginePayload {
    return {
      event: String(payload.event || '').trim(),
      context: payload.context && typeof payload.context === 'object' ? payload.context : {},
    };
  }

  private normalizeRecruitmentRuleEngineSimulationResult(
    dto: RecruitmentRuleEngineSimulationResultDto
  ): RecruitmentRuleEngineSimulationResult {
    const matchesInput = readField(dto || {}, ['matches'], []);
    return {
      event: String(readField(dto || {}, ['event'], '') || '').trim(),
      simulatedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['simulatedAt', 'simulated_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      matches: Array.isArray(matchesInput)
        ? matchesInput.map((entry) => this.normalizeRecruitmentRuleSimulationMatch(entry as RecruitmentRuleSimulationMatchDto))
        : [],
    };
  }

  private normalizeRecruitmentRuleSimulationMatch(
    dto: RecruitmentRuleSimulationMatchDto
  ): RecruitmentRuleSimulationMatch {
    return {
      ruleId: String(readField(dto || {}, ['ruleId', 'rule_id'], '') || '').trim().toUpperCase(),
      ruleName: String(readField(dto || {}, ['ruleName', 'rule_name'], '') || '').trim(),
      action: String(readField(dto || {}, ['action'], '') || '').trim(),
      wouldExecute: !!readField(dto || {}, ['wouldExecute', 'would_execute'], true),
      reason: String(readField(dto || {}, ['reason'], '') || '').trim(),
      context: (readField(dto || {}, ['context'], {}) as Record<string, unknown>) || {},
    };
  }

  private mapRecruitmentRuleExecutions(items: RecruitmentRuleExecutionEntryDto[]): RecruitmentRuleExecutionEntry[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((item) => this.normalizeRecruitmentRuleExecution(item))
      .filter((item) => !!item.id);
  }

  private normalizeRecruitmentRuleExecution(dto: RecruitmentRuleExecutionEntryDto): RecruitmentRuleExecutionEntry {
    return {
      id: String(readField(dto || {}, ['id'], '') || '').trim().toUpperCase(),
      ruleId: String(readField(dto || {}, ['ruleId', 'rule_id'], '') || '').trim().toUpperCase(),
      ruleName: String(readField(dto || {}, ['ruleName', 'rule_name'], '') || '').trim(),
      event: String(readField(dto || {}, ['event'], '') || '').trim(),
      executedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['executedAt', 'executed_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      outcome: String(readField(dto || {}, ['outcome'], 'SUCCESS') || '').trim() || 'SUCCESS',
      detail: String(readField(dto || {}, ['detail'], '') || '').trim(),
    };
  }

  private readLocalRuleExecutions(): RecruitmentRuleExecutionEntry[] {
    if (!this.hasLocalStorage()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(this.localRuleExecutionsKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item) => this.normalizeRecruitmentRuleExecution(item as RecruitmentRuleExecutionEntryDto));
    } catch {
      return [];
    }
  }

  private writeLocalRuleExecutions(items: RecruitmentRuleExecutionEntry[]): void {
    if (!this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localRuleExecutionsKey, JSON.stringify(items));
  }

  private appendLocalRuleExecution(entry: RecruitmentRuleExecutionEntry): RecruitmentRuleExecutionEntry {
    const current = this.readLocalRuleExecutions();
    const normalized = {
      ...entry,
      id: String(entry.id || `REC-RUN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).trim().toUpperCase(),
      executedAt: this.normalizeHistoryChangedAt(entry.executedAt, new Date().toISOString()),
    };
    current.push(normalized);
    this.writeLocalRuleExecutions(current);
    return normalized;
  }

  private applyLocalRuleExecutionsQuery(
    items: RecruitmentRuleExecutionEntry[],
    query?: CollectionQueryOptions
  ): RecruitmentRuleExecutionEntry[] {
    return this.applyLocalCollectionOptions(items, query, {
      searchText: (item) => `${item.id} ${item.ruleId} ${item.ruleName} ${item.event} ${item.outcome} ${item.detail}`,
      sortValue: (item, sortBy) => {
        if (sortBy === 'event') return item.event;
        if (sortBy === 'outcome') return item.outcome;
        return item.executedAt;
      },
    });
  }

  private simulateLocalRuleEngine(
    payload: SimulateRecruitmentRuleEnginePayload
  ): RecruitmentRuleEngineSimulationResult {
    const normalizedEvent = this.normalizeComparableText(payload.event);
    const rules = this.readLocalRuleEngineRules();
    const matches = rules
      .filter((rule) => rule.enabled && this.normalizeComparableText(rule.event) === normalizedEvent)
      .map((rule) => ({
        ruleId: rule.id,
        ruleName: rule.name,
        action: rule.action,
        wouldExecute: true,
        reason: `Condition [${rule.condition}] evaluee sur contexte fourni`,
        context: payload.context || {},
      }));
    const result: RecruitmentRuleEngineSimulationResult = {
      event: payload.event,
      simulatedAt: new Date().toISOString(),
      matches,
    };
    matches.forEach((match) => {
      this.appendLocalRuleExecution({
        id: '',
        ruleId: match.ruleId,
        ruleName: match.ruleName,
        event: payload.event,
        executedAt: result.simulatedAt,
        outcome: 'SIMULATED',
        detail: match.reason,
      });
    });
    return result;
  }

  private normalizeComparableText(value: unknown): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private normalizeRecruitmentControlTowerResponse(
    dto: RecruitmentControlTowerResponseDto
  ): RecruitmentControlTowerResponse {
    const summaryDto = readField(dto || {}, ['summary'], {});
    const itemsRaw = readField(dto || {}, ['items'], []);
    return {
      summary: {
        totalApplications: this.toNonNegativeInt(readField(summaryDto || {}, ['totalApplications', 'total_applications'], 0), 0),
        interviewsPlanned: this.toNonNegativeInt(readField(summaryDto || {}, ['interviewsPlanned', 'interviews_planned'], 0), 0),
        onboardingActive: this.toNonNegativeInt(readField(summaryDto || {}, ['onboardingActive', 'onboarding_active'], 0), 0),
        retained: this.toNonNegativeInt(readField(summaryDto || {}, ['retained'], 0), 0),
      },
      items: Array.isArray(itemsRaw)
        ? itemsRaw.map((entry) => this.normalizeRecruitmentControlTowerItem(entry as RecruitmentControlTowerItemDto))
        : [],
    };
  }

  private normalizeRecruitmentControlTowerItem(dto: RecruitmentControlTowerItemDto): RecruitmentControlTowerItem {
    const status = this.normalizeApplicationStatus(readField(dto || {}, ['status'], 'Nouveau'), 'Nouveau');
    return {
      reference: String(readField(dto || {}, ['reference'], '') || '').trim().toUpperCase(),
      candidate: String(readField(dto || {}, ['candidate'], '') || '').trim(),
      campaign: String(readField(dto || {}, ['campaign'], '') || '').trim(),
      position: String(readField(dto || {}, ['position'], '') || '').trim(),
      status,
      receivedOn: String(readField(dto || {}, ['receivedOn', 'received_on'], '') || '').trim(),
      interviewStatus: String(readField(dto || {}, ['interviewStatus', 'interview_status'], 'Non planifie') || '').trim(),
      interviewSlot: String(readField(dto || {}, ['interviewSlot', 'interview_slot'], '') || '').trim(),
      onboardingStatus: String(readField(dto || {}, ['onboardingStatus', 'onboarding_status'], 'Non lance') || '').trim(),
      onboardingProgress: this.toNonNegativeInt(readField(dto || {}, ['onboardingProgress', 'onboarding_progress'], 0), 0),
    };
  }

  private buildLocalRecruitmentControlTowerResponse(
    query?: RecruitmentControlTowerQuery
  ): RecruitmentControlTowerResponse {
    const applications = this.readLocalApplications();
    const interviews = this.readLocalInterviews();
    const onboarding = this.readLocalOnboarding();
    const onboardingByReference = new Map(
      onboarding.map((item) => [String(item.applicationReference || '').trim().toUpperCase(), item])
    );
    const interviewsByReference = new Map<string, RecruitmentInterviewSchedule[]>();
    interviews.forEach((item) => {
      const key = String(item.applicationReference || '').trim().toUpperCase();
      if (!key) return;
      if (!interviewsByReference.has(key)) {
        interviewsByReference.set(key, []);
      }
      interviewsByReference.get(key)?.push(item);
    });

    const campaignFilter = this.normalizeComparableText(query?.campaign || '');
    const statusFilter = this.normalizeComparableText(query?.status || '');
    let filtered = applications.map((application) => {
      const reference = String(application.reference || '').trim().toUpperCase();
      const onboardingItem = onboardingByReference.get(reference);
      const latestInterview = (interviewsByReference.get(reference) || [])
        .slice()
        .sort((left, right) => Date.parse(right.slotStart) - Date.parse(left.slotStart))[0];
      return {
        reference,
        candidate: application.candidate,
        campaign: application.campaign,
        position: application.position,
        status: application.status,
        receivedOn: application.receivedOn,
        interviewStatus: latestInterview?.status || 'Non planifie',
        interviewSlot: latestInterview?.slotStart || '',
        onboardingStatus: onboardingItem?.status || 'Non lance',
        onboardingProgress: this.toNonNegativeInt(onboardingItem?.progress?.completionRate, 0),
      } as RecruitmentControlTowerItem;
    });

    if (campaignFilter) {
      filtered = filtered.filter((item) => this.normalizeComparableText(item.campaign).includes(campaignFilter));
    }
    if (statusFilter) {
      filtered = filtered.filter((item) => this.normalizeComparableText(item.status).includes(statusFilter));
    }

    const summary: RecruitmentControlTowerSummary = {
      totalApplications: filtered.length,
      interviewsPlanned: filtered.filter((item) => item.interviewStatus === 'Planifie' || item.interviewStatus === 'Replanifie').length,
      onboardingActive: filtered.filter((item) => item.onboardingStatus === 'En cours' || item.onboardingStatus === 'Planifie').length,
      retained: filtered.filter((item) => item.status === 'Retenu').length,
    };

    const items = this.applyLocalCollectionOptions(filtered, query, {
      searchText: (item) => `${item.reference} ${item.candidate} ${item.campaign} ${item.position} ${item.status} ${item.interviewStatus} ${item.onboardingStatus}`,
      sortValue: (item, sortBy) => {
        if (sortBy === 'candidate') return item.candidate;
        if (sortBy === 'campaign') return item.campaign;
        if (sortBy === 'status') return item.status;
        return item.receivedOn;
      },
    });

    return { summary, items };
  }

  private normalizeRecruitmentExecutiveDashboardResponse(
    dto: RecruitmentExecutiveDashboardResponseDto
  ): RecruitmentExecutiveDashboardResponse {
    const kpisInput = readField(dto || {}, ['kpis'], {});
    const campaignsInput =
      readField(dto || {}, ['byCampaign', 'by_campaign'], []) as RecruitmentExecutiveDashboardCampaignEntryDto[];
    return {
      generatedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['generatedAt', 'generated_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      kpis: {
        totalApplications: this.toNonNegativeInt(
          readField(kpisInput || {}, ['totalApplications', 'total_applications'], 0),
          0
        ),
        retained: this.toNonNegativeInt(readField(kpisInput || {}, ['retained'], 0), 0),
        conversionInterviewToRetained: this.toNonNegativeInt(
          readField(kpisInput || {}, ['conversionInterviewToRetained', 'conversion_interview_to_retained'], 0),
          0
        ),
        averageTimeToHireDays: this.toNonNegativeInt(
          readField(kpisInput || {}, ['averageTimeToHireDays', 'average_time_to_hire_days'], 0),
          0
        ),
      },
      byCampaign: Array.isArray(campaignsInput)
        ? campaignsInput.map((entry) => this.normalizeRecruitmentExecutiveDashboardCampaignEntry(entry))
        : [],
    };
  }

  private normalizeRecruitmentExecutiveDashboardCampaignEntry(
    dto: RecruitmentExecutiveDashboardCampaignEntryDto
  ): RecruitmentExecutiveDashboardCampaignEntry {
    return {
      campaignCode: String(readField(dto || {}, ['campaignCode', 'campaign_code'], '') || '').trim().toUpperCase(),
      campaignTitle: String(readField(dto || {}, ['campaignTitle', 'campaign_title'], '') || '').trim(),
      total: this.toNonNegativeInt(readField(dto || {}, ['total'], 0), 0),
      retained: this.toNonNegativeInt(readField(dto || {}, ['retained'], 0), 0),
      rejected: this.toNonNegativeInt(readField(dto || {}, ['rejected'], 0), 0),
      conversion: this.toNonNegativeInt(readField(dto || {}, ['conversion'], 0), 0),
    };
  }

  private buildLocalRecruitmentExecutiveDashboardResponse(): RecruitmentExecutiveDashboardResponse {
    const applications = this.readLocalApplications();
    const campaigns = this.readLocalCampaigns();
    const totalApplications = applications.length;
    const retained = applications.filter((item) => item.status === 'Retenu').length;
    const interviewStage = applications.filter((item) => item.status === 'Entretien').length;
    const conversionInterviewToRetained = this.computePercent(retained, interviewStage);
    const averageTimeToHireDays = this.computeLocalAverageTimeToHireDays(applications);
    const campaignCodes = Array.from(new Set([
      ...campaigns.map((item) => item.code),
      ...applications.map((item) => item.campaign),
    ]));
    const byCampaign = campaignCodes.map((campaignCode) => {
      const scoped = applications.filter((item) => item.campaign === campaignCode);
      const retainedCount = scoped.filter((item) => item.status === 'Retenu').length;
      const rejectedCount = scoped.filter((item) => item.status === 'Rejete').length;
      const campaign = campaigns.find((item) => item.code === campaignCode);
      return {
        campaignCode,
        campaignTitle: campaign?.title || campaignCode,
        total: scoped.length,
        retained: retainedCount,
        rejected: rejectedCount,
        conversion: Math.round(this.computePercent(retainedCount, scoped.length) * 10) / 10,
      };
    });
    return {
      generatedAt: new Date().toISOString(),
      kpis: {
        totalApplications,
        retained,
        conversionInterviewToRetained: Math.round(conversionInterviewToRetained * 10) / 10,
        averageTimeToHireDays: Math.round(averageTimeToHireDays * 10) / 10,
      },
      byCampaign,
    };
  }

  private computeLocalAverageTimeToHireDays(applications: Application[]): number {
    if (!applications.length) {
      return 0;
    }
    const durations = applications.map((application) => {
      const history = Array.isArray(application.statusHistory) ? application.statusHistory : [];
      const receivedTs = Date.parse(application.receivedOn);
      const finalEntry = history
        .slice()
        .reverse()
        .find((entry) => entry.toStatus === 'Retenu' || entry.toStatus === 'Rejete');
      const finalTs = finalEntry ? Date.parse(finalEntry.changedAt) : Date.now();
      if (Number.isNaN(receivedTs) || Number.isNaN(finalTs)) {
        return 0;
      }
      return Math.max(0, (finalTs - receivedTs) / 86400000);
    });
    return durations.reduce((sum, value) => sum + value, 0) / durations.length;
  }

  private normalizeRecruitmentExecutiveDashboardExportResult(
    dto: RecruitmentExecutiveDashboardExportResultDto
  ): RecruitmentExecutiveDashboardExportResult {
    const formatRaw = String(readField(dto || {}, ['format'], 'csv') || '').trim().toLowerCase();
    return {
      format: formatRaw === 'pdf' ? 'pdf' : 'csv',
      content: String(readField(dto || {}, ['content'], '') || ''),
    };
  }

  private exportLocalExecutiveDashboard(format: 'csv' | 'pdf'): RecruitmentExecutiveDashboardExportResult {
    const dashboard = this.buildLocalRecruitmentExecutiveDashboardResponse();
    if (format === 'pdf') {
      return {
        format: 'pdf',
        content: `EXECUTIVE DASHBOARD RECRUTEMENT\nGeneratedAt=${dashboard.generatedAt}\nTotal=${dashboard.kpis.totalApplications}\nRetained=${dashboard.kpis.retained}\nConversion=${dashboard.kpis.conversionInterviewToRetained}%`,
      };
    }
    const rows = ['campaignCode;campaignTitle;total;retained;rejected;conversion'];
    dashboard.byCampaign.forEach((entry) => {
      rows.push(`${entry.campaignCode};${entry.campaignTitle};${entry.total};${entry.retained};${entry.rejected};${entry.conversion}`);
    });
    return {
      format: 'csv',
      content: rows.join('\n'),
    };
  }

  private normalizeRecruitmentBiExportResponse(
    dto: RecruitmentBiExportResponseDto | RecruitmentBiExportCsvResponseDto,
    format: 'json' | 'csv'
  ): RecruitmentBiExportResponse | RecruitmentBiExportCsvResponse {
    if (format === 'csv') {
      return {
        format: 'csv',
        exportedAt: this.normalizeHistoryChangedAt(
          String(readField(dto || {}, ['exportedAt', 'exported_at'], '') || '').trim(),
          new Date().toISOString()
        ),
        schemaVersion: String(readField(dto || {}, ['schemaVersion', 'schema_version'], 'rec-bi-v1') || '').trim() || 'rec-bi-v1',
        content: String(readField(dto || {}, ['content'], '') || ''),
      };
    }
    const datasetsRaw = readField(dto || {}, ['datasets'], {}) as Record<string, unknown>;
    const datasets: Record<string, unknown[]> = {};
    Object.entries(datasetsRaw || {}).forEach(([key, value]) => {
      datasets[key] = Array.isArray(value) ? value : [];
    });
    return {
      exportedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['exportedAt', 'exported_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      schemaVersion: String(readField(dto || {}, ['schemaVersion', 'schema_version'], 'rec-bi-v1') || '').trim() || 'rec-bi-v1',
      datasets,
    };
  }

  private mapRecruitmentBiExportLogs(items: RecruitmentBiExportLogEntryDto[]): RecruitmentBiExportLogEntry[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map((item) => this.normalizeRecruitmentBiExportLog(item))
      .filter((item) => !!item.id);
  }

  private normalizeRecruitmentBiExportLog(dto: RecruitmentBiExportLogEntryDto): RecruitmentBiExportLogEntry {
    const formatRaw = String(readField(dto || {}, ['format'], 'json') || '').trim().toLowerCase();
    return {
      id: String(readField(dto || {}, ['id'], `REC-BI-LOG-${Date.now()}`) || '').trim().toUpperCase(),
      createdAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['createdAt', 'created_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      requestedBy: String(readField(dto || {}, ['requestedBy', 'requested_by'], 'system') || '').trim() || 'system',
      format: formatRaw === 'csv' ? 'csv' : 'json',
      records: this.toNonNegativeInt(readField(dto || {}, ['records'], 0), 0),
      status: String(readField(dto || {}, ['status'], 'SUCCESS') || '').trim() || 'SUCCESS',
    };
  }

  private readLocalBiExportLogs(): RecruitmentBiExportLogEntry[] {
    if (!this.hasLocalStorage()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(this.localBiExportLogsKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item) => this.normalizeRecruitmentBiExportLog(item as RecruitmentBiExportLogEntryDto));
    } catch {
      return [];
    }
  }

  private writeLocalBiExportLogs(items: RecruitmentBiExportLogEntry[]): void {
    if (!this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localBiExportLogsKey, JSON.stringify(items));
  }

  private appendLocalBiExportLog(entry: RecruitmentBiExportLogEntry): RecruitmentBiExportLogEntry {
    const current = this.readLocalBiExportLogs();
    const normalized = this.normalizeRecruitmentBiExportLog(entry);
    current.push(normalized);
    this.writeLocalBiExportLogs(current);
    return normalized;
  }

  private applyLocalBiExportLogsQuery(
    items: RecruitmentBiExportLogEntry[],
    query?: CollectionQueryOptions
  ): RecruitmentBiExportLogEntry[] {
    return this.applyLocalCollectionOptions(items, query, {
      searchText: (item) => `${item.id} ${item.requestedBy} ${item.format} ${item.status}`,
      sortValue: (item, sortBy) => {
        if (sortBy === 'format') return item.format;
        if (sortBy === 'requestedBy') return item.requestedBy;
        return item.createdAt;
      },
    });
  }

  private exportLocalBiData(format: 'json' | 'csv'): RecruitmentBiExportResponse | RecruitmentBiExportCsvResponse {
    const payload: RecruitmentBiExportResponse = {
      exportedAt: new Date().toISOString(),
      schemaVersion: 'rec-bi-v1',
      datasets: {
        applications: this.readLocalApplications(),
        campaigns: this.readLocalCampaigns(),
        onboarding: this.readLocalOnboarding(),
        interviews: this.readLocalInterviews(),
        budgets: this.readLocalCampaignBudgets(),
      },
    };
    const records = Object.values(payload.datasets).reduce((sum, dataset) => sum + dataset.length, 0);
    this.appendLocalBiExportLog({
      id: '',
      createdAt: new Date().toISOString(),
      requestedBy: 'frontend',
      format,
      records,
      status: 'SUCCESS',
    });
    if (format === 'csv') {
      const rows = ['dataset;records'];
      Object.entries(payload.datasets).forEach(([key, dataset]) => {
        rows.push(`${key};${dataset.length}`);
      });
      return {
        format: 'csv',
        exportedAt: payload.exportedAt,
        schemaVersion: payload.schemaVersion,
        content: rows.join('\n'),
      };
    }
    return payload;
  }

  private normalizeRecruitmentObservabilitySnapshot(
    dto: RecruitmentObservabilitySnapshotDto
  ): RecruitmentObservabilitySnapshot {
    const thresholdsInput = readField(dto || {}, ['thresholds'], {});
    const metricsInput = readField(dto || {}, ['metrics'], {});
    const recentEventsInput = readField(dto || {}, ['recentEvents', 'recent_events'], []);
    return {
      generatedAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['generatedAt', 'generated_at'], '') || '').trim(),
        new Date().toISOString()
      ),
      thresholds: {
        apiP95Ms: this.toNonNegativeInt(readField(thresholdsInput || {}, ['apiP95Ms', 'api_p95_ms'], 1200), 1200),
        errorRatePercent: this.toNonNegativeInt(readField(thresholdsInput || {}, ['errorRatePercent', 'error_rate_percent'], 3), 3),
        staleDataMinutes: this.toNonNegativeInt(readField(thresholdsInput || {}, ['staleDataMinutes', 'stale_data_minutes'], 45), 45),
      },
      metrics: {
        apiP95Ms: this.toNonNegativeInt(readField(metricsInput || {}, ['apiP95Ms', 'api_p95_ms'], 0), 0),
        errorRatePercent: this.toNonNegativeInt(readField(metricsInput || {}, ['errorRatePercent', 'error_rate_percent'], 0), 0),
        staleDataMinutes: this.toNonNegativeInt(readField(metricsInput || {}, ['staleDataMinutes', 'stale_data_minutes'], 0), 0),
        e2eCriticalPassRate: this.toNonNegativeInt(
          readField(metricsInput || {}, ['e2eCriticalPassRate', 'e2e_critical_pass_rate'], 0),
          0
        ),
      },
      alerts: Array.isArray(readField(dto || {}, ['alerts'], []))
        ? (readField(dto || {}, ['alerts'], []) as unknown[]).map((entry) => String(entry || '').trim()).filter((entry) => !!entry)
        : [],
      recentEvents: Array.isArray(recentEventsInput)
        ? recentEventsInput.map((entry) => this.normalizeRecruitmentObservabilityEvent(entry as RecruitmentObservabilityEventDto))
        : [],
    };
  }

  private readLocalObservabilityEvents(): RecruitmentObservabilityEvent[] {
    if (!this.hasLocalStorage()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(this.localObservabilityEventsKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((entry) => this.normalizeRecruitmentObservabilityEvent(entry as RecruitmentObservabilityEventDto));
    } catch {
      return [];
    }
  }

  private writeLocalObservabilityEvents(items: RecruitmentObservabilityEvent[]): void {
    if (!this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localObservabilityEventsKey, JSON.stringify(items));
  }

  private appendLocalObservabilityEvent(event: RecruitmentObservabilityEvent): RecruitmentObservabilityEvent {
    const current = this.readLocalObservabilityEvents();
    const normalized = this.normalizeRecruitmentObservabilityEvent(event);
    current.push(normalized);
    this.writeLocalObservabilityEvents(current);
    return normalized;
  }

  private normalizeRecruitmentObservabilityEvent(
    dto: RecruitmentObservabilityEventDto | RecruitmentObservabilityEvent
  ): RecruitmentObservabilityEvent {
    const severityRaw = String(readField(dto || {}, ['severity'], 'info') || '').trim().toLowerCase();
    const severity: RecruitmentObservabilityEvent['severity'] =
      severityRaw === 'critical' ? 'critical' : severityRaw === 'warning' ? 'warning' : 'info';
    return {
      id: String(readField(dto || {}, ['id'], `REC-OBS-EVT-${Date.now()}`) || '').trim().toUpperCase(),
      source: String(readField(dto || {}, ['source'], 'frontend') || '').trim() || 'frontend',
      message: String(readField(dto || {}, ['message'], 'event') || '').trim() || 'event',
      severity,
      createdAt: this.normalizeHistoryChangedAt(
        String(readField(dto || {}, ['createdAt', 'created_at'], '') || '').trim(),
        new Date().toISOString()
      ),
    };
  }

  private normalizeCreateRecruitmentObservabilityEventPayload(
    payload: CreateRecruitmentObservabilityEventPayload
  ): CreateRecruitmentObservabilityEventPayload {
    return {
      source: String(payload.source || '').trim() || 'frontend',
      message: String(payload.message || '').trim() || 'event',
      severity: payload.severity === 'critical' || payload.severity === 'warning' ? payload.severity : 'info',
    };
  }

  private createLocalObservabilityEvent(
    payload: CreateRecruitmentObservabilityEventPayload
  ): RecruitmentObservabilityEvent {
    const created: RecruitmentObservabilityEvent = {
      id: `REC-OBS-EVT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
      source: payload.source,
      message: payload.message,
      severity: payload.severity || 'info',
      createdAt: new Date().toISOString(),
    };
    return this.appendLocalObservabilityEvent(created);
  }

  private buildLocalRecruitmentObservabilitySnapshot(): RecruitmentObservabilitySnapshot {
    const events = this.readLocalObservabilityEvents()
      .slice()
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
    const thresholds = {
      apiP95Ms: 1200,
      errorRatePercent: 3,
      staleDataMinutes: 45,
    };
    const apiP95Ms = 540 + (events.length % 150);
    const errorRatePercent = events.length === 0 ? 0 : Math.min(5, Math.round((events.length / 250) * 1000) / 10);
    const lastEvent = events[0];
    const staleDataMinutes = lastEvent
      ? Math.max(0, Math.floor((Date.now() - Date.parse(lastEvent.createdAt)) / 60000))
      : 0;
    const alerts: string[] = [];
    if (apiP95Ms > thresholds.apiP95Ms) alerts.push('API_P95_THRESHOLD_BREACH');
    if (errorRatePercent > thresholds.errorRatePercent) alerts.push('ERROR_RATE_THRESHOLD_BREACH');
    if (staleDataMinutes > thresholds.staleDataMinutes) alerts.push('STALE_DATA_WARNING');
    return {
      generatedAt: new Date().toISOString(),
      thresholds,
      metrics: {
        apiP95Ms,
        errorRatePercent,
        staleDataMinutes,
        e2eCriticalPassRate: 98.5,
      },
      alerts,
      recentEvents: events.slice(0, 30),
    };
  }

  private computePercent(numerator: number, denominator: number): number {
    if (!denominator || denominator <= 0) {
      return 0;
    }
    return (numerator / denominator) * 100;
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

  private normalizeIdPart(value: unknown): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  private normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private parseDateOnly(value: unknown): Date | null {
    const normalized = String(value || '').trim();
    if (!normalized) {
      return null;
    }
    const parsed = Date.parse(normalized);
    if (Number.isNaN(parsed)) {
      return null;
    }
    return new Date(parsed);
  }

  private addDaysIso(baseDate: string, days: number): string | undefined {
    const normalized = String(baseDate || '').trim();
    if (!normalized) {
      return undefined;
    }
    const parsed = Date.parse(`${normalized}T00:00:00.000Z`);
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    const safeDays = Number.isFinite(days) ? Math.floor(days) : 0;
    const target = new Date(parsed + safeDays * 86400000);
    return target.toISOString().slice(0, 10);
  }

  private toNonNegativeInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded >= 0 ? rounded : fallback;
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
