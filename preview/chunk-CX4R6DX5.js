import {
  PerformanceService
} from "./chunk-6UQPU5YR.js";
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

// src/app/modules/performance/pages/perf-campaigns/perf-campaigns.ts
var PerfCampaignsPage = class _PerfCampaignsPage {
  performanceService = inject(PerformanceService);
  gridConfig = {
    columns: ["Code", "Intitul\xE9", "P\xE9riode", "Population", "Statut"],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: []
  };
  ngOnInit() {
    this.performanceService.getCampaigns().subscribe((items) => {
      this.gridConfig = __spreadProps(__spreadValues({}, this.gridConfig), {
        data: items.map((c) => [c.code, c.title, c.period, c.population, c.status])
      });
    });
  }
  static \u0275fac = function PerfCampaignsPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _PerfCampaignsPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _PerfCampaignsPage, selectors: [["app-perf-campaigns"]], decls: 13, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [3, "config"]], template: function PerfCampaignsPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Campagnes d'\xE9valuation");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Nouvelle campagne");
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
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PerfCampaignsPage, [{
    type: Component,
    args: [{ selector: "app-perf-campaigns", standalone: true, imports: [GridJsAngularComponent], template: `<div class="row row-sm">
  <div class="col-xl-12">
    <div class="card custom-card">
      <div class="card-header justify-content-between">
        <div class="card-title">Campagnes d'\xE9valuation</div>
        <div class="btn-list">
          <button class="btn btn-primary">Nouvelle campagne</button>
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
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(PerfCampaignsPage, { className: "PerfCampaignsPage", filePath: "src/app/modules/performance/pages/perf-campaigns/perf-campaigns.ts", lineNumber: 11 });
})();
export {
  PerfCampaignsPage
};
//# sourceMappingURL=chunk-CX4R6DX5.js.map
