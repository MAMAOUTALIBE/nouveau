import { describe, expect, it } from 'vitest';
import {
  composeHrReportSnapshot,
  normalizeHrReportFilters,
  type HrReportSourceData,
} from './hr-reports.service';

function daysFrom(base: Date, days: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

describe('HrReportsService analytics helpers', () => {
  it('normalizes filters with defaults and bounds', () => {
    expect(normalizeHrReportFilters()).toEqual({ periodDays: 90, direction: null });
    expect(normalizeHrReportFilters({ periodDays: 10 })).toEqual({ periodDays: 30, direction: null });
    expect(normalizeHrReportFilters({ periodDays: 700 })).toEqual({ periodDays: 365, direction: null });
    expect(normalizeHrReportFilters({ direction: '  Direction RH  ' })).toEqual({
      periodDays: 90,
      direction: 'Direction RH',
    });
  });

  it('builds snapshot metrics, distributions and risks from source data', () => {
    const now = new Date('2026-03-23T10:00:00.000Z');
    const source: HrReportSourceData = {
      agents: [
        {
          id: 'A1',
          matricule: 'A1',
          fullName: 'Aminata Diallo',
          direction: 'Direction RH',
          position: 'Manager',
          status: 'Actif',
          manager: 'N1',
        },
        {
          id: 'A2',
          matricule: 'A2',
          fullName: 'Moussa Camara',
          direction: 'Direction RH',
          position: 'Analyste',
          status: 'Inactif',
          manager: 'N1',
        },
      ],
      leaveRequests: [
        {
          reference: 'L1',
          agent: 'Aminata Diallo',
          type: 'Conge annuel',
          startDate: daysFrom(now, -5),
          endDate: daysFrom(now, 3),
          status: 'En cours',
        },
        {
          reference: 'L2',
          agent: 'Moussa Camara',
          type: 'Maladie',
          startDate: daysFrom(now, -60),
          endDate: daysFrom(now, -58),
          status: 'Approuve',
        },
      ],
      vacancies: [
        {
          code: 'V-1',
          structure: 'Direction RH',
          title: 'Juriste',
          grade: 'A2',
          openedOn: daysFrom(now, -15),
          priority: 'Haute',
        },
      ],
      workflows: [
        {
          id: 'W-1',
          definition: 'Validation conges',
          requester: 'Aminata Diallo',
          createdOn: daysFrom(now, -8),
          currentStep: 'Validation N2',
          status: 'EN_RETARD',
          priority: 'Critique',
          dueOn: daysFrom(now, -1),
          owner: 'Direction RH',
          stepsTotal: 3,
          stepsCompleted: 1,
          escalationLevel: 2,
          lastUpdateOn: daysFrom(now, -1),
          timeline: [],
          slaState: 'BREACHED',
        },
        {
          id: 'W-2',
          definition: 'Validation recrutement',
          requester: 'Moussa Camara',
          createdOn: daysFrom(now, -20),
          currentStep: 'Termine',
          status: 'APPROUVE',
          priority: 'Normale',
          dueOn: daysFrom(now, -2),
          owner: 'Direction RH',
          stepsTotal: 4,
          stepsCompleted: 4,
          escalationLevel: 0,
          lastUpdateOn: daysFrom(now, -2),
          timeline: [],
          slaState: 'OK',
        },
      ],
      applications: [
        {
          reference: 'R-1',
          candidate: 'Kadiatou',
          position: 'Analyste',
          campaign: 'Campagne RH',
          status: 'En attente',
          receivedOn: daysFrom(now, -6),
        },
        {
          reference: 'R-2',
          candidate: 'Mamady',
          position: 'Juriste',
          campaign: 'Campagne RH',
          status: 'Rejete',
          receivedOn: daysFrom(now, -4),
        },
      ],
    };

    const snapshot = composeHrReportSnapshot(
      source,
      { periodDays: 90, direction: 'Direction RH' },
      now
    );

    expect(snapshot.kpis.find((kpi) => kpi.id === 'total_agents')?.value).toBe(2);
    expect(snapshot.kpis.find((kpi) => kpi.id === 'active_agents')?.value).toBe(1);
    expect(snapshot.kpis.find((kpi) => kpi.id === 'open_leaves')?.value).toBe(1);
    expect(snapshot.kpis.find((kpi) => kpi.id === 'vacant_positions')?.value).toBe(1);
    expect(snapshot.kpis.find((kpi) => kpi.id === 'workflow_breached')?.value).toBe(1);
    expect(snapshot.kpis.find((kpi) => kpi.id === 'absenteeism_rate')?.value).toBe(50);

    expect(snapshot.directionDistribution[0]).toMatchObject({ label: 'Direction RH', value: 2 });
    expect(snapshot.leaveByType.map((item) => item.label)).toEqual(['Conge annuel', 'Maladie']);
    expect(snapshot.workflowByStatus.map((item) => item.label)).toContain('EN_RETARD');
    expect(snapshot.riskItems[0]).toMatchObject({ instanceId: 'W-1' });
    expect(snapshot.leaveTrend).toHaveLength(6);
    expect(snapshot.workflowThroughputTrend).toHaveLength(6);
    expect(snapshot.insights.join(' ')).toContain('workflow(s) en depassement SLA');
  });
});
