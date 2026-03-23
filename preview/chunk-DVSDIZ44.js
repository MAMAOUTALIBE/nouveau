import {
  AdminService
} from "./chunk-BATCOWBN.js";
import {
  GridJsAngularComponent
} from "./chunk-H6VXTY66.js";
import "./chunk-2RQ7HY24.js";
import "./chunk-7C46ZOJO.js";
import "./chunk-BMX4STFJ.js";
import {
  Component,
  inject,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵproperty,
  ɵɵtext
} from "./chunk-MOIGQQUQ.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-KWSTWQNB.js";

// src/app/modules/admin/pages/admin-audit/admin-audit.ts
var AdminAuditPage = class _AdminAuditPage {
  adminService = inject(AdminService);
  gridConfig = {
    columns: ["Date", "Utilisateur", "Action", "Cible"],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: []
  };
  ngOnInit() {
    this.adminService.getAudit().subscribe((items) => {
      this.gridConfig = __spreadProps(__spreadValues({}, this.gridConfig), {
        data: items.map((a) => [a.date, a.user, a.action, a.target])
      });
    });
  }
  static \u0275fac = function AdminAuditPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AdminAuditPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AdminAuditPage, selectors: [["app-admin-audit"]], decls: 11, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [3, "config"]], template: function AdminAuditPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Journal d'audit");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Exporter");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(9, "div", 7);
      \u0275\u0275element(10, "gridjs-angular", 8);
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(10);
      \u0275\u0275property("config", ctx.gridConfig);
    }
  }, dependencies: [GridJsAngularComponent], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AdminAuditPage, [{
    type: Component,
    args: [{ selector: "app-admin-audit", standalone: true, imports: [GridJsAngularComponent], template: `<div class="row row-sm">
  <div class="col-xl-12">
    <div class="card custom-card">
      <div class="card-header justify-content-between">
        <div class="card-title">Journal d'audit</div>
        <div class="btn-list">
          <button class="btn btn-outline-primary">Exporter</button>
        </div>
      </div>
      <div class="card-body">
        <gridjs-angular [config]="gridConfig"></gridjs-angular>
      </div>
    </div>
  </div>
</div>
` }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AdminAuditPage, { className: "AdminAuditPage", filePath: "src/app/modules/admin/pages/admin-audit/admin-audit.ts", lineNumber: 11 });
})();
export {
  AdminAuditPage
};
//# sourceMappingURL=chunk-DVSDIZ44.js.map
