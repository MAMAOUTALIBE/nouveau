import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrgUnit, OrganizationService } from '../../organization.service';

interface OrgNode {
  unit: OrgUnit;
  children: OrgNode[];
}

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './org-chart.html',
})
export class OrgChartPage implements OnInit {
  private organizationService = inject(OrganizationService);

  roots: OrgNode[] = [];

  ngOnInit(): void {
    this.organizationService.getOrgUnits().subscribe((units) => {
      this.roots = this.buildTree(units);
    });
  }

  private buildTree(units: OrgUnit[]): OrgNode[] {
    const map = new Map<string, OrgNode>();
    units.forEach((u) => map.set(u.id, { unit: u, children: [] }));

    const roots: OrgNode[] = [];
    map.forEach((node) => {
      if (node.unit.parentId && map.has(node.unit.parentId)) {
        map.get(node.unit.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
