import {
  CareersService
} from "./chunk-ZPIDEWWO.js";
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

// src/app/modules/careers/pages/secondments/secondments.ts
var SecondmentsPage = class _SecondmentsPage {
  careersService = inject(CareersService);
  gridConfig = {
    columns: ["R\xE9f\xE9rence", "Agent", "Origine", "Accueil", "Date effet", "Statut"],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: []
  };
  ngOnInit() {
    this.careersService.getMovesByType("D\xE9tachement").subscribe((items) => {
      this.gridConfig = __spreadProps(__spreadValues({}, this.gridConfig), {
        data: items.map((m) => [m.reference, m.agent, m.from || "\u2014", m.to, m.effectiveDate, m.status])
      });
    });
  }
  static \u0275fac = function SecondmentsPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SecondmentsPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SecondmentsPage, selectors: [["app-secondments"]], decls: 13, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [3, "config"]], template: function SecondmentsPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "D\xE9tachements");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Nouveau d\xE9tachement");
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
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SecondmentsPage, [{
    type: Component,
    args: [{ selector: "app-secondments", standalone: true, imports: [GridJsAngularComponent], template: '<div class="row row-sm">\n  <div class="col-xl-12">\n    <div class="card custom-card">\n      <div class="card-header justify-content-between">\n        <div class="card-title">D\xE9tachements</div>\n        <div class="btn-list">\n          <button class="btn btn-primary">Nouveau d\xE9tachement</button>\n          <button class="btn btn-outline-primary">Exporter</button>\n        </div>\n      </div>\n      <div class="card-body">\n        <gridjs-angular [config]="gridConfig"></gridjs-angular>\n      </div>\n    </div>\n  </div>\n</div>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SecondmentsPage, { className: "SecondmentsPage", filePath: "src/app/modules/careers/pages/secondments/secondments.ts", lineNumber: 11 });
})();
export {
  SecondmentsPage
};
//# sourceMappingURL=chunk-TQXBVJKW.js.map
