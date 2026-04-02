import type { OrgUnit } from '../../organization.service';

export type ReorgSnapshotStatus = 'BROUILLON' | 'SOUMIS' | 'APPROUVE' | 'REJETE' | 'PUBLIE';
export type ReorgChangeType = 'CREATION' | 'MODIFICATION';

export interface ReorgUnitState {
  name: string;
  parentId?: string;
  head?: string;
  headTitle?: string;
  staffCount: number;
}

export interface ReorgChange {
  type: ReorgChangeType;
  unitId: string;
  unitName: string;
  before: ReorgUnitState | null;
  after: ReorgUnitState;
}

export interface ReorgSnapshot {
  id: string;
  label: string;
  status: ReorgSnapshotStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  workflowInstanceId?: string;
  changes: ReorgChange[];
  baseUnits: OrgUnit[];
  units: OrgUnit[];
}

export function cloneOrgUnits(units: OrgUnit[]): OrgUnit[] {
  return units.map((unit) => ({ ...unit }));
}

export function computeReorgChanges(baseUnits: OrgUnit[], nextUnits: OrgUnit[]): ReorgChange[] {
  const byIdBase = new Map(baseUnits.map((unit) => [unit.id, unit]));
  const changes: ReorgChange[] = [];

  nextUnits.forEach((next) => {
    const base = byIdBase.get(next.id);
    const nextState = toReorgState(next);

    if (!base) {
      changes.push({
        type: 'CREATION',
        unitId: next.id,
        unitName: next.name,
        before: null,
        after: nextState,
      });
      return;
    }

    const baseState = toReorgState(base);
    if (!sameState(baseState, nextState)) {
      changes.push({
        type: 'MODIFICATION',
        unitId: next.id,
        unitName: next.name,
        before: baseState,
        after: nextState,
      });
    }
  });

  return changes;
}

export function buildSimulationLabel(now: Date = new Date()): string {
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return `Simulation organigramme ${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function toReorgState(unit: OrgUnit): ReorgUnitState {
  return {
    name: String(unit.name || '').trim(),
    parentId: normalizeOptionalText(unit.parentId),
    head: normalizeOptionalText(unit.head),
    headTitle: normalizeOptionalText(unit.headTitle),
    staffCount: Number.isFinite(unit.staffCount) ? Math.max(0, Math.round(unit.staffCount)) : 0,
  };
}

function sameState(left: ReorgUnitState, right: ReorgUnitState): boolean {
  return (
    left.name === right.name &&
    (left.parentId || '') === (right.parentId || '') &&
    (left.head || '') === (right.head || '') &&
    (left.headTitle || '') === (right.headTitle || '') &&
    left.staffCount === right.staffCount
  );
}

function normalizeOptionalText(value: unknown): string | undefined {
  const normalized = String(value || '').trim();
  return normalized.length ? normalized : undefined;
}
