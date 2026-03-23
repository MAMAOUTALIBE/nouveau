import {
  Component,
  Input,
  input,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-MOIGQQUQ.js";
import "./chunk-KWSTWQNB.js";

// src/app/modules/shared/feature-placeholder/feature-placeholder.ts
var FeaturePlaceholder = class _FeaturePlaceholder {
  title = input("En construction", ...ngDevMode ? [{ debugName: "title" }] : []);
  static \u0275fac = function FeaturePlaceholder_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _FeaturePlaceholder)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FeaturePlaceholder, selectors: [["app-feature-placeholder"]], inputs: { title: [1, "title"] }, decls: 6, vars: 1, consts: [[1, "card"], [1, "card-body", "text-center", "py-5"], [1, "mb-2"], [1, "text-muted", "mb-0"]], template: function FeaturePlaceholder_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275domElementStart(0, "div", 0)(1, "div", 1)(2, "h5", 2);
      \u0275\u0275text(3);
      \u0275\u0275domElementEnd();
      \u0275\u0275domElementStart(4, "p", 3);
      \u0275\u0275text(5, "Cette fonctionnalit\xE9 sera livr\xE9e dans une prochaine it\xE9ration.");
      \u0275\u0275domElementEnd()()();
    }
    if (rf & 2) {
      \u0275\u0275advance(3);
      \u0275\u0275textInterpolate(ctx.title());
    }
  }, encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FeaturePlaceholder, [{
    type: Component,
    args: [{
      selector: "app-feature-placeholder",
      standalone: true,
      template: `
    <div class="card">
      <div class="card-body text-center py-5">
        <h5 class="mb-2">{{ title() }}</h5>
        <p class="text-muted mb-0">Cette fonctionnalit\xE9 sera livr\xE9e dans une prochaine it\xE9ration.</p>
      </div>
    </div>
  `
    }]
  }], null, { title: [{ type: Input, args: [{ isSignal: true, alias: "title", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FeaturePlaceholder, { className: "FeaturePlaceholder", filePath: "src/app/modules/shared/feature-placeholder/feature-placeholder.ts", lineNumber: 15 });
})();
export {
  FeaturePlaceholder
};
//# sourceMappingURL=chunk-P6LD4TTJ.js.map
