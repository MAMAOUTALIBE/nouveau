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

// src/app/modules/admin/pages/admin-roles/admin-roles.ts
var AdminRolesPage = class _AdminRolesPage {
  adminService = inject(AdminService);
  gridConfig = {
    columns: ["R\xF4le", "Description", "Permissions"],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: []
  };
  ngOnInit() {
    this.adminService.getRoles().subscribe((items) => {
      this.gridConfig = __spreadProps(__spreadValues({}, this.gridConfig), {
        data: items.map((r) => [r.name, r.description, r.permissions])
      });
    });
  }
  static \u0275fac = function AdminRolesPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AdminRolesPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AdminRolesPage, selectors: [["app-admin-roles"]], decls: 13, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [3, "config"]], template: function AdminRolesPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "R\xF4les");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Cr\xE9er un r\xF4le");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "button", 7);
      \u0275\u0275text(10, "Exporter");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "div", 8);
      \u0275\u0275element(12, "gridjs-angular", 9);
      \u0275\u0275elementEnd()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(12);
      \u0275\u0275property("config", ctx.gridConfig);
    }
  }, dependencies: [GridJsAngularComponent], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AdminRolesPage, [{
    type: Component,
    args: [{ selector: "app-admin-roles", standalone: true, imports: [GridJsAngularComponent], template: '<div class="row row-sm">\n  <div class="col-xl-12">\n    <div class="card custom-card">\n      <div class="card-header justify-content-between">\n        <div class="card-title">R\xF4les</div>\n        <div class="btn-list">\n          <button class="btn btn-primary">Cr\xE9er un r\xF4le</button>\n          <button class="btn btn-outline-primary">Exporter</button>\n        </div>\n      </div>\n      <div class="card-body">\n        <gridjs-angular [config]="gridConfig"></gridjs-angular>\n      </div>\n    </div>\n  </div>\n</div>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AdminRolesPage, { className: "AdminRolesPage", filePath: "src/app/modules/admin/pages/admin-roles/admin-roles.ts", lineNumber: 11 });
})();
export {
  AdminRolesPage
};
//# sourceMappingURL=chunk-Q5E2MRBX.js.map
