import {
  RecruitmentService
} from "./chunk-YRA7YT4V.js";
import "./chunk-2RQ7HY24.js";
import "./chunk-7C46ZOJO.js";
import {
  CommonModule,
  NgClass,
  NgForOf
} from "./chunk-BMX4STFJ.js";
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
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-MOIGQQUQ.js";
import "./chunk-KWSTWQNB.js";

// src/app/modules/recruitment/pages/onboarding/onboarding.ts
function OnboardingPage_div_13_li_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "li", 21);
    \u0275\u0275element(1, "i", 22);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const step_r1 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", step_r1, " ");
  }
}
function OnboardingPage_div_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11)(1, "div", 12)(2, "div", 13)(3, "div")(4, "div", 14);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 15);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "span", 16);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "div", 8)(11, "ul", 17);
    \u0275\u0275template(12, OnboardingPage_div_13_li_12_Template, 3, 1, "li", 18);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "div", 19)(14, "span", 20);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const item_r2 = ctx.$implicit;
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(item_r2.agent);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(item_r2.position);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(item_r2.startDate);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngForOf", item_r2.checklist);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", item_r2.status === "Valid\xE9" ? "bg-success-transparent" : "bg-warning-transparent");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", item_r2.status, " ");
  }
}
var OnboardingPage = class _OnboardingPage {
  recruitmentService = inject(RecruitmentService);
  items = [];
  ngOnInit() {
    this.recruitmentService.getOnboarding().subscribe((items) => this.items = items);
  }
  static \u0275fac = function OnboardingPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _OnboardingPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _OnboardingPage, selectors: [["app-onboarding"]], decls: 14, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [1, "row", "g-3"], ["class", "col-xl-6", 4, "ngFor", "ngForOf"], [1, "col-xl-6"], [1, "card", "shadow-none", "border", "mb-0"], [1, "card-header", "d-flex", "justify-content-between", "align-items-center"], [1, "fw-semibold"], [1, "text-muted", "fs-12"], [1, "badge", "bg-primary-transparent"], [1, "list-unstyled", "mb-0"], ["class", "d-flex align-items-center mb-2", 4, "ngFor", "ngForOf"], [1, "card-footer"], [1, "badge", 3, "ngClass"], [1, "d-flex", "align-items-center", "mb-2"], [1, "ri-check-line", "text-success", "me-2"]], template: function OnboardingPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Parcours d'int\xE9gration");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Planifier une arriv\xE9e");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "button", 7);
      \u0275\u0275text(10, "Exporter");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "div", 8)(12, "div", 9);
      \u0275\u0275template(13, OnboardingPage_div_13_Template, 16, 6, "div", 10);
      \u0275\u0275elementEnd()()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(13);
      \u0275\u0275property("ngForOf", ctx.items);
    }
  }, dependencies: [CommonModule, NgClass, NgForOf], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(OnboardingPage, [{
    type: Component,
    args: [{ selector: "app-onboarding", standalone: true, imports: [CommonModule], template: `<div class="row row-sm">
  <div class="col-xl-12">
    <div class="card custom-card">
      <div class="card-header justify-content-between">
        <div class="card-title">Parcours d'int\xE9gration</div>
        <div class="btn-list">
          <button class="btn btn-primary">Planifier une arriv\xE9e</button>
          <button class="btn btn-outline-primary">Exporter</button>
        </div>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-xl-6" *ngFor="let item of items">
            <div class="card shadow-none border mb-0">
              <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                  <div class="fw-semibold">{{ item.agent }}</div>
                  <div class="text-muted fs-12">{{ item.position }}</div>
                </div>
                <span class="badge bg-primary-transparent">{{ item.startDate }}</span>
              </div>
              <div class="card-body">
                <ul class="list-unstyled mb-0">
                  <li *ngFor="let step of item.checklist" class="d-flex align-items-center mb-2">
                    <i class="ri-check-line text-success me-2"></i> {{ step }}
                  </li>
                </ul>
              </div>
              <div class="card-footer">
                <span class="badge" [ngClass]="item.status === 'Valid\xE9' ? 'bg-success-transparent' : 'bg-warning-transparent'">
                  {{ item.status }}
                </span>
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
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(OnboardingPage, { className: "OnboardingPage", filePath: "src/app/modules/recruitment/pages/onboarding/onboarding.ts", lineNumber: 11 });
})();
export {
  OnboardingPage
};
//# sourceMappingURL=chunk-TOXQ6HGH.js.map
