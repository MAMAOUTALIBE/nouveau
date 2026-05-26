import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentListPage } from './agent-list';
import {
  AgentDuplicateCase,
  AgentListItem,
  PersonnelAffectation,
  PersonnelDossier,
  PersonnelService,
} from '../../personnel.service';
import { AccessControlService } from '../../../../core/security/access-control.service';

/**
 * Tests classe-level pour `AgentListPage`. Le composant fait un `forkJoin` sur
 * 3 endpoints au boot : on stub `PersonnelService` pour piloter le scénario.
 */

class ToastrStub {
  success = vi.fn();
  error = vi.fn();
  warning = vi.fn();
  info = vi.fn();
}

class AccessControlStub {
  hasAnyRole = vi.fn(() => true);
  hasPermission = vi.fn(() => true);
}

function makeAgent(overrides: Partial<AgentListItem> = {}): AgentListItem {
  return {
    id: 'PRM-0001',
    matricule: 'PRM-0001',
    fullName: 'Aminata Diallo',
    direction: 'Direction RH',
    unit: 'Unite 1',
    position: 'Chef de service',
    status: 'Actif',
    manager: 'Seydou Traore',
    contractType: 'CDI',
    photoUrl: './assets/images/faces/profile.jpg',
    hireDate: '2026-01-15',
    documents: [],
    ...overrides,
  };
}

interface PersonnelServiceStub {
  getAgents: ReturnType<typeof vi.fn>;
  getDossiers: ReturnType<typeof vi.fn>;
  getAffectations: ReturnType<typeof vi.fn>;
  getAgentDuplicateCases: ReturnType<typeof vi.fn>;
}

function createServiceStub(agents: AgentListItem[]): PersonnelServiceStub {
  return {
    getAgents: vi.fn(() => of(agents)),
    getDossiers: vi.fn(() => of([] as PersonnelDossier[])),
    getAffectations: vi.fn(() => of([] as PersonnelAffectation[])),
    getAgentDuplicateCases: vi.fn(() => of([] as AgentDuplicateCase[])),
  };
}

function buildComponent(serviceStub: PersonnelServiceStub): AgentListPage {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: PersonnelService, useValue: serviceStub },
      { provide: AccessControlService, useClass: AccessControlStub },
      { provide: ToastrService, useClass: ToastrStub },
    ],
  });

  return TestBed.runInInjectionContext(() => new AgentListPage());
}

describe('AgentListPage', () => {
  let serviceStub: PersonnelServiceStub;

  beforeEach(() => {
    serviceStub = createServiceStub([makeAgent()]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls personnelService.getAgents() on init and populates the list', () => {
    const component = buildComponent(serviceStub);
    component.ngOnInit();

    expect(serviceStub.getAgents).toHaveBeenCalled();
    expect(component.allAgents.length).toBe(1);
    expect(component.allAgents[0].fullName).toBe('Aminata Diallo');
  });

  it('computes KPIs from the loaded agents (effectif + risque)', () => {
    serviceStub = createServiceStub([
      makeAgent({ id: 'PRM-0001', matricule: 'PRM-0001' }),
      // Matricule non conforme + nom court → riskLevel Critique attendu.
      makeAgent({ id: 'X1', matricule: 'X1', fullName: 'A', manager: '' }),
    ]);
    const component = buildComponent(serviceStub);
    component.ngOnInit();

    expect(component.kpiTotalAgents).toBe(2);
    expect(component.kpiCriticalRisk).toBeGreaterThanOrEqual(1);
    expect(component.kpiMissingManager).toBe(1);
  });

  it('keeps the table empty when the API returns no agent (empty state)', () => {
    serviceStub = createServiceStub([]);
    const component = buildComponent(serviceStub);
    component.ngOnInit();

    expect(component.allAgents).toEqual([]);
    expect(component.currentAgents).toEqual([]);
    expect(component.displayedAgents()).toEqual([]);
    expect(component.kpiTotalAgents).toBe(0);
  });

  it('shows the loading flag during the request and clears it on completion', () => {
    // Sujet manuel : on n'émet qu'à la fin du test pour observer le flag.
    const agentsSubject = new Subject<AgentListItem[]>();
    serviceStub.getAgents = vi.fn(() => agentsSubject.asObservable());
    const component = buildComponent(serviceStub);
    component.ngOnInit();

    // Loader actif tant que forkJoin n'a pas tout reçu.
    expect(component.isLoading).toBe(true);

    agentsSubject.next([makeAgent()]);
    agentsSubject.complete();

    expect(component.isLoading).toBe(false);
    expect(component.allAgents.length).toBe(1);
  });

  it('paginates: page 2 returns the next slice and respects the page size', () => {
    const agents = Array.from({ length: 25 }, (_, index) =>
      makeAgent({ id: `PRM-${index + 1000}`, matricule: `PRM-${index + 1000}`, fullName: `Agent ${index}` })
    );
    serviceStub = createServiceStub(agents);
    const component = buildComponent(serviceStub);
    component.ngOnInit();

    component.pageSize = 10;
    expect(component.totalPages()).toBe(3);

    component.goToPage(2);
    const page2 = component.displayedAgents();
    expect(page2.length).toBe(10);
    expect(page2[0].fullName).toBe('Agent 10');
  });

  it('debounces search input and reloads agents after 250 ms', () => {
    vi.useFakeTimers();
    const component = buildComponent(serviceStub);
    component.ngOnInit();
    const initialCalls = serviceStub.getAgents.mock.calls.length;

    component.onSearchInput('Aminata');
    // Avant timeout : pas de rechargement.
    expect(serviceStub.getAgents.mock.calls.length).toBe(initialCalls);

    vi.advanceTimersByTime(260);
    expect(serviceStub.getAgents.mock.calls.length).toBeGreaterThan(initialCalls);
    const lastCallArgs = serviceStub.getAgents.mock.calls.at(-1) ?? [];
    expect(lastCallArgs[0]).toMatchObject({ q: 'Aminata' });
  });

  it('filters the visible list by risk level when the user changes the filter', () => {
    const goodAgent = makeAgent({ id: 'PRM-2000', matricule: 'PRM-2000', fullName: 'Bon Agent' });
    const badAgent = makeAgent({
      id: 'BAD',
      matricule: 'BAD',
      fullName: 'X',
      unit: '',
      manager: '',
      contractType: '',
    });
    serviceStub = createServiceStub([goodAgent, badAgent]);
    const component = buildComponent(serviceStub);
    component.ngOnInit();

    const criticalBefore = component.allAgents.filter((item) => item.riskLevel === 'Critique').length;
    expect(criticalBefore).toBeGreaterThanOrEqual(1);

    component.onRiskSelected('Critique');
    expect(component.currentAgents.length).toBe(criticalBefore);
    expect(component.currentAgents.every((item) => item.riskLevel === 'Critique')).toBe(true);

    // Retour à `all` → on retrouve les deux agents.
    component.onRiskSelected('all');
    expect(component.currentAgents.length).toBe(2);
  });

  it('falls back to an empty state when the agents API errors', () => {
    // `loadFilterCatalog` appelle aussi `getAgents()` au boot — on lui sert
    // un succès vide pour ne capter que l'erreur du `forkJoin` principal.
    let call = 0;
    serviceStub.getAgents = vi.fn(() => {
      call += 1;
      if (call === 1) {
        return of([] as AgentListItem[]);
      }
      return throwError(() => new Error('boom'));
    });
    const component = buildComponent(serviceStub);
    component.ngOnInit();

    expect(component.allAgents).toEqual([]);
    expect(component.currentAgents).toEqual([]);
    expect(component.kpiTotalAgents).toBe(0);
  });
});
