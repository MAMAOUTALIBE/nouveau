import { describe, expect, it } from 'vitest';
import type { OrgUnit } from '../../organization.service';
import {
  buildOrgTree,
  collectCollapsibleNodeIds,
  collectDescendantIds,
  flattenOrgTree,
  summarizeOrgUnits,
} from './org-chart.utils';

const sampleUnits: OrgUnit[] = [
  { id: 'ORG-RH', name: 'Direction RH', staffCount: 12 },
  { id: 'ORG-ADMIN', name: 'Direction Administrative', staffCount: 6 },
  { id: 'ORG-RH-PAIE', name: 'Service Paie', parentId: 'ORG-RH', staffCount: 4 },
  { id: 'ORG-RH-REC', name: 'Service Recrutement', parentId: 'ORG-RH', staffCount: 3 },
  { id: 'ORG-RH-REC-OPS', name: 'Cellule Operations', parentId: 'ORG-RH-REC', staffCount: 2 },
];

describe('org-chart.utils', () => {
  it('builds an org tree with unlimited depth and sorted children', () => {
    const roots = buildOrgTree(sampleUnits);

    expect(roots.map((item) => item.unit.id)).toEqual(['ORG-ADMIN', 'ORG-RH']);
    expect(roots[1].children.map((item) => item.unit.id)).toEqual(['ORG-RH-PAIE', 'ORG-RH-REC']);
    expect(roots[1].children[1].children.map((item) => item.unit.id)).toEqual(['ORG-RH-REC-OPS']);
  });

  it('keeps cyclic records as roots instead of creating recursive loops', () => {
    const cyclicUnits: OrgUnit[] = [
      { id: 'A', name: 'A', parentId: 'B', staffCount: 1 },
      { id: 'B', name: 'B', parentId: 'A', staffCount: 1 },
    ];

    const roots = buildOrgTree(cyclicUnits);

    expect(roots).toHaveLength(2);
    expect(roots.every((item) => item.children.length === 0)).toBe(true);
  });

  it('flattens tree items with depth and parent name', () => {
    const flattened = flattenOrgTree(buildOrgTree(sampleUnits));
    const row = flattened.find((item) => item.node.unit.id === 'ORG-RH-REC-OPS');

    expect(row).toBeDefined();
    expect(row!.depth).toBe(2);
    expect(row!.parentName).toBe('Service Recrutement');
  });

  it('collects only collapsible node ids', () => {
    const ids = collectCollapsibleNodeIds(buildOrgTree(sampleUnits));
    expect(ids).toEqual(['ORG-RH', 'ORG-RH-REC']);
  });

  it('collects descendants for a selected unit', () => {
    const descendantIds = collectDescendantIds(buildOrgTree(sampleUnits), 'ORG-RH');
    expect(Array.from(descendantIds)).toEqual(['ORG-RH-PAIE', 'ORG-RH-REC', 'ORG-RH-REC-OPS']);
  });

  it('summarizes total units and staff count', () => {
    expect(summarizeOrgUnits(sampleUnits)).toEqual({
      totalUnits: 5,
      totalStaff: 27,
    });
  });
});
