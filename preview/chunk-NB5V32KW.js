import {
  CommonModule,
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

// src/app/modules/self-service/manager-portal.ts
function ManagerPortalPage_div_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11)(1, "div", 12)(2, "div", 13);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 14);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "button", 15);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const item_r1 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(item_r1.label);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(item_r1.desc);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(item_r1.cta);
  }
}
var ManagerPortalPage = class _ManagerPortalPage {
  quick = [
    { label: "Valider absences", desc: "Demandes en attente", cta: "Traiter" },
    { label: "Suivi performance", desc: "\xC9valuations de l\u2019\xE9quipe", cta: "Consulter" },
    { label: "Suivi pr\xE9sence", desc: "Calendrier absences", cta: "Voir" }
  ];
  static \u0275fac = function ManagerPortalPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ManagerPortalPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ManagerPortalPage, selectors: [["app-manager-portal"]], decls: 14, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [1, "row", "g-3"], ["class", "col-md-4", 4, "ngFor", "ngForOf"], [1, "col-md-4"], [1, "card", "shadow-none", "border", "p-3"], [1, "fw-semibold", "mb-1"], [1, "text-muted", "fs-12", "mb-2"], [1, "btn", "btn-sm", "btn-primary-light"]], template: function ManagerPortalPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Portail manager");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Valider");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "button", 7);
      \u0275\u0275text(10, "Exports \xE9quipe");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "div", 8)(12, "div", 9);
      \u0275\u0275template(13, ManagerPortalPage_div_13_Template, 8, 3, "div", 10);
      \u0275\u0275elementEnd()()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(13);
      \u0275\u0275property("ngForOf", ctx.quick);
    }
  }, dependencies: [CommonModule, NgForOf], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ManagerPortalPage, [{
    type: Component,
    args: [{
      selector: "app-manager-portal",
      standalone: true,
      imports: [CommonModule],
      template: `
    <div class="row row-sm">
      <div class="col-xl-12">
        <div class="card custom-card">
          <div class="card-header justify-content-between">
            <div class="card-title">Portail manager</div>
            <div class="btn-list">
              <button class="btn btn-primary">Valider</button>
              <button class="btn btn-outline-primary">Exports \xE9quipe</button>
            </div>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4" *ngFor="let item of quick">
                <div class="card shadow-none border p-3">
                  <div class="fw-semibold mb-1">{{ item.label }}</div>
                  <div class="text-muted fs-12 mb-2">{{ item.desc }}</div>
                  <button class="btn btn-sm btn-primary-light">{{ item.cta }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
    }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ManagerPortalPage, { className: "ManagerPortalPage", filePath: "src/app/modules/self-service/manager-portal.ts", lineNumber: 35 });
})();
export {
  ManagerPortalPage
};
//# sourceMappingURL=chunk-NB5V32KW.js.map
