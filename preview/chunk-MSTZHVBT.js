import {
  OrganizationService
} from "./chunk-QNNNPGXI.js";
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

// src/app/modules/organization/pages/vacant-positions/vacant-positions.ts
var VacantPositionsPage = class _VacantPositionsPage {
  organizationService = inject(OrganizationService);
  gridConfig = {
    columns: ["Code", "Structure", "Intitul\xE9", "Grade", "Ouvert depuis", "Priorit\xE9"],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: []
  };
  ngOnInit() {
    this.organizationService.getVacantPositions().subscribe((items) => {
      this.gridConfig = __spreadProps(__spreadValues({}, this.gridConfig), {
        data: items.map((p) => [
          p.code,
          p.structure,
          p.title,
          p.grade,
          p.openedOn,
          p.priority
        ])
      });
    });
  }
  static \u0275fac = function VacantPositionsPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _VacantPositionsPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _VacantPositionsPage, selectors: [["app-vacant-positions"]], decls: 13, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [3, "config"]], template: function VacantPositionsPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Postes vacants");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Publier une offre");
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
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(VacantPositionsPage, [{
    type: Component,
    args: [{ selector: "app-vacant-positions", standalone: true, imports: [GridJsAngularComponent], template: '<div class="row row-sm">\n  <div class="col-xl-12">\n    <div class="card custom-card">\n      <div class="card-header justify-content-between">\n        <div class="card-title">Postes vacants</div>\n        <div class="btn-list">\n          <button class="btn btn-primary">Publier une offre</button>\n          <button class="btn btn-outline-primary">Exporter</button>\n        </div>\n      </div>\n      <div class="card-body">\n        <gridjs-angular [config]="gridConfig"></gridjs-angular>\n      </div>\n    </div>\n  </div>\n</div>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(VacantPositionsPage, { className: "VacantPositionsPage", filePath: "src/app/modules/organization/pages/vacant-positions/vacant-positions.ts", lineNumber: 11 });
})();
export {
  VacantPositionsPage
};
//# sourceMappingURL=chunk-MSTZHVBT.js.map
