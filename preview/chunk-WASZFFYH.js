import {
  WorkflowsService
} from "./chunk-GIHGPKVU.js";
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

// src/app/modules/workflows/pages/workflow-definitions/workflow-definitions.ts
var WorkflowDefinitionsPage = class _WorkflowDefinitionsPage {
  workflowsService = inject(WorkflowsService);
  gridConfig = {
    columns: ["Code", "Nom", "\xC9tapes", "Usage", "Statut"],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: []
  };
  ngOnInit() {
    this.workflowsService.getDefinitions().subscribe((items) => {
      this.gridConfig = __spreadProps(__spreadValues({}, this.gridConfig), {
        data: items.map((d) => [d.code, d.name, d.steps, d.usedFor, d.status])
      });
    });
  }
  static \u0275fac = function WorkflowDefinitionsPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _WorkflowDefinitionsPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _WorkflowDefinitionsPage, selectors: [["app-workflow-definitions"]], decls: 13, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [3, "config"]], template: function WorkflowDefinitionsPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Workflows");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Nouveau workflow");
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
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(WorkflowDefinitionsPage, [{
    type: Component,
    args: [{ selector: "app-workflow-definitions", standalone: true, imports: [GridJsAngularComponent], template: '<div class="row row-sm">\n  <div class="col-xl-12">\n    <div class="card custom-card">\n      <div class="card-header justify-content-between">\n        <div class="card-title">Workflows</div>\n        <div class="btn-list">\n          <button class="btn btn-primary">Nouveau workflow</button>\n          <button class="btn btn-outline-primary">Exporter</button>\n        </div>\n      </div>\n      <div class="card-body">\n        <gridjs-angular [config]="gridConfig"></gridjs-angular>\n      </div>\n    </div>\n  </div>\n</div>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(WorkflowDefinitionsPage, { className: "WorkflowDefinitionsPage", filePath: "src/app/modules/workflows/pages/workflow-definitions/workflow-definitions.ts", lineNumber: 11 });
})();
export {
  WorkflowDefinitionsPage
};
//# sourceMappingURL=chunk-WASZFFYH.js.map
