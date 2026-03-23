import {
  GridJsAngularComponent
} from "./chunk-H6VXTY66.js";
import {
  ApiClientService,
  readField,
  toStringValue
} from "./chunk-2RQ7HY24.js";
import {
  API_ENDPOINTS
} from "./chunk-7C46ZOJO.js";
import "./chunk-BMX4STFJ.js";
import {
  Component,
  Injectable,
  catchError,
  inject,
  map,
  of,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵinject,
  ɵɵproperty,
  ɵɵtext
} from "./chunk-MOIGQQUQ.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-KWSTWQNB.js";

// src/app/modules/discipline/discipline.service.ts
var DisciplineService = class _DisciplineService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getCases() {
    return this.apiClient.get(API_ENDPOINTS.discipline.cases).pipe(catchError(() => of([])), map((items) => items.map((dto) => ({
      reference: toStringValue(readField(dto, ["reference", "caseRef", "case_ref"], "")),
      agent: toStringValue(readField(dto, ["agent", "agentName", "agent_name"], "")),
      infraction: toStringValue(readField(dto, ["infraction", "reason"], "")),
      openedOn: toStringValue(readField(dto, ["openedOn", "opened_on"], "")),
      status: toStringValue(readField(dto, ["status"], "")),
      sanction: readField(dto, ["sanction"], void 0)
    }))));
  }
  static \u0275fac = function DisciplineService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DisciplineService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DisciplineService, factory: _DisciplineService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DisciplineService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();

// src/app/modules/discipline/pages/discipline-cases/discipline-cases.ts
var DisciplineCasesPage = class _DisciplineCasesPage {
  disciplineService = inject(DisciplineService);
  gridConfig = {
    columns: ["R\xE9f\xE9rence", "Agent", "Motif", "Ouvert le", "Statut", "Sanction"],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: []
  };
  ngOnInit() {
    this.disciplineService.getCases().subscribe((items) => {
      this.gridConfig = __spreadProps(__spreadValues({}, this.gridConfig), {
        data: items.map((c) => [
          c.reference,
          c.agent,
          c.infraction,
          c.openedOn,
          c.status,
          c.sanction || "\u2014"
        ])
      });
    });
  }
  static \u0275fac = function DisciplineCasesPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DisciplineCasesPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DisciplineCasesPage, selectors: [["app-discipline-cases"]], decls: 13, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [3, "config"]], template: function DisciplineCasesPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Dossiers disciplinaires");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Nouveau dossier");
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
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DisciplineCasesPage, [{
    type: Component,
    args: [{ selector: "app-discipline-cases", standalone: true, imports: [GridJsAngularComponent], template: '<div class="row row-sm">\n  <div class="col-xl-12">\n    <div class="card custom-card">\n      <div class="card-header justify-content-between">\n        <div class="card-title">Dossiers disciplinaires</div>\n        <div class="btn-list">\n          <button class="btn btn-primary">Nouveau dossier</button>\n          <button class="btn btn-outline-primary">Exporter</button>\n        </div>\n      </div>\n      <div class="card-body">\n        <gridjs-angular [config]="gridConfig"></gridjs-angular>\n      </div>\n    </div>\n  </div>\n</div>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DisciplineCasesPage, { className: "DisciplineCasesPage", filePath: "src/app/modules/discipline/pages/discipline-cases/discipline-cases.ts", lineNumber: 11 });
})();
export {
  DisciplineCasesPage
};
//# sourceMappingURL=chunk-OHEAIOJS.js.map
