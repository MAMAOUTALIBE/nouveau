import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentDetailPage } from './agent-detail';
import {
  AgentAuditEvent,
  AgentDetail,
  AgentDigitalBadge,
  PersonnelAffectation,
  PersonnelDossier,
  PersonnelService,
} from '../../personnel.service';
import { AccessControlService, APP_PERMISSIONS } from '../../../../core/security/access-control.service';
import { DisciplineCase, DisciplineService } from '../../../discipline/discipline.service';
import { DocumentsService } from '../../../documents/documents.service';

/**
 * Tests classe-level pour `AgentDetailPage`. Le composant déclenche au boot
 * `getAgentById(id)` puis enchaîne sur `forkJoin` (dossiers / affectations /
 * discipline / audit trail) + `getAgentDigitalBadge`. On stub tous les
 * services pour piloter les scénarios sans HTTP réel.
 */

class ToastrStub {
  success = vi.fn();
  error = vi.fn();
  warning = vi.fn();
  info = vi.fn();
}

class AccessControlStub {
  hasPermission: (perm: string) => boolean = vi.fn(
    (perm: string) => perm === APP_PERMISSIONS.personnelManage
  );
}

function makeAgentDetail(overrides: Partial<AgentDetail> = {}): AgentDetail {
  return {
    id: 'PRM-0001',
    matricule: 'PRM-0001',
    fullName: 'Aminata Diallo',
    direction: 'Direction RH',
    position: 'Chef de service',
    unit: 'Unite 1',
    status: 'Actif',
    manager: 'Seydou Traore',
    email: 'aminata.diallo@gov.gn',
    phone: '+224 600 00 00 00',
    photoUrl: './assets/images/faces/profile.jpg',
    identity: {
      identityType: 'CNI',
      identityNumber: 'CNI-001-2026',
      birthDate: '1985-04-12',
      birthPlace: 'Conakry',
      nationality: 'Guineenne',
    },
    administrative: {
      hireDate: '2020-01-15',
      contractType: 'CDI',
      address: 'Conakry',
      emergencyContactName: 'Mariam Diallo',
      emergencyContactPhone: '+224 620 00 00 00',
    },
    educations: [],
    competencies: [],
    dependents: [],
    careerEvents: [],
    documents: [],
    ...overrides,
  };
}

function makeBadge(): AgentDigitalBadge {
  return {
    agentId: 'PRM-0001',
    badgeId: 'BADGE-1',
    issuedAt: '2026-01-01',
    expiresAt: '2027-01-01',
    status: 'ACTIVE',
    verificationCode: 'AB12',
    signatureHash: 'hash',
    qrPayload: 'qr-payload',
  };
}

interface PersonnelStub {
  getAgentById: ReturnType<typeof vi.fn>;
  getDossiers: ReturnType<typeof vi.fn>;
  getAffectations: ReturnType<typeof vi.fn>;
  getAgentAuditTrail: ReturnType<typeof vi.fn>;
  getAgentDigitalBadge: ReturnType<typeof vi.fn>;
  updateAgent: ReturnType<typeof vi.fn>;
}

function createPersonnelStub(agent: AgentDetail | null): PersonnelStub {
  return {
    getAgentById: vi.fn(() => of(agent)),
    getDossiers: vi.fn(() => of([] as PersonnelDossier[])),
    getAffectations: vi.fn(() => of([] as PersonnelAffectation[])),
    getAgentAuditTrail: vi.fn(() => of([] as AgentAuditEvent[])),
    getAgentDigitalBadge: vi.fn(() => of(makeBadge())),
    updateAgent: vi.fn(),
  };
}

interface DisciplineStub {
  getCases: ReturnType<typeof vi.fn>;
}

function createDisciplineStub(): DisciplineStub {
  return {
    getCases: vi.fn(() => of([] as DisciplineCase[])),
  };
}

interface DocumentsStub {
  analyzeDocument: ReturnType<typeof vi.fn>;
}

function createDocumentsStub(): DocumentsStub {
  return {
    analyzeDocument: vi.fn(),
  };
}

function buildComponent(
  paramMap: Record<string, string | null>,
  personnelStub: PersonnelStub
): AgentDetailPage {
  TestBed.resetTestingModule();

  const paramMapSubject = new BehaviorSubject(convertToParamMap(paramMap));
  const activatedRouteStub = {
    paramMap: paramMapSubject.asObservable(),
    snapshot: { paramMap: paramMapSubject.value },
  };

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: activatedRouteStub },
      { provide: PersonnelService, useValue: personnelStub },
      { provide: DisciplineService, useValue: createDisciplineStub() },
      { provide: DocumentsService, useValue: createDocumentsStub() },
      { provide: AccessControlService, useClass: AccessControlStub },
      { provide: ToastrService, useClass: ToastrStub },
    ],
  });

  return TestBed.runInInjectionContext(() => new AgentDetailPage());
}

async function flushMicrotasks(): Promise<void> {
  // applyAgentDetails est appelé via queueMicrotask → on laisse vider la queue.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('AgentDetailPage', () => {
  let personnelStub: PersonnelStub;

  beforeEach(() => {
    personnelStub = createPersonnelStub(makeAgentDetail());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches the agent by id and applies the details to the form', async () => {
    const component = buildComponent({ id: 'PRM-0001' }, personnelStub);
    component.ngOnInit();
    await flushMicrotasks();

    expect(personnelStub.getAgentById).toHaveBeenCalledWith('PRM-0001');
    expect(component.agent.id).toBe('PRM-0001');
    expect(component.agent.fullName).toBe('Aminata Diallo');
    // PII visible côté client une fois le détail chargé (décrypté par l'API).
    expect(component.agent.email).toBe('aminata.diallo@gov.gn');
    expect(component.form.get('email')?.value).toBe('aminata.diallo@gov.gn');
  });

  it('does nothing when the route has no id (missing param)', async () => {
    const component = buildComponent({ id: null }, personnelStub);
    component.ngOnInit();
    await flushMicrotasks();

    expect(personnelStub.getAgentById).not.toHaveBeenCalled();
    // L'état initial du composant reste vide.
    expect(component.agent.id).toBe('');
  });

  it('keeps the default agent state when the API returns null (not found)', async () => {
    personnelStub = createPersonnelStub(null);
    const component = buildComponent({ id: 'INCONNU' }, personnelStub);
    component.ngOnInit();
    await flushMicrotasks();

    expect(personnelStub.getAgentById).toHaveBeenCalledWith('INCONNU');
    // applyAgentDetails ne tourne pas si details === null → form reste vierge.
    expect(component.agent.id).toBe('');
    expect(component.agent.email).toBe('');
  });

  it('switches between tabs (identity ↔ documents) without losing data', async () => {
    const component = buildComponent({ id: 'PRM-0001' }, personnelStub);
    component.ngOnInit();
    await flushMicrotasks();

    expect(component.activeTabId).toBe('identity');

    component.activeTabId = 'documents';
    expect(component.activeTabId).toBe('documents');
    // Les données du formulaire ne sont pas perdues par un simple changement
    // d'onglet (pattern : 1 form unique partagé entre les onglets).
    expect(component.form.get('fullName')?.value).toBe('Aminata Diallo');

    component.activeTabId = 'identity';
    expect(component.form.get('email')?.value).toBe('aminata.diallo@gov.gn');
  });

  it('blocks toggleEdit() when the access control denies personnelManage', async () => {
    const component = buildComponent({ id: 'PRM-0001' }, personnelStub);
    // Override l'ACL injectée dans ce composant (créé via runInInjectionContext
    // dans buildComponent → re-récupération du token).
    const acl = TestBed.inject(AccessControlService) as unknown as AccessControlStub;
    acl.hasPermission = vi.fn(() => false) as unknown as (perm: string) => boolean;
    component.ngOnInit();
    await flushMicrotasks();

    expect(component.editMode).toBe(false);
    component.toggleEdit();
    expect(component.editMode).toBe(false);
  });

  it('loads the agent digital badge after applying the details', async () => {
    const component = buildComponent({ id: 'PRM-0001' }, personnelStub);
    component.ngOnInit();
    await flushMicrotasks();

    expect(personnelStub.getAgentDigitalBadge).toHaveBeenCalledWith('PRM-0001');
    expect(component.digitalBadge).not.toBeNull();
    expect(component.digitalBadge?.badgeId).toBe('BADGE-1');
  });
});
