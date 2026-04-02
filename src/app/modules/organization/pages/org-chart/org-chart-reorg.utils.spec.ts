import { describe, expect, it } from 'vitest';
import type { OrgUnit } from '../../organization.service';
import { buildSimulationLabel, cloneOrgUnits, computeReorgChanges } from './org-chart-reorg.utils';

describe('org-chart-reorg.utils', () => {
  const baseUnits: OrgUnit[] = [
    { id: 'ORG-A', name: 'Direction A', staffCount: 10 },
    { id: 'ORG-B', name: 'Direction B', parentId: 'ORG-A', head: 'Chef B', staffCount: 5 },
  ];

  it('clones org units without sharing references', () => {
    const cloned = cloneOrgUnits(baseUnits);
    cloned[0].name = 'Direction A (modifiee)';

    expect(baseUnits[0].name).toBe('Direction A');
    expect(cloned).toHaveLength(2);
  });

  it('detects modifications and creations in simulation changes', () => {
    const nextUnits: OrgUnit[] = [
      { id: 'ORG-A', name: 'Direction A', staffCount: 12 },
      { id: 'ORG-B', name: 'Direction B', parentId: 'ORG-A', head: 'Chef B', staffCount: 5 },
      { id: 'ORG-C', name: 'Cellule C', parentId: 'ORG-B', staffCount: 2 },
    ];

    const changes = computeReorgChanges(baseUnits, nextUnits);

    expect(changes).toHaveLength(2);
    expect(changes[0]).toMatchObject({
      type: 'MODIFICATION',
      unitId: 'ORG-A',
      before: { staffCount: 10 },
      after: { staffCount: 12 },
    });
    expect(changes[1]).toMatchObject({
      type: 'CREATION',
      unitId: 'ORG-C',
      before: null,
      after: { name: 'Cellule C', parentId: 'ORG-B', staffCount: 2 },
    });
  });

  it('builds a simulation label with stable date formatting', () => {
    const label = buildSimulationLabel(new Date('2026-03-30T08:05:00.000Z'));
    expect(label).toContain('Simulation organigramme');
    expect(label).toContain('2026-03-30');
  });
});
