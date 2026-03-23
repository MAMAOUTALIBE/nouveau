import {
  CommonModule,
  NgClass,
  NgForOf
} from "./chunk-BMX4STFJ.js";
import {
  Component,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵproperty,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-MOIGQQUQ.js";
import "./chunk-KWSTWQNB.js";

// src/app/modules/reports/pages/hr-reports/hr-reports.ts
function HrReportsPage_div_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 15)(1, "div", 16)(2, "span", 17);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 18);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const kpi_r1 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", kpi_r1.badge);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(kpi_r1.label);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(kpi_r1.value);
  }
}
function HrReportsPage_li_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 19)(1, "span");
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 20);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const report_r2 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(report_r2.name);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(report_r2.format);
  }
}
var HrReportsPage = class _HrReportsPage {
  kpis = [
    { label: "Effectif total", value: 320, badge: "bg-primary" },
    { label: "Agents actifs", value: 305, badge: "bg-success" },
    { label: "Absences en cours", value: 12, badge: "bg-warning" },
    { label: "Postes vacants", value: 8, badge: "bg-danger" }
  ];
  reports = [
    { name: "Effectifs par direction", format: "PDF" },
    { name: "Mouvements de carri\xE8re", format: "Excel" },
    { name: "Absences mensuelles", format: "PDF" }
  ];
  static \u0275fac = function HrReportsPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HrReportsPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HrReportsPage, selectors: [["app-hr-reports"]], decls: 19, vars: 2, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [1, "row", "g-3"], ["class", "col-sm-6 col-lg-3", 4, "ngFor", "ngForOf"], [1, "mt-4"], [1, "fw-semibold", "mb-3"], [1, "list-group"], ["class", "list-group-item d-flex justify-content-between align-items-center", 4, "ngFor", "ngForOf"], [1, "col-sm-6", "col-lg-3"], [1, "card", "shadow-none", "border", "text-center", "p-3"], [1, "badge", "mb-2", 3, "ngClass"], [1, "fs-24", "fw-semibold"], [1, "list-group-item", "d-flex", "justify-content-between", "align-items-center"], [1, "badge", "bg-primary-transparent"]], template: function HrReportsPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Rapports RH");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Exporter PDF");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "button", 7);
      \u0275\u0275text(10, "Exporter Excel");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "div", 8)(12, "div", 9);
      \u0275\u0275template(13, HrReportsPage_div_13_Template, 6, 3, "div", 10);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(14, "div", 11)(15, "h6", 12);
      \u0275\u0275text(16, "Exports rapides");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(17, "ul", 13);
      \u0275\u0275template(18, HrReportsPage_li_18_Template, 5, 2, "li", 14);
      \u0275\u0275elementEnd()()()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(13);
      \u0275\u0275property("ngForOf", ctx.kpis);
      \u0275\u0275advance(5);
      \u0275\u0275property("ngForOf", ctx.reports);
    }
  }, dependencies: [CommonModule, NgClass, NgForOf], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HrReportsPage, [{
    type: Component,
    args: [{ selector: "app-hr-reports", standalone: true, imports: [CommonModule], template: '<div class="row row-sm">\n  <div class="col-xl-12">\n    <div class="card custom-card">\n      <div class="card-header justify-content-between">\n        <div class="card-title">Rapports RH</div>\n        <div class="btn-list">\n          <button class="btn btn-primary">Exporter PDF</button>\n          <button class="btn btn-outline-primary">Exporter Excel</button>\n        </div>\n      </div>\n      <div class="card-body">\n        <div class="row g-3">\n          <div class="col-sm-6 col-lg-3" *ngFor="let kpi of kpis">\n            <div class="card shadow-none border text-center p-3">\n              <span class="badge mb-2" [ngClass]="kpi.badge">{{ kpi.label }}</span>\n              <div class="fs-24 fw-semibold">{{ kpi.value }}</div>\n            </div>\n          </div>\n        </div>\n        <div class="mt-4">\n          <h6 class="fw-semibold mb-3">Exports rapides</h6>\n          <ul class="list-group">\n            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let report of reports">\n              <span>{{ report.name }}</span>\n              <span class="badge bg-primary-transparent">{{ report.format }}</span>\n            </li>\n          </ul>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HrReportsPage, { className: "HrReportsPage", filePath: "src/app/modules/reports/pages/hr-reports/hr-reports.ts", lineNumber: 10 });
})();
export {
  HrReportsPage
};
//# sourceMappingURL=chunk-HKVQ6EJE.js.map
