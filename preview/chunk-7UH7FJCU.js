import {
  FormsModule,
  ReactiveFormsModule
} from "./chunk-U53XDZ2X.js";
import {
  CommonModule
} from "./chunk-BMX4STFJ.js";
import {
  Component,
  ContentChild,
  Input,
  Output,
  input,
  output,
  setClassMetadata,
  ɵsetClassDebugInfo,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵdomListener,
  ɵɵdomProperty,
  ɵɵgetCurrentView,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-MOIGQQUQ.js";

// src/app/@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables.ts
var _c0 = ["footer"];
var _c1 = ["*", [["", "footer", ""]]];
var _c2 = ["*", "[footer]"];
function SpkReusableTables_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "caption");
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.captiontitle());
  }
}
function SpkReusableTables_Conditional_2_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275domElementStart(0, "th")(1, "input", 1);
    \u0275\u0275domListener("change", function SpkReusableTables_Conditional_2_Conditional_2_Template_input_change_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.onToggleSelectAll($event));
    });
    \u0275\u0275domElementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r0.checkboxClass());
    \u0275\u0275advance();
    \u0275\u0275classMap(`form-check-input ${ctx_r0.checkboxinputClass()}`);
    \u0275\u0275domProperty("checked", ctx_r0.allTasksChecked);
  }
}
function SpkReusableTables_Conditional_2_For_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "th");
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const column_r3 = ctx.$implicit;
    \u0275\u0275classMap(column_r3.tableHeadColumn);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(column_r3.header);
  }
}
function SpkReusableTables_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "thead")(1, "tr");
    \u0275\u0275conditionalCreate(2, SpkReusableTables_Conditional_2_Conditional_2_Template, 2, 5, "th", 0);
    \u0275\u0275repeaterCreate(3, SpkReusableTables_Conditional_2_For_4_Template, 2, 3, "th", 0, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275domElementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r0.tableHead());
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r0.trHeadClass());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r0.showCheckbox() ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r0.columns());
  }
}
function SpkReusableTables_Conditional_5_Conditional_1_For_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "th");
    \u0275\u0275text(1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const column_r4 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(column_r4);
  }
}
function SpkReusableTables_Conditional_5_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, SpkReusableTables_Conditional_5_Conditional_1_For_1_Template, 2, 1, "th", null, \u0275\u0275repeaterTrackByIndex);
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275repeater(ctx_r0.footerData());
  }
}
function SpkReusableTables_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275domElementStart(0, "tfoot");
    \u0275\u0275conditionalCreate(1, SpkReusableTables_Conditional_5_Conditional_1_Template, 2, 0);
    \u0275\u0275projection(2, 1);
    \u0275\u0275domElementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275classMap(ctx_r0.tableFooter());
    \u0275\u0275advance();
    \u0275\u0275conditional(ctx_r0.footerData() ? 1 : -1);
  }
}
var SpkReusableTables = class _SpkReusableTables {
  columns = input([], ...ngDevMode ? [{ debugName: "columns" }] : []);
  tableClass = input("", ...ngDevMode ? [{ debugName: "tableClass" }] : []);
  tableHead = input("", ...ngDevMode ? [{ debugName: "tableHead" }] : []);
  trHeadClass = input("", ...ngDevMode ? [{ debugName: "trHeadClass" }] : []);
  tableFooter = input("", ...ngDevMode ? [{ debugName: "tableFooter" }] : []);
  tableBody = input("", ...ngDevMode ? [{ debugName: "tableBody" }] : []);
  trClass = input("", ...ngDevMode ? [{ debugName: "trClass" }] : []);
  checkboxClass = input("", ...ngDevMode ? [{ debugName: "checkboxClass" }] : []);
  checkboxinputClass = input("", ...ngDevMode ? [{ debugName: "checkboxinputClass" }] : []);
  tableFoot = input("", ...ngDevMode ? [{ debugName: "tableFoot" }] : []);
  tableHeadColumn = input("", ...ngDevMode ? [{ debugName: "tableHeadColumn" }] : []);
  captionbeforehead = input(false, ...ngDevMode ? [{ debugName: "captionbeforehead" }] : []);
  captiontitle = input("", ...ngDevMode ? [{ debugName: "captiontitle" }] : []);
  data = input([], ...ngDevMode ? [{ debugName: "data" }] : []);
  title = input([], ...ngDevMode ? [{ debugName: "title" }] : []);
  footerData = input([], ...ngDevMode ? [{ debugName: "footerData" }] : []);
  showFooter = input(false, ...ngDevMode ? [{ debugName: "showFooter" }] : []);
  showCheckbox = input(false, ...ngDevMode ? [{ debugName: "showCheckbox" }] : []);
  rows = input([], ...ngDevMode ? [{ debugName: "rows" }] : []);
  footerContent;
  allTasksChecked;
  tableData;
  toggleSelectAll = output();
  openDetails = output();
  onToggleSelectAll(event) {
    this.toggleSelectAll.emit(event.target.checked);
  }
  toggleRowChecked(row) {
    row.checked = !row.checked;
    this.allTasksChecked = this.data().every((row2) => row2.checked);
  }
  updateSelectAllCheckbox() {
    this.allTasksChecked = this.data().every((row) => row.checked);
  }
  static \u0275fac = function SpkReusableTables_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SpkReusableTables)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SpkReusableTables, selectors: [["spk-reusable-tables"]], contentQueries: function SpkReusableTables_ContentQueries(rf, ctx, dirIndex) {
    if (rf & 1) {
      \u0275\u0275contentQuery(dirIndex, _c0, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.footerContent = _t.first);
    }
  }, inputs: { columns: [1, "columns"], tableClass: [1, "tableClass"], tableHead: [1, "tableHead"], trHeadClass: [1, "trHeadClass"], tableFooter: [1, "tableFooter"], tableBody: [1, "tableBody"], trClass: [1, "trClass"], checkboxClass: [1, "checkboxClass"], checkboxinputClass: [1, "checkboxinputClass"], tableFoot: [1, "tableFoot"], tableHeadColumn: [1, "tableHeadColumn"], captionbeforehead: [1, "captionbeforehead"], captiontitle: [1, "captiontitle"], data: [1, "data"], title: [1, "title"], footerData: [1, "footerData"], showFooter: [1, "showFooter"], showCheckbox: [1, "showCheckbox"], rows: [1, "rows"] }, outputs: { toggleSelectAll: "toggleSelectAll", openDetails: "openDetails" }, ngContentSelectors: _c2, decls: 6, vars: 7, consts: [[3, "class"], ["type", "checkbox", "aria-label", "Select all", 3, "change", "checked"]], template: function SpkReusableTables_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275projectionDef(_c1);
      \u0275\u0275domElementStart(0, "table");
      \u0275\u0275conditionalCreate(1, SpkReusableTables_Conditional_1_Template, 2, 1, "caption");
      \u0275\u0275conditionalCreate(2, SpkReusableTables_Conditional_2_Template, 5, 5, "thead", 0);
      \u0275\u0275domElementStart(3, "tbody");
      \u0275\u0275projection(4);
      \u0275\u0275domElementEnd();
      \u0275\u0275conditionalCreate(5, SpkReusableTables_Conditional_5_Template, 3, 3, "tfoot", 0);
      \u0275\u0275domElementEnd();
    }
    if (rf & 2) {
      \u0275\u0275classMap(ctx.tableClass());
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.captionbeforehead() ? 1 : -1);
      \u0275\u0275advance();
      \u0275\u0275conditional(ctx.columns() ? 2 : -1);
      \u0275\u0275advance();
      \u0275\u0275classMap(ctx.tableBody());
      \u0275\u0275advance(2);
      \u0275\u0275conditional(ctx.showFooter() ? 5 : -1);
    }
  }, dependencies: [FormsModule, ReactiveFormsModule, CommonModule], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SpkReusableTables, [{
    type: Component,
    args: [{ selector: "spk-reusable-tables", standalone: true, imports: [FormsModule, ReactiveFormsModule, CommonModule], template: '<table class="{{tableClass()}}">\r\n  @if (captionbeforehead()) {\r\n    <caption>{{captiontitle()}}</caption>\r\n  }\r\n  @if(columns()){\r\n    <thead class="{{tableHead()}}">\r\n      <tr [class]="trHeadClass()">\r\n        @if(showCheckbox()){\r\n        <th [class]="checkboxClass()">\r\n          <input [class]="`form-check-input ${checkboxinputClass()}`" type="checkbox" [checked]="allTasksChecked" (change)="onToggleSelectAll($event)"\r\n            aria-label="Select all" />\r\n        </th>\r\n        }\r\n        @for(column of columns(); track $index){\r\n        <th [class]="column.tableHeadColumn">{{ column.header }}</th>\r\n        }\r\n      </tr>\r\n    </thead>\r\n  }\r\n\r\n  <tbody class="{{tableBody()}}">\r\n    <ng-content></ng-content>\r\n  </tbody>\r\n\r\n  @if(showFooter()){\r\n  <tfoot [class]="tableFooter()">\r\n    @if(footerData()){\r\n    @for(column of footerData(); track $index){\r\n    <th>{{ column }}</th>\r\n    }\r\n    }\r\n    <ng-content select="[footer]"></ng-content>\r\n  </tfoot>\r\n  }\r\n</table>\r\n' }]
  }], null, { columns: [{ type: Input, args: [{ isSignal: true, alias: "columns", required: false }] }], tableClass: [{ type: Input, args: [{ isSignal: true, alias: "tableClass", required: false }] }], tableHead: [{ type: Input, args: [{ isSignal: true, alias: "tableHead", required: false }] }], trHeadClass: [{ type: Input, args: [{ isSignal: true, alias: "trHeadClass", required: false }] }], tableFooter: [{ type: Input, args: [{ isSignal: true, alias: "tableFooter", required: false }] }], tableBody: [{ type: Input, args: [{ isSignal: true, alias: "tableBody", required: false }] }], trClass: [{ type: Input, args: [{ isSignal: true, alias: "trClass", required: false }] }], checkboxClass: [{ type: Input, args: [{ isSignal: true, alias: "checkboxClass", required: false }] }], checkboxinputClass: [{ type: Input, args: [{ isSignal: true, alias: "checkboxinputClass", required: false }] }], tableFoot: [{ type: Input, args: [{ isSignal: true, alias: "tableFoot", required: false }] }], tableHeadColumn: [{ type: Input, args: [{ isSignal: true, alias: "tableHeadColumn", required: false }] }], captionbeforehead: [{ type: Input, args: [{ isSignal: true, alias: "captionbeforehead", required: false }] }], captiontitle: [{ type: Input, args: [{ isSignal: true, alias: "captiontitle", required: false }] }], data: [{ type: Input, args: [{ isSignal: true, alias: "data", required: false }] }], title: [{ type: Input, args: [{ isSignal: true, alias: "title", required: false }] }], footerData: [{ type: Input, args: [{ isSignal: true, alias: "footerData", required: false }] }], showFooter: [{ type: Input, args: [{ isSignal: true, alias: "showFooter", required: false }] }], showCheckbox: [{ type: Input, args: [{ isSignal: true, alias: "showCheckbox", required: false }] }], rows: [{ type: Input, args: [{ isSignal: true, alias: "rows", required: false }] }], footerContent: [{
    type: ContentChild,
    args: ["footer", { static: false }]
  }], toggleSelectAll: [{ type: Output, args: ["toggleSelectAll"] }], openDetails: [{ type: Output, args: ["openDetails"] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SpkReusableTables, { className: "SpkReusableTables", filePath: "src/app/@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables.ts", lineNumber: 12 });
})();

export {
  SpkReusableTables
};
//# sourceMappingURL=chunk-7UH7FJCU.js.map
