import {
  LeaveService
} from "./chunk-6OCEZ4JL.js";
import "./chunk-2RQ7HY24.js";
import "./chunk-7C46ZOJO.js";
import {
  CommonModule,
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
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-MOIGQQUQ.js";
import "./chunk-KWSTWQNB.js";

// src/app/modules/leave/pages/leave-balances/leave-balances.ts
function LeaveBalancesPage_tr_27_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 12);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "td")(8, "span", 13);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "td", 14)(11, "div", 15);
    \u0275\u0275element(12, "div", 16);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const balance_r1 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(balance_r1.type);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", balance_r1.allocated, " j");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", balance_r1.consumed, " j");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", balance_r1.remaining, " j");
    \u0275\u0275advance(3);
    \u0275\u0275styleProp("width", ctx_r1.percent(balance_r1.allocated, balance_r1.consumed), "%");
  }
}
var LeaveBalancesPage = class _LeaveBalancesPage {
  leaveService = inject(LeaveService);
  balances = [];
  ngOnInit() {
    this.leaveService.getBalances().subscribe((items) => this.balances = items);
  }
  percent(allocated, consumed) {
    if (!allocated)
      return 0;
    return Math.round(consumed / allocated * 100);
  }
  static \u0275fac = function LeaveBalancesPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _LeaveBalancesPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LeaveBalancesPage, selectors: [["app-leave-balances"]], decls: 28, vars: 1, consts: [[1, "row", "row-sm"], [1, "col-xl-12"], [1, "card", "custom-card"], [1, "card-header", "justify-content-between"], [1, "card-title"], [1, "btn-list"], [1, "btn", "btn-primary"], [1, "btn", "btn-outline-primary"], [1, "card-body"], [1, "table-responsive"], [1, "table", "text-nowrap"], [4, "ngFor", "ngForOf"], [1, "fw-semibold"], [1, "badge", "bg-light", "text-default"], [1, "w-25"], [1, "progress", "progress-sm"], ["role", "progressbar", 1, "progress-bar"]], template: function LeaveBalancesPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4);
      \u0275\u0275text(5, "Soldes de cong\xE9s");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(6, "div", 5)(7, "button", 6);
      \u0275\u0275text(8, "Mettre \xE0 jour les droits");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(9, "button", 7);
      \u0275\u0275text(10, "Exporter");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "div", 8)(12, "div", 9)(13, "table", 10)(14, "thead")(15, "tr")(16, "th");
      \u0275\u0275text(17, "Type");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(18, "th");
      \u0275\u0275text(19, "Allou\xE9");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(20, "th");
      \u0275\u0275text(21, "Consomm\xE9");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(22, "th");
      \u0275\u0275text(23, "Restant");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(24, "th");
      \u0275\u0275text(25, "Progression");
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(26, "tbody");
      \u0275\u0275template(27, LeaveBalancesPage_tr_27_Template, 13, 6, "tr", 11);
      \u0275\u0275elementEnd()()()()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(27);
      \u0275\u0275property("ngForOf", ctx.balances);
    }
  }, dependencies: [CommonModule, NgForOf], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LeaveBalancesPage, [{
    type: Component,
    args: [{ selector: "app-leave-balances", standalone: true, imports: [CommonModule], template: '<div class="row row-sm">\n  <div class="col-xl-12">\n    <div class="card custom-card">\n      <div class="card-header justify-content-between">\n        <div class="card-title">Soldes de cong\xE9s</div>\n        <div class="btn-list">\n          <button class="btn btn-primary">Mettre \xE0 jour les droits</button>\n          <button class="btn btn-outline-primary">Exporter</button>\n        </div>\n      </div>\n      <div class="card-body">\n        <div class="table-responsive">\n          <table class="table text-nowrap">\n            <thead>\n              <tr>\n                <th>Type</th>\n                <th>Allou\xE9</th>\n                <th>Consomm\xE9</th>\n                <th>Restant</th>\n                <th>Progression</th>\n              </tr>\n            </thead>\n            <tbody>\n              <tr *ngFor="let balance of balances">\n                <td class="fw-semibold">{{ balance.type }}</td>\n                <td>{{ balance.allocated }} j</td>\n                <td>{{ balance.consumed }} j</td>\n                <td>\n                  <span class="badge bg-light text-default">{{ balance.remaining }} j</span>\n                </td>\n                <td class="w-25">\n                  <div class="progress progress-sm">\n                    <div class="progress-bar" role="progressbar" [style.width.%]="percent(balance.allocated, balance.consumed)"></div>\n                  </div>\n                </td>\n              </tr>\n            </tbody>\n          </table>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n' }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LeaveBalancesPage, { className: "LeaveBalancesPage", filePath: "src/app/modules/leave/pages/leave-balances/leave-balances.ts", lineNumber: 11 });
})();
export {
  LeaveBalancesPage
};
//# sourceMappingURL=chunk-ODSR6AGT.js.map
