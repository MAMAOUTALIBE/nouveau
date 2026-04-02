import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatTree, MatTreeModule, } from '@angular/material/tree';

import {MatIconModule} from '@angular/material/icon';

import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Tree node interface
 */
interface TreeNode {
  name: string;
  children?: TreeNode[];
}

const TREE_DATA: TreeNode[] = [
  {
    name: 'TECH',
    children: [
      { name: 'Company Maintenance' },
      { name: 'Employees' },
      { name: 'Human Resources' },
    ],
  },
  {
    name: 'XRP',
    children: [
      { name: 'Company Maintenance' },
      {
        name: 'Employees',
        children: [
          { name: 'Company Maintenance-1' },
          {
            name: 'Employees-1',
            children: [
              { name: 'Company Maintenance-2' },
              { name: 'Employees-2' },
              { name: 'Human Resources-2' },
            ],
          },
        ],
      },
      { name: 'Human Resources' },
    ],
  },
  {
    name: 'Tech2',
    children: [
      { name: 'Company Maintenance' },
      {
        name: 'Employees',
        children: [
          { name: 'Company Maintenance' },
          {
            name: 'Employees',
            children: [{ name: 'Human Resources' }],
          },
        ],
      },
    ],
  },
  {
    name: 'TECH3',
  },
];
@Component({
  selector: 'app-treeview',
  imports: [ MatTreeModule, MatIconModule, MatProgressBarModule],
  templateUrl: './treeview.html',
  styleUrl: './treeview.scss'
})
export class Treeview {
  dataSource = TREE_DATA;

  childrenAccessor = (node: TreeNode) => node.children ?? [];

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;

  @ViewChild('tree') tree!: MatTree<TreeNode>;

  ngOnInit() {
    // Data source is set in constructor or here
  }

  ngAfterViewInit() {
    // Expand the 'XRP' node and its descendants after the view is initialized
    this.expandNodeByName('XRP');
  }

  private expandNodeByName(name: string) {
    const node = this.findNodeByName(this.dataSource, name);
    if (node) {
      this.expandNodeAndDescendants(node);
    }
  }

  private findNodeByName(nodes: TreeNode[], name: string): TreeNode | undefined {
    for (const node of nodes) {
      if (node.name === name) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeByName(node.children, name);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  private expandNodeAndDescendants(node: TreeNode) {
    if (this.tree) {
      this.tree.expand(node);
      if (node.children) {
        node.children.forEach(child => this.expandNodeAndDescendants(child));
      }
    }
  }

}



