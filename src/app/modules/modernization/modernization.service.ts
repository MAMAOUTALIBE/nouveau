import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';

export type ModernizationCapabilityStatus =
  | 'Operationnel'
  | 'En cours'
  | 'A parametrer'
  | 'Surveillance';

export type ModernizationTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

export interface ModernizationKpi {
  label: string;
  value: string | number;
  unit?: string;
  tone: ModernizationTone;
}

export interface ModernizationCapability {
  label: string;
  status: ModernizationCapabilityStatus;
  detail: string;
  route?: string;
}

export interface ModernizationModule {
  code: string;
  title: string;
  description: string;
  route: string;
  implementationRate: number;
  kpis: ModernizationKpi[];
  capabilities: ModernizationCapability[];
  alerts: string[];
}

export interface ModernizationSignal {
  title: string;
  module: string;
  score: number;
  severity: 'Faible' | 'Modere' | 'Eleve' | 'Critique';
  recommendation: string;
  route: string;
}

export interface ModernizationRoadmapItem {
  label: string;
  owner: string;
  dueDate: string;
  status: ModernizationCapabilityStatus;
  progress: number;
}

export interface ModernizationSummary {
  generatedAt: string;
  coverage: {
    totalProposals: number;
    operationalProposals: number;
    implementationRate: number;
    criticalAlerts: number;
  };
  modules: ModernizationModule[];
  aiSignals: ModernizationSignal[];
  roadmap: ModernizationRoadmapItem[];
}

@Injectable({ providedIn: 'root' })
export class ModernizationService {
  private readonly apiClient = inject(ApiClientService);

  getSummary(): Observable<ModernizationSummary> {
    return this.apiClient.get<ModernizationSummary>(API_ENDPOINTS.modernization.summary).pipe(
      map((summary) => normalizeModernizationSummary(summary)),
      catchError(() => of(buildFallbackSummary()))
    );
  }
}

function normalizeModernizationSummary(summary: ModernizationSummary): ModernizationSummary {
  const modules = Array.isArray(summary?.modules) ? summary.modules : [];
  const signals = Array.isArray(summary?.aiSignals) ? summary.aiSignals : [];
  const roadmap = Array.isArray(summary?.roadmap) ? summary.roadmap : [];
  const totalProposals = toBoundedNumber(summary?.coverage?.totalProposals, 0, 1000, modules.length);
  const operationalProposals = toBoundedNumber(
    summary?.coverage?.operationalProposals,
    0,
    totalProposals || 1000,
    modules.reduce((count, module) => count + module.capabilities.filter((item) => item.status === 'Operationnel').length, 0)
  );

  return {
    generatedAt: summary?.generatedAt || new Date().toISOString(),
    coverage: {
      totalProposals,
      operationalProposals,
      implementationRate: toBoundedNumber(
        summary?.coverage?.implementationRate,
        0,
        100,
        totalProposals ? Math.round((operationalProposals / totalProposals) * 100) : 0
      ),
      criticalAlerts: toBoundedNumber(summary?.coverage?.criticalAlerts, 0, 1000, 0),
    },
    modules: modules.map((module) => ({
      ...module,
      implementationRate: toBoundedNumber(module.implementationRate, 0, 100, 0),
      kpis: Array.isArray(module.kpis) ? module.kpis : [],
      capabilities: Array.isArray(module.capabilities) ? module.capabilities : [],
      alerts: Array.isArray(module.alerts) ? module.alerts : [],
    })),
    aiSignals: signals,
    roadmap,
  };
}

function toBoundedNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function buildFallbackSummary(): ModernizationSummary {
  return {
    generatedAt: new Date().toISOString(),
    coverage: {
      totalProposals: 23,
      operationalProposals: 16,
      implementationRate: 70,
      criticalAlerts: 0,
    },
    modules: [
      {
        code: 'personnel-360',
        title: 'Gestion du personnel et dossiers administratifs',
        description: 'Dossier agent 360, ayants droit, portabilite PDF, badges numeriques et OCR documentaire.',
        route: '/personnel/agents',
        implementationRate: 78,
        kpis: [
          { label: 'Dossiers agents', value: 0, tone: 'primary' },
          { label: 'Capacites 360', value: 5, tone: 'success' },
        ],
        capabilities: [
          {
            label: 'Dossier individuel 360',
            status: 'Operationnel',
            detail: 'Fiche agent, competences, documents, parcours et ayants droit.',
            route: '/personnel/agents',
          },
          {
            label: 'PDF signe et badge QR',
            status: 'Operationnel',
            detail: 'Export dossier agent et badge numerique exposes par API.',
            route: '/personnel/agents',
          },
        ],
        alerts: [],
      },
      {
        code: 'recrutement-onboarding',
        title: 'Recrutement et onboarding',
        description: 'Portail candidat, commissions, matching encadre, traçabilite et integration 30/60/90.',
        route: '/recrutement/candidatures',
        implementationRate: 82,
        kpis: [
          { label: 'Parcours actifs', value: 0, tone: 'primary' },
          { label: 'Capacites IA', value: 4, tone: 'info' },
        ],
        capabilities: [
          {
            label: 'Matching CV encadre',
            status: 'Operationnel',
            detail: 'Scores de pertinence et validation RH obligatoire.',
            route: '/recrutement/candidatures',
          },
          {
            label: 'Onboarding digital',
            status: 'Operationnel',
            detail: 'Checklist d arrivee, synchronisation dossier agent et jalons 30/60/90.',
            route: '/recrutement/integration',
          },
        ],
        alerts: [],
      },
      {
        code: 'conges-temps',
        title: 'Gestion des conges et temps',
        description: 'Soldes dynamiques, calendrier equipe, anomalies et auto-approbation encadree.',
        route: '/absences/demandes',
        implementationRate: 66,
        kpis: [
          { label: 'Demandes ouvertes', value: 0, tone: 'warning' },
          { label: 'Suggestions planning', value: 3, tone: 'info' },
        ],
        capabilities: [
          {
            label: 'Calculateur de solde dynamique',
            status: 'Operationnel',
            detail: 'Reliquats, consommations et soldes restants consolides.',
            route: '/absences/soldes',
          },
          {
            label: 'Optimisation planning',
            status: 'En cours',
            detail: 'Suggestions de periode selon continuity service.',
            route: '/absences/calendrier',
          },
        ],
        alerts: [],
      },
    ],
    aiSignals: [
      {
        title: 'Aucun signal critique en mode degrade',
        module: 'Plateforme',
        score: 0,
        severity: 'Faible',
        recommendation: 'Connecter le backend pour recalculer les signaux.',
        route: '/dashboard',
      },
    ],
    roadmap: [
      {
        label: 'Activer connecteurs IA OCR en production',
        owner: 'DSI / RH',
        dueDate: '2026-06-15',
        status: 'A parametrer',
        progress: 40,
      },
      {
        label: 'Finaliser parametrage des workflows BPMN',
        owner: 'RH',
        dueDate: '2026-06-30',
        status: 'En cours',
        progress: 65,
      },
    ],
  };
}
