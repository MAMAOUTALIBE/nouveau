import type { OrgUnit } from '../../organization.service';

export interface OrgTreeNode {
  unit: OrgUnit;
  children: OrgTreeNode[];
}

export interface FlattenedOrgTreeItem {
  node: OrgTreeNode;
  depth: number;
  parentName: string;
}

export function buildOrgTree(units: OrgUnit[]): OrgTreeNode[] {
  const map = new Map<string, OrgTreeNode>();
  units.forEach((unit) => map.set(unit.id, { unit, children: [] }));

  const roots: OrgTreeNode[] = [];
  map.forEach((node) => {
    const parentId = node.unit.parentId;
    if (!parentId || !map.has(parentId) || parentId === node.unit.id || createsCycle(node.unit.id, parentId, map)) {
      roots.push(node);
      return;
    }
    map.get(parentId)!.children.push(node);
  });

  roots.sort(compareNodesByName);
  roots.forEach((root) => sortChildrenRecursively(root));
  return roots;
}

export function flattenOrgTree(nodes: OrgTreeNode[]): FlattenedOrgTreeItem[] {
  const flattened: FlattenedOrgTreeItem[] = [];
  const walk = (items: OrgTreeNode[], depth: number, parentName: string) => {
    items.forEach((node) => {
      flattened.push({ node, depth, parentName });
      walk(node.children, depth + 1, node.unit.name);
    });
  };

  walk(nodes, 0, '');
  return flattened;
}

export function collectCollapsibleNodeIds(nodes: OrgTreeNode[]): string[] {
  const ids: string[] = [];
  const walk = (items: OrgTreeNode[]) => {
    items.forEach((node) => {
      if (node.children.length > 0) {
        ids.push(node.unit.id);
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return ids;
}

export function collectDescendantIds(nodes: OrgTreeNode[], rootId: string): Set<string> {
  const descendants = new Set<string>();
  const rootNode = findNodeById(nodes, rootId);
  if (!rootNode) {
    return descendants;
  }

  const walk = (node: OrgTreeNode) => {
    node.children.forEach((child) => {
      descendants.add(child.unit.id);
      walk(child);
    });
  };
  walk(rootNode);

  return descendants;
}

export function summarizeOrgUnits(units: OrgUnit[]): { totalUnits: number; totalStaff: number } {
  const totalUnits = units.length;
  const totalStaff = units.reduce((sum, item) => sum + (Number.isFinite(item.staffCount) ? item.staffCount : 0), 0);
  return { totalUnits, totalStaff };
}

function sortChildrenRecursively(node: OrgTreeNode): void {
  node.children.sort(compareNodesByName);
  node.children.forEach((child) => sortChildrenRecursively(child));
}

function compareNodesByName(left: OrgTreeNode, right: OrgTreeNode): number {
  return left.unit.name.localeCompare(right.unit.name, 'fr', { sensitivity: 'base' });
}

function createsCycle(id: string, parentId: string, map: Map<string, OrgTreeNode>): boolean {
  const visited = new Set<string>([id]);
  let cursor = parentId;

  while (cursor && map.has(cursor)) {
    if (visited.has(cursor)) {
      return true;
    }

    visited.add(cursor);
    cursor = map.get(cursor)!.unit.parentId || '';
  }

  return false;
}

function findNodeById(nodes: OrgTreeNode[], id: string): OrgTreeNode | null {
  for (const node of nodes) {
    if (node.unit.id === id) {
      return node;
    }

    const childMatch = findNodeById(node.children, id);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}
