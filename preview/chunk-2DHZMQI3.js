import {
  OrganizationService
} from "./chunk-QNNNPGXI.js";
import "./chunk-2RQ7HY24.js";
import "./chunk-7C46ZOJO.js";
import {
  CommonModule,
  NgForOf,
  NgIf
} from "./chunk-BMX4STFJ.js";
import {
  Component,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-MOIGQQUQ.js";
import "./chunk-KWSTWQNB.js";

// src/app/modules/organization/pages/org-chart/org-chart.ts
function OrgChartPage_div_13_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const node_r1 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" \xB7 ", node_r1.unit.headTitle);
  }
}
function OrgChartPage_div_13_li_14_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275text(1);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const child_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" \xB7 ", child_r2.unit.headTitle);
  }
}
function OrgChartPage_div_13_li_14_ul_12_li_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li");
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const sub_r3 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate2(" ", sub_r3.unit.name, " \u2014 ", sub_r3.unit.staffCount, " agents ");
  }
}
function OrgChartPage_div_13_li_14_ul_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "ul", 27);
    \u0275\u0275template(1, OrgChartPage_div_13_li_14_ul_12_li_1_Template, 2, 2, "li", 28);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const child_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", child_r2.children);
  }
}
function OrgChartPage_div_13_li_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 23)(1, "div", 24)(2, "div")(3, "div", 15);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 16);
    \u0275\u0275text(6);
    \u0275\u0275template(7, OrgChartPage_div_13_li_14_ng_container_7_Template, 2, 1, "ng-container", 17);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 16);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "span", 25);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(12, OrgChartPage_div_13_li_14_ul_12_Template, 2, 1, "ul", 26);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const child_r2 = ctx.$implicit;
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(child_r2.unit.name);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", child_r2.unit.head || "Responsable \xE0 d\xE9finir", " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", child_r2.unit.headTitle);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", child_r2.unit.staffCount, " agents");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Sous-unit\xE9s: ", child_r2.children.length);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", child_r2.children.length);
  }
}
function OrgChartPage_div_13_li_15_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 29);
    \u0275\u0275text(1, "Aucune sous-unit\xE9");
    \u0275\u0275elementEnd();
  }
}
function OrgChartPage_div_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11)(1, "div", 12)(2, "div", 13)(3, "div", 14)(4, "div")(5, "div", 15);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 16);
    \u0275\u0275text(8);
    \u0275\u0275template(9, OrgChartPage_div_13_ng_container_9_Template, 2, 1, "ng-container", 17);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "span", 18);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(12, "div", 19)(13, "ul", 20);
    \u0275\u0275template(14, OrgChartPage_div_13_li_14_Template, 13, 6, "li", 21)(15, OrgChartPage_div_13_li_15_Template, 2, 0, "li", 22);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const node_r1 = ctx.$implicit;
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(node_r1.unit.name);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", node_r1.unit.head || "Responsable \xE0 d\xE9finir", " ");
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", node_r1.unit.headTitle);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", node_r1.unit.staffCount, " agents");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", node_r1.children);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", !node_r1.children.length);
  }
}
var OrgChartPage = class _OrgChartPage {
  organizationService = inject(OrganizationService);
  roots = [];
  ngOnInit() {
    this.organizationService.getOrgUnits().subscribe((units) => {
      this.roots = this.buildTree(units);
    });
  }
  buildTree(units) {
    const map = /* @__PURE__ */ new Map();
    units.forEach((u) => map.set(u.id, { unit: u, children: [] }));
    const roots = [];
    map.forEach((node) => {
      if (node.unit.parentId && map.has(node.unit.parentId)) {
        map.get(node.unit.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }
  static \u0275fac = function OrgChartPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _OrgChartPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _OrgChartPage, selectors: [["app-org-chart"]], decls: 14, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [1, "row"], ["class", "col-lg-4", 4, "ngFor", "ngForOf"], [1, "col-lg-4"], [1, "card", "border", "shadow-none", "mb-3"], [1, "card-header"], [1, "d-flex", "justify-content-between", "align-items-center"], [1, "fw-semibold"], [1, "text-muted", "fs-12"], [4, "ngIf"], [1, "badge", "bg-primary-transparent"], [1, "card-body", "p-2"], [1, "list-group", "list-group-flush"], ["class", "list-group-item", 4, "ngFor", "ngForOf"], ["class", "list-group-item text-muted fs-12", 4, "ngIf"], [1, "list-group-item"], [1, "d-flex", "align-items-start", "justify-content-between"], [1, "badge", "bg-light", "text-default"], ["class", "mt-2 ps-3 text-muted fs-12", 4, "ngIf"], [1, "mt-2", "ps-3", "text-muted", "fs-12"], [4, "ngFor", "ngForOf"], [1, "list-group-item", "text-muted", "fs-12"]], template: function OrgChartPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Organigramme");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Ajouter une unit\xE9");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "button", 7);
      \u0275\u0275text(10, "Exporter");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "div", 8)(12, "div", 9);
      \u0275\u0275template(13, OrgChartPage_div_13_Template, 16, 6, "div", 10);
      \u0275\u0275elementEnd()()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(13);
      \u0275\u0275property("ngForOf", ctx.roots);
    }
  }, dependencies: [CommonModule, NgForOf, NgIf], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OrgChartPage, [{
    type: Component,
    args: [{ selector: "app-org-chart", standalone: true, imports: [CommonModule], template: `<div class="row row-sm">
  <div class="col-xl-12">
    <div class="card custom-card">
      <div class="card-header justify-content-between">
        <div class="card-title">Organigramme</div>
        <div class="btn-list">
          <button class="btn btn-primary">Ajouter une unit\xE9</button>
          <button class="btn btn-outline-primary">Exporter</button>
        </div>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-lg-4" *ngFor="let node of roots">
            <div class="card border shadow-none mb-3">
              <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <div class="fw-semibold">{{ node.unit.name }}</div>
                    <div class="text-muted fs-12">
                      {{ node.unit.head || 'Responsable \xE0 d\xE9finir' }}
                      <ng-container *ngIf="node.unit.headTitle"> \xB7 {{ node.unit.headTitle }}</ng-container>
                    </div>
                  </div>
                  <span class="badge bg-primary-transparent">{{ node.unit.staffCount }} agents</span>
                </div>
              </div>
              <div class="card-body p-2">
                <ul class="list-group list-group-flush">
                  <li class="list-group-item" *ngFor="let child of node.children">
                    <div class="d-flex align-items-start justify-content-between">
                      <div>
                        <div class="fw-semibold">{{ child.unit.name }}</div>
                        <div class="text-muted fs-12">
                          {{ child.unit.head || 'Responsable \xE0 d\xE9finir' }}
                          <ng-container *ngIf="child.unit.headTitle"> \xB7 {{ child.unit.headTitle }}</ng-container>
                        </div>
                        <div class="text-muted fs-12">{{ child.unit.staffCount }} agents</div>
                      </div>
                      <span class="badge bg-light text-default">Sous-unit\xE9s: {{ child.children.length }}</span>
                    </div>
                    <ul class="mt-2 ps-3 text-muted fs-12" *ngIf="child.children.length">
                      <li *ngFor="let sub of child.children">
                        {{ sub.unit.name }} \u2014 {{ sub.unit.staffCount }} agents
                      </li>
                    </ul>
                  </li>
                  <li *ngIf="!node.children.length" class="list-group-item text-muted fs-12">Aucune sous-unit\xE9</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
` }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(OrgChartPage, { className: "OrgChartPage", filePath: "src/app/modules/organization/pages/org-chart/org-chart.ts", lineNumber: 16 });
})();
export {
  OrgChartPage
};
//# sourceMappingURL=chunk-2DHZMQI3.js.map
