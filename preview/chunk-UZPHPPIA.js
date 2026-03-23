import {
  SpkReusableTables
} from "./chunk-7UH7FJCU.js";
import {
  ApiClientService,
  readField,
  toNumberValue,
  toStringValue
} from "./chunk-2RQ7HY24.js";
import {
  CheckboxControlValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-U53XDZ2X.js";
import {
  API_ENDPOINTS
} from "./chunk-7C46ZOJO.js";
import {
  NgClass,
  isPlatformBrowser
} from "./chunk-BMX4STFJ.js";
import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  Injector,
  Input,
  NgModule,
  NgZone,
  Output,
  PLATFORM_ID,
  ViewChild,
  afterEveryRender,
  afterNextRender,
  catchError,
  inject,
  input,
  map,
  of,
  output,
  setClassMetadata,
  signal,
  viewChild,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdomElement,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction6,
  ɵɵqueryAdvance,
  ɵɵqueryRefresh,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery,
  ɵɵviewQuerySignal
} from "./chunk-MOIGQQUQ.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-KWSTWQNB.js";

// node_modules/ng-apexcharts/fesm2022/ng-apexcharts.mjs
var _c0 = ["chart"];
var ChartComponent = class _ChartComponent {
  constructor() {
    this.chart = input(...ngDevMode ? [void 0, {
      debugName: "chart"
    }] : []);
    this.annotations = input(...ngDevMode ? [void 0, {
      debugName: "annotations"
    }] : []);
    this.colors = input(...ngDevMode ? [void 0, {
      debugName: "colors"
    }] : []);
    this.dataLabels = input(...ngDevMode ? [void 0, {
      debugName: "dataLabels"
    }] : []);
    this.series = input(...ngDevMode ? [void 0, {
      debugName: "series"
    }] : []);
    this.stroke = input(...ngDevMode ? [void 0, {
      debugName: "stroke"
    }] : []);
    this.labels = input(...ngDevMode ? [void 0, {
      debugName: "labels"
    }] : []);
    this.legend = input(...ngDevMode ? [void 0, {
      debugName: "legend"
    }] : []);
    this.markers = input(...ngDevMode ? [void 0, {
      debugName: "markers"
    }] : []);
    this.noData = input(...ngDevMode ? [void 0, {
      debugName: "noData"
    }] : []);
    this.parsing = input(...ngDevMode ? [void 0, {
      debugName: "parsing"
    }] : []);
    this.fill = input(...ngDevMode ? [void 0, {
      debugName: "fill"
    }] : []);
    this.tooltip = input(...ngDevMode ? [void 0, {
      debugName: "tooltip"
    }] : []);
    this.plotOptions = input(...ngDevMode ? [void 0, {
      debugName: "plotOptions"
    }] : []);
    this.responsive = input(...ngDevMode ? [void 0, {
      debugName: "responsive"
    }] : []);
    this.xaxis = input(...ngDevMode ? [void 0, {
      debugName: "xaxis"
    }] : []);
    this.yaxis = input(...ngDevMode ? [void 0, {
      debugName: "yaxis"
    }] : []);
    this.forecastDataPoints = input(...ngDevMode ? [void 0, {
      debugName: "forecastDataPoints"
    }] : []);
    this.grid = input(...ngDevMode ? [void 0, {
      debugName: "grid"
    }] : []);
    this.states = input(...ngDevMode ? [void 0, {
      debugName: "states"
    }] : []);
    this.title = input(...ngDevMode ? [void 0, {
      debugName: "title"
    }] : []);
    this.subtitle = input(...ngDevMode ? [void 0, {
      debugName: "subtitle"
    }] : []);
    this.theme = input(...ngDevMode ? [void 0, {
      debugName: "theme"
    }] : []);
    this.autoUpdateSeries = input(true, ...ngDevMode ? [{
      debugName: "autoUpdateSeries"
    }] : []);
    this.chartReady = output();
    this.chartInstance = signal(null, ...ngDevMode ? [{
      debugName: "chartInstance"
    }] : []);
    this.chartElement = viewChild.required("chart");
    this.ngZone = inject(NgZone);
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    this._destroyed = false;
    this._injector = inject(Injector);
    this.waitingForConnectedRef = null;
  }
  ngOnChanges(changes) {
    if (!this.isBrowser) return;
    this.hydrate(changes);
  }
  ngOnDestroy() {
    this.destroy();
    this._destroyed = true;
  }
  /** Determine if the host element is connected to the document */
  get isConnected() {
    return this.chartElement()?.nativeElement.isConnected;
  }
  hydrate(changes) {
    if (this.waitingForConnectedRef) {
      return;
    }
    const shouldUpdateSeries = this.chartInstance() && this.autoUpdateSeries() && Object.keys(changes).filter((c) => c !== "series").length === 0;
    if (shouldUpdateSeries) {
      this.updateSeries(this.series(), true);
      return;
    }
    afterNextRender({
      read: () => this.createElement()
    }, {
      injector: this._injector
    });
  }
  async createElement() {
    const {
      default: ApexCharts
    } = await import("./chunk-B32V6VU5.js");
    window.ApexCharts ||= ApexCharts;
    if (this._destroyed) return;
    if (!this.isConnected) {
      this.waitForConnected();
      return;
    }
    const options = {};
    const properties = ["annotations", "chart", "colors", "dataLabels", "series", "stroke", "labels", "legend", "fill", "tooltip", "plotOptions", "responsive", "markers", "noData", "parsing", "xaxis", "yaxis", "forecastDataPoints", "grid", "states", "title", "subtitle", "theme"];
    properties.forEach((property) => {
      const value = this[property]();
      if (value) {
        options[property] = value;
      }
    });
    this.destroy();
    const chartInstance = this.ngZone.runOutsideAngular(() => new ApexCharts(this.chartElement().nativeElement, options));
    this.chartInstance.set(chartInstance);
    this.render();
    this.chartReady.emit({
      chartObj: chartInstance
    });
  }
  render() {
    if (this.isConnected) {
      return this.ngZone.runOutsideAngular(() => this.chartInstance()?.render());
    } else {
      this.waitForConnected();
    }
  }
  updateOptions(options, redrawPaths, animate, updateSyncedCharts) {
    return this.ngZone.runOutsideAngular(() => this.chartInstance()?.updateOptions(options, redrawPaths, animate, updateSyncedCharts));
  }
  updateSeries(newSeries, animate) {
    return this.ngZone.runOutsideAngular(() => this.chartInstance()?.updateSeries(newSeries, animate));
  }
  appendSeries(newSeries, animate) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.appendSeries(newSeries, animate));
  }
  appendData(newData) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.appendData(newData));
  }
  highlightSeries(seriesName) {
    return this.ngZone.runOutsideAngular(() => this.chartInstance()?.highlightSeries(seriesName));
  }
  toggleSeries(seriesName) {
    return this.ngZone.runOutsideAngular(() => this.chartInstance()?.toggleSeries(seriesName));
  }
  showSeries(seriesName) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.showSeries(seriesName));
  }
  hideSeries(seriesName) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.hideSeries(seriesName));
  }
  resetSeries() {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.resetSeries());
  }
  zoomX(min, max) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.zoomX(min, max));
  }
  toggleDataPointSelection(seriesIndex, dataPointIndex) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.toggleDataPointSelection(seriesIndex, dataPointIndex));
  }
  destroy() {
    this.chartInstance()?.destroy();
    this.chartInstance.set(null);
  }
  setLocale(localeName) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.setLocale(localeName));
  }
  paper() {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.paper());
  }
  addXaxisAnnotation(options, pushToMemory, context) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.addXaxisAnnotation(options, pushToMemory, context));
  }
  addYaxisAnnotation(options, pushToMemory, context) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.addYaxisAnnotation(options, pushToMemory, context));
  }
  addPointAnnotation(options, pushToMemory, context) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.addPointAnnotation(options, pushToMemory, context));
  }
  removeAnnotation(id, options) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.removeAnnotation(id, options));
  }
  clearAnnotations(options) {
    this.ngZone.runOutsideAngular(() => this.chartInstance()?.clearAnnotations(options));
  }
  dataURI(options) {
    return this.chartInstance()?.dataURI(options);
  }
  waitForConnected() {
    if (this.waitingForConnectedRef) {
      return;
    }
    this.waitingForConnectedRef = afterEveryRender({
      read: () => {
        if (this.isConnected) {
          this.waitingForConnectedRef.destroy();
          this.waitingForConnectedRef = null;
          this.createElement();
        }
      }
    }, {
      injector: this._injector
    });
  }
  static {
    this.\u0275fac = function ChartComponent_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _ChartComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({
      type: _ChartComponent,
      selectors: [["apx-chart"]],
      viewQuery: function ChartComponent_Query(rf, ctx) {
        if (rf & 1) {
          \u0275\u0275viewQuerySignal(ctx.chartElement, _c0, 5);
        }
        if (rf & 2) {
          \u0275\u0275queryAdvance();
        }
      },
      inputs: {
        chart: [1, "chart"],
        annotations: [1, "annotations"],
        colors: [1, "colors"],
        dataLabels: [1, "dataLabels"],
        series: [1, "series"],
        stroke: [1, "stroke"],
        labels: [1, "labels"],
        legend: [1, "legend"],
        markers: [1, "markers"],
        noData: [1, "noData"],
        parsing: [1, "parsing"],
        fill: [1, "fill"],
        tooltip: [1, "tooltip"],
        plotOptions: [1, "plotOptions"],
        responsive: [1, "responsive"],
        xaxis: [1, "xaxis"],
        yaxis: [1, "yaxis"],
        forecastDataPoints: [1, "forecastDataPoints"],
        grid: [1, "grid"],
        states: [1, "states"],
        title: [1, "title"],
        subtitle: [1, "subtitle"],
        theme: [1, "theme"],
        autoUpdateSeries: [1, "autoUpdateSeries"]
      },
      outputs: {
        chartReady: "chartReady"
      },
      features: [\u0275\u0275NgOnChangesFeature],
      decls: 2,
      vars: 0,
      consts: [["chart", ""]],
      template: function ChartComponent_Template(rf, ctx) {
        if (rf & 1) {
          \u0275\u0275domElement(0, "div", null, 0);
        }
      },
      encapsulation: 2,
      changeDetection: 0
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ChartComponent, [{
    type: Component,
    args: [{
      selector: "apx-chart",
      template: `<div #chart></div>`,
      changeDetection: ChangeDetectionStrategy.OnPush,
      standalone: true
    }]
  }], null, {
    chart: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "chart",
        required: false
      }]
    }],
    annotations: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "annotations",
        required: false
      }]
    }],
    colors: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "colors",
        required: false
      }]
    }],
    dataLabels: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "dataLabels",
        required: false
      }]
    }],
    series: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "series",
        required: false
      }]
    }],
    stroke: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "stroke",
        required: false
      }]
    }],
    labels: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "labels",
        required: false
      }]
    }],
    legend: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "legend",
        required: false
      }]
    }],
    markers: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "markers",
        required: false
      }]
    }],
    noData: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "noData",
        required: false
      }]
    }],
    parsing: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "parsing",
        required: false
      }]
    }],
    fill: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "fill",
        required: false
      }]
    }],
    tooltip: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "tooltip",
        required: false
      }]
    }],
    plotOptions: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "plotOptions",
        required: false
      }]
    }],
    responsive: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "responsive",
        required: false
      }]
    }],
    xaxis: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "xaxis",
        required: false
      }]
    }],
    yaxis: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "yaxis",
        required: false
      }]
    }],
    forecastDataPoints: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "forecastDataPoints",
        required: false
      }]
    }],
    grid: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "grid",
        required: false
      }]
    }],
    states: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "states",
        required: false
      }]
    }],
    title: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "title",
        required: false
      }]
    }],
    subtitle: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "subtitle",
        required: false
      }]
    }],
    theme: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "theme",
        required: false
      }]
    }],
    autoUpdateSeries: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "autoUpdateSeries",
        required: false
      }]
    }],
    chartReady: [{
      type: Output,
      args: ["chartReady"]
    }],
    chartElement: [{
      type: ViewChild,
      args: ["chart", {
        isSignal: true
      }]
    }]
  });
})();
var declarations = [ChartComponent];
var NgApexchartsModule = class _NgApexchartsModule {
  static {
    this.\u0275fac = function NgApexchartsModule_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _NgApexchartsModule)();
    };
  }
  static {
    this.\u0275mod = /* @__PURE__ */ \u0275\u0275defineNgModule({
      type: _NgApexchartsModule,
      imports: [ChartComponent],
      exports: [ChartComponent]
    });
  }
  static {
    this.\u0275inj = /* @__PURE__ */ \u0275\u0275defineInjector({});
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NgApexchartsModule, [{
    type: NgModule,
    args: [{
      imports: [declarations],
      exports: [declarations]
    }]
  }], null, null);
})();

// src/app/@spk/widgets/spk-widgets-metric-card/spk-widgets-metric-card.ts
var SpkWidgetsMetricCard = class _SpkWidgetsMetricCard {
  data = input(...ngDevMode ? [void 0, { debugName: "data" }] : []);
  static \u0275fac = function SpkWidgetsMetricCard_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SpkWidgetsMetricCard)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SpkWidgetsMetricCard, selectors: [["spk-widgets-metric-card"]], inputs: { data: [1, "data"] }, decls: 19, vars: 12, consts: [[1, "card", "sales-card", "circle-image1"], [1, "row"], [1, "col-8"], [1, "ps-4", "pt-4", "pe-3", "pb-4", "pt-0"], [1, ""], [1, "mb-2", "fs-12", "fw-semibold"], [1, "pb-0", "mt-0"], [1, "d-flex"], [1, "fs-26", "fw-semibold", "mb-2"], [1, "mb-0", "fs-12", "text-muted"], [1, "col-4"]], template: function SpkWidgetsMetricCard_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275domElementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3)(4, "div", 4)(5, "p", 5);
      \u0275\u0275text(6);
      \u0275\u0275domElementEnd()();
      \u0275\u0275domElementStart(7, "div", 6)(8, "div", 7)(9, "h4", 8);
      \u0275\u0275text(10);
      \u0275\u0275domElementEnd()();
      \u0275\u0275domElementStart(11, "p", 9);
      \u0275\u0275text(12);
      \u0275\u0275domElement(13, "i");
      \u0275\u0275domElementStart(14, "span");
      \u0275\u0275text(15);
      \u0275\u0275domElementEnd()()()()();
      \u0275\u0275domElementStart(16, "div", 10)(17, "div");
      \u0275\u0275domElement(18, "i");
      \u0275\u0275domElementEnd()()()();
    }
    if (rf & 2) {
      let tmp_0_0;
      let tmp_1_0;
      let tmp_2_0;
      let tmp_3_0;
      let tmp_4_0;
      let tmp_5_0;
      let tmp_6_0;
      let tmp_7_0;
      \u0275\u0275advance(6);
      \u0275\u0275textInterpolate((tmp_0_0 = ctx.data()) == null ? null : tmp_0_0.title);
      \u0275\u0275advance(4);
      \u0275\u0275textInterpolate((tmp_1_0 = ctx.data()) == null ? null : tmp_1_0.value);
      \u0275\u0275advance(2);
      \u0275\u0275textInterpolate1("", (tmp_2_0 = ctx.data()) == null ? null : tmp_2_0.lastWeek, " ");
      \u0275\u0275advance();
      \u0275\u0275classMap(`fas fa-arrow-circle-${(tmp_3_0 = ctx.data()) == null ? null : tmp_3_0.trendIcon} mx-2 ${(tmp_3_0 = ctx.data()) == null ? null : tmp_3_0.trendClass}`);
      \u0275\u0275advance();
      \u0275\u0275classMap((tmp_4_0 = ctx.data()) == null ? null : tmp_4_0.trendClass);
      \u0275\u0275advance();
      \u0275\u0275textInterpolate1(" ", (tmp_5_0 = ctx.data()) == null ? null : tmp_5_0.trendValue);
      \u0275\u0275advance(2);
      \u0275\u0275classMap(`circle-icon widget ${(tmp_6_0 = ctx.data()) == null ? null : tmp_6_0.cardClass} text-center align-self-center  overflow-hidden `);
      \u0275\u0275advance();
      \u0275\u0275classMap(`fe fe-${(tmp_7_0 = ctx.data()) == null ? null : tmp_7_0.iconClass} fs-20 lh-lg text-fixed-white`);
    }
  }, encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SpkWidgetsMetricCard, [{
    type: Component,
    args: [{ selector: "spk-widgets-metric-card", imports: [], template: '<div class="card sales-card circle-image1">\r\n    <div class="row">\r\n        <div class="col-8">\r\n            <div class="ps-4 pt-4 pe-3 pb-4 pt-0">\r\n                <div class="">\r\n                    <p class="mb-2 fs-12 fw-semibold">{{data()?.title}}</p>\r\n                </div>\r\n                <div class="pb-0 mt-0">\r\n                    <div class="d-flex">\r\n                        <h4 class="fs-26 fw-semibold mb-2">{{data()?.value}}</h4>\r\n                    </div>\r\n                    <p class="mb-0 fs-12 text-muted">{{data()?.lastWeek}}\r\n                        <i [class]="`fas fa-arrow-circle-${data()?.trendIcon} mx-2 ${data()?.trendClass}`"></i>\r\n                        <span [class]="data()?.trendClass"> {{data()?.trendValue}}</span>\r\n                    </p>\r\n                </div>\r\n            </div>\r\n        </div>\r\n        <div class="col-4">\r\n            <div\r\n                [class]="`circle-icon widget ${data()?.cardClass} text-center align-self-center  overflow-hidden `">\r\n                <i [class]="`fe fe-${data()?.iconClass} fs-20 lh-lg text-fixed-white`"></i>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>' }]
  }], null, { data: [{ type: Input, args: [{ isSignal: true, alias: "data", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SpkWidgetsMetricCard, { className: "SpkWidgetsMetricCard", filePath: "src/app/@spk/widgets/spk-widgets-metric-card/spk-widgets-metric-card.ts", lineNumber: 18 });
})();

// src/app/@spk/charts/spk-apexcharts/spk-apexcharts.ts
var _c02 = ["chart"];
var _c1 = () => ({ text: "" });
var _c2 = () => [];
var _c3 = () => ({});
var _c4 = () => ({ type: "line" });
var SpkApexcharts = class _SpkApexcharts {
  chart;
  apxClass = input(...ngDevMode ? [void 0, { debugName: "apxClass" }] : []);
  id = input(...ngDevMode ? [void 0, { debugName: "id" }] : []);
  chartOptions = input(...ngDevMode ? [void 0, { debugName: "chartOptions" }] : []);
  static \u0275fac = function SpkApexcharts_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SpkApexcharts)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _SpkApexcharts, selectors: [["spk-apexcharts"]], viewQuery: function SpkApexcharts_Query(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275viewQuery(_c02, 5);
    }
    if (rf & 2) {
      let _t;
      \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.chart = _t.first);
    }
  }, inputs: { apxClass: [1, "apxClass"], id: [1, "id"], chartOptions: [1, "chartOptions"] }, decls: 2, vars: 36, consts: [["chart", ""], [3, "ngClass", "id", "title", "series", "colors", "dataLabels", "chart", "xaxis", "tooltip", "fill", "legend", "stroke", "plotOptions", "yaxis", "responsive", "labels", "grid", "markers", "annotations"]], template: function SpkApexcharts_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275element(0, "apx-chart", 1, 0);
    }
    if (rf & 2) {
      let tmp_3_0;
      let tmp_4_0;
      let tmp_5_0;
      let tmp_6_0;
      let tmp_7_0;
      let tmp_8_0;
      let tmp_9_0;
      let tmp_10_0;
      let tmp_11_0;
      let tmp_12_0;
      let tmp_13_0;
      let tmp_14_0;
      let tmp_15_0;
      let tmp_16_0;
      let tmp_17_0;
      let tmp_18_0;
      let tmp_19_0;
      \u0275\u0275property("ngClass", ctx.apxClass())("id", ctx.id())("title", ((tmp_3_0 = ctx.chartOptions()) == null ? null : tmp_3_0.title) ?? \u0275\u0275pureFunction0(19, _c1))("series", ((tmp_4_0 = ctx.chartOptions()) == null ? null : tmp_4_0.series) ?? \u0275\u0275pureFunction0(20, _c2))("colors", ((tmp_5_0 = ctx.chartOptions()) == null ? null : tmp_5_0.colors) ?? \u0275\u0275pureFunction0(21, _c2))("dataLabels", ((tmp_6_0 = ctx.chartOptions()) == null ? null : tmp_6_0.dataLabels) ?? \u0275\u0275pureFunction0(22, _c3))("chart", ((tmp_7_0 = ctx.chartOptions()) == null ? null : tmp_7_0.chart) ?? \u0275\u0275pureFunction0(23, _c4))("xaxis", ((tmp_8_0 = ctx.chartOptions()) == null ? null : tmp_8_0.xaxis) ?? \u0275\u0275pureFunction0(24, _c3))("tooltip", ((tmp_9_0 = ctx.chartOptions()) == null ? null : tmp_9_0.tooltip) ?? \u0275\u0275pureFunction0(25, _c3))("fill", ((tmp_10_0 = ctx.chartOptions()) == null ? null : tmp_10_0.fill) ?? \u0275\u0275pureFunction0(26, _c3))("legend", ((tmp_11_0 = ctx.chartOptions()) == null ? null : tmp_11_0.legend) ?? \u0275\u0275pureFunction0(27, _c3))("stroke", ((tmp_12_0 = ctx.chartOptions()) == null ? null : tmp_12_0.stroke) ?? \u0275\u0275pureFunction0(28, _c3))("plotOptions", ((tmp_13_0 = ctx.chartOptions()) == null ? null : tmp_13_0.plotOptions) ?? \u0275\u0275pureFunction0(29, _c3))("yaxis", ((tmp_14_0 = ctx.chartOptions()) == null ? null : tmp_14_0.yaxis) ?? \u0275\u0275pureFunction0(30, _c2))("responsive", ((tmp_15_0 = ctx.chartOptions()) == null ? null : tmp_15_0.responsive) ?? \u0275\u0275pureFunction0(31, _c2))("labels", ((tmp_16_0 = ctx.chartOptions()) == null ? null : tmp_16_0.labels) ?? \u0275\u0275pureFunction0(32, _c2))("grid", ((tmp_17_0 = ctx.chartOptions()) == null ? null : tmp_17_0.grid) ?? \u0275\u0275pureFunction0(33, _c3))("markers", ((tmp_18_0 = ctx.chartOptions()) == null ? null : tmp_18_0.markers) ?? \u0275\u0275pureFunction0(34, _c3))("annotations", ((tmp_19_0 = ctx.chartOptions()) == null ? null : tmp_19_0.annotations) ?? \u0275\u0275pureFunction0(35, _c3));
    }
  }, dependencies: [NgApexchartsModule, ChartComponent, NgClass], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SpkApexcharts, [{
    type: Component,
    args: [{ selector: "spk-apexcharts", imports: [NgApexchartsModule, NgClass], template: `<apx-chart\r
  #chart\r
  [ngClass]="apxClass()"\r
  [id]="id()"\r
  [title]="chartOptions()?.title ?? { text: '' }"\r
  [series]="chartOptions()?.series ?? []"\r
  [colors]="chartOptions()?.colors ?? []"\r
  [dataLabels]="chartOptions()?.dataLabels ?? {}"\r
  [chart]="chartOptions()?.chart ?? { type: 'line' }"\r
  [xaxis]="chartOptions()?.xaxis ?? {}"\r
  [tooltip]="chartOptions()?.tooltip ?? {}"\r
  [fill]="chartOptions()?.fill ?? {}"\r
  [legend]="chartOptions()?.legend ?? {}"\r
  [stroke]="chartOptions()?.stroke ?? {}"\r
  [plotOptions]="chartOptions()?.plotOptions ?? {}"\r
  [yaxis]="chartOptions()?.yaxis ?? []"\r
  [responsive]="chartOptions()?.responsive ?? []"\r
  [labels]="chartOptions()?.labels ?? []"\r
  [grid]="chartOptions()?.grid ?? {}"\r
  [markers]="chartOptions()?.markers ?? {}"\r
  [annotations]="chartOptions()?.annotations ?? {}"\r
></apx-chart>\r
` }]
  }], null, { chart: [{
    type: ViewChild,
    args: ["chart"]
  }], apxClass: [{ type: Input, args: [{ isSignal: true, alias: "apxClass", required: false }] }], id: [{ type: Input, args: [{ isSignal: true, alias: "id", required: false }] }], chartOptions: [{ type: Input, args: [{ isSignal: true, alias: "chartOptions", required: false }] }] });
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(SpkApexcharts, { className: "SpkApexcharts", filePath: "src/app/@spk/charts/spk-apexcharts/spk-apexcharts.ts", lineNumber: 12 });
})();

// src/app/modules/dashboard/services/dashboard.service.ts
var DashboardService = class _DashboardService {
  apiClient;
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  getSummary() {
    return this.apiClient.get(API_ENDPOINTS.dashboard.summary).pipe(catchError(() => of({
      headcount: 0,
      active: 0,
      absences: 0,
      vacancies: 0
    })), map(mapSummaryDto));
  }
  getPendingRequests() {
    return this.apiClient.get(API_ENDPOINTS.dashboard.pendingRequests).pipe(catchError(() => of([])), map(mapPendingRequestDtos));
  }
  static \u0275fac = function DashboardService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DashboardService)(\u0275\u0275inject(ApiClientService));
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _DashboardService, factory: _DashboardService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DashboardService, [{
    type: Injectable,
    args: [{ providedIn: "root" }]
  }], () => [{ type: ApiClientService }], null);
})();
function mapSummaryDto(dto) {
  return {
    headcount: toNumberValue(readField(dto, ["headcount", "totalHeadcount", "total_headcount"], 0)),
    active: toNumberValue(readField(dto, ["active", "activeAgents", "active_agents"], 0)),
    absences: toNumberValue(readField(dto, ["absences", "runningAbsences", "running_absences"], 0)),
    vacancies: toNumberValue(readField(dto, ["vacancies", "vacantPositions", "vacant_positions"], 0))
  };
}
function mapPendingRequestDtos(dtos) {
  return dtos.map((dto) => ({
    reference: toStringValue(readField(dto, ["reference", "requestRef", "request_ref"], "")),
    agent: toStringValue(readField(dto, ["agent", "agentName", "agent_name"], "")),
    type: toStringValue(readField(dto, ["type", "requestType", "request_type"], "")),
    unit: toStringValue(readField(dto, ["unit", "organizationUnit", "organization_unit"], "")),
    submittedAt: toStringValue(readField(dto, ["submittedAt", "submitted_at", "createdAt", "created_at"], "")),
    status: toStringValue(readField(dto, ["status"], ""))
  }));
}

// src/app/modules/dashboard/pages/hr-dashboard/hr-dashboard.ts
var _c03 = () => ({ header: "R\xE9f\xE9rence" });
var _c12 = () => ({ header: "Agent" });
var _c22 = () => ({ header: "Type" });
var _c32 = () => ({ header: "Structure" });
var _c42 = () => ({ header: "Soumis le" });
var _c5 = () => ({ header: "Statut" });
var _c6 = (a0, a1, a2, a3, a4, a5) => [a0, a1, a2, a3, a4, a5];
var _forTrack0 = ($index, $item) => $item.reference;
function HrDashboardPage_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 1);
    \u0275\u0275element(1, "spk-widgets-metric-card", 15);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const kpi_r1 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("data", kpi_r1);
  }
}
function HrDashboardPage_For_33_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "tr")(1, "td")(2, "input", 16);
    \u0275\u0275twoWayListener("ngModelChange", function HrDashboardPage_For_33_Template_input_ngModelChange_2_listener($event) {
      const row_r3 = \u0275\u0275restoreView(_r2).$implicit;
      \u0275\u0275twoWayBindingSet(row_r3.checked, $event) || (row_r3.checked = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "td");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td");
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "td");
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "td");
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "td");
    \u0275\u0275text(12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "td")(14, "span", 17);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const row_r3 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", row_r3.checked);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r3.reference);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r3.agent);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r3.type);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r3.unit);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(row_r3.submittedAt);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(row_r3.status);
  }
}
var HrDashboardPage = class _HrDashboardPage {
  dashboardService = inject(DashboardService);
  kpis = [
    { title: "Effectif total", value: "1 284", lastWeek: "M-1", trendIcon: "up", trendClass: "text-success", trendValue: "+2.1%", cardClass: "bg-primary-gradient", iconClass: "users" },
    { title: "Agents actifs", value: "1 173", lastWeek: "Aujourd\u2019hui", trendIcon: "up", trendClass: "text-success", trendValue: "+1.4%", cardClass: "bg-success-gradient", iconClass: "user-check" },
    { title: "Absences en cours", value: "47", lastWeek: "En attente", trendIcon: "up", trendClass: "text-warning", trendValue: "12 urgentes", cardClass: "bg-warning-gradient", iconClass: "calendar" },
    { title: "Postes vacants", value: "23", lastWeek: "Priorit\xE9", trendIcon: "down", trendClass: "text-danger", trendValue: "5 critiques", cardClass: "bg-danger-gradient", iconClass: "briefcase" }
  ];
  headcountTrend = {
    chart: { type: "line", height: 320, toolbar: { show: false } },
    series: [
      { name: "Effectif", data: [1201, 1210, 1216, 1228, 1240, 1255, 1284] },
      { name: "Sorties", data: [3, 2, 5, 1, 4, 2, 6] }
    ],
    colors: ["var(--primary-color)", "#f74f75"],
    stroke: { curve: "smooth", width: 3 },
    xaxis: { categories: ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil"] },
    grid: { borderColor: "#f2f6f7" },
    dataLabels: { enabled: false }
  };
  pendingRequests = [];
  ngOnInit() {
    this.dashboardService.getSummary().subscribe((summary) => {
      this.kpis = [
        __spreadProps(__spreadValues({}, this.kpis[0]), { value: summary.headcount.toLocaleString("fr-FR") }),
        __spreadProps(__spreadValues({}, this.kpis[1]), { value: summary.active.toLocaleString("fr-FR") }),
        __spreadProps(__spreadValues({}, this.kpis[2]), { value: String(summary.absences) }),
        __spreadProps(__spreadValues({}, this.kpis[3]), { value: String(summary.vacancies) })
      ];
    });
    this.dashboardService.getPendingRequests().subscribe((requests) => {
      this.pendingRequests = requests.map((request) => __spreadProps(__spreadValues({}, request), { checked: false }));
    });
  }
  toggleAllRows(checked) {
    this.pendingRequests = this.pendingRequests.map((row) => __spreadProps(__spreadValues({}, row), { checked }));
  }
  static \u0275fac = function HrDashboardPage_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HrDashboardPage)();
  };
  static \u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HrDashboardPage, selectors: [["app-hr-dashboard"]], decls: 34, vars: 18, consts: [[1, "row", "row-sm"], [1, "col-xl-3", "col-lg-6", "col-md-6"], [1, "col-xxl-8", "col-xl-12"], [1, "card", "custom-card"], [1, "card-header"], [1, "card-title"], [1, "card-body"], ["id", "hr-headcount-trend", 3, "chartOptions"], [1, "col-xxl-4", "col-xl-12"], [1, "alert", "alert-warning-transparent", "mb-2"], [1, "alert", "alert-danger-transparent", "mb-2"], [1, "alert", "alert-info-transparent", "mb-0"], [1, "col-xl-12"], [1, "table-responsive"], [3, "toggleSelectAll", "tableClass", "showCheckbox", "columns", "data"], [3, "data"], ["type", "checkbox", 1, "form-check-input", 3, "ngModelChange", "ngModel"], [1, "badge", "bg-warning-transparent", "text-warning"]], template: function HrDashboardPage_Template(rf, ctx) {
    if (rf & 1) {
      \u0275\u0275elementStart(0, "div", 0);
      \u0275\u0275repeaterCreate(1, HrDashboardPage_For_2_Template, 2, 1, "div", 1, \u0275\u0275repeaterTrackByIndex);
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(3, "div", 0)(4, "div", 2)(5, "div", 3)(6, "div", 4)(7, "div", 5);
      \u0275\u0275text(8, "\xC9volution des effectifs");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(9, "div", 6);
      \u0275\u0275element(10, "spk-apexcharts", 7);
      \u0275\u0275elementEnd()()();
      \u0275\u0275elementStart(11, "div", 8)(12, "div", 3)(13, "div", 4)(14, "div", 5);
      \u0275\u0275text(15, "Alertes administratives");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(16, "div", 6)(17, "div", 9);
      \u0275\u0275text(18, "12 dossiers incomplets");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(19, "div", 10);
      \u0275\u0275text(20, "5 d\xE9parts \xE0 la retraite sous 90 jours");
      \u0275\u0275elementEnd();
      \u0275\u0275elementStart(21, "div", 11);
      \u0275\u0275text(22, "9 validations manager en attente");
      \u0275\u0275elementEnd()()()()();
      \u0275\u0275elementStart(23, "div", 0)(24, "div", 12)(25, "div", 3)(26, "div", 4)(27, "div", 5);
      \u0275\u0275text(28, "Demandes \xE0 traiter");
      \u0275\u0275elementEnd()();
      \u0275\u0275elementStart(29, "div", 6)(30, "div", 13)(31, "spk-reusable-tables", 14);
      \u0275\u0275listener("toggleSelectAll", function HrDashboardPage_Template_spk_reusable_tables_toggleSelectAll_31_listener($event) {
        return ctx.toggleAllRows($event);
      });
      \u0275\u0275repeaterCreate(32, HrDashboardPage_For_33_Template, 16, 7, "tr", null, _forTrack0);
      \u0275\u0275elementEnd()()()()()();
    }
    if (rf & 2) {
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.kpis);
      \u0275\u0275advance(9);
      \u0275\u0275property("chartOptions", ctx.headcountTrend);
      \u0275\u0275advance(21);
      \u0275\u0275property("tableClass", "table text-nowrap")("showCheckbox", true)("columns", \u0275\u0275pureFunction6(11, _c6, \u0275\u0275pureFunction0(5, _c03), \u0275\u0275pureFunction0(6, _c12), \u0275\u0275pureFunction0(7, _c22), \u0275\u0275pureFunction0(8, _c32), \u0275\u0275pureFunction0(9, _c42), \u0275\u0275pureFunction0(10, _c5)))("data", ctx.pendingRequests);
      \u0275\u0275advance();
      \u0275\u0275repeater(ctx.pendingRequests);
    }
  }, dependencies: [
    FormsModule,
    CheckboxControlValueAccessor,
    NgControlStatus,
    NgModel,
    SpkWidgetsMetricCard,
    SpkApexcharts,
    SpkReusableTables,
    NgApexchartsModule
  ], encapsulation: 2 });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HrDashboardPage, [{
    type: Component,
    args: [{ selector: "app-hr-dashboard", standalone: true, imports: [
      FormsModule,
      SpkWidgetsMetricCard,
      SpkApexcharts,
      SpkReusableTables,
      NgApexchartsModule
    ], template: `<div class="row row-sm">
  @for (kpi of kpis; track $index) {
    <div class="col-xl-3 col-lg-6 col-md-6">
      <spk-widgets-metric-card [data]="kpi"></spk-widgets-metric-card>
    </div>
  }
</div>

<div class="row row-sm">
  <div class="col-xxl-8 col-xl-12">
    <div class="card custom-card">
      <div class="card-header">
        <div class="card-title">\xC9volution des effectifs</div>
      </div>
      <div class="card-body">
        <spk-apexcharts id="hr-headcount-trend" [chartOptions]="headcountTrend"></spk-apexcharts>
      </div>
    </div>
  </div>

  <div class="col-xxl-4 col-xl-12">
    <div class="card custom-card">
      <div class="card-header">
        <div class="card-title">Alertes administratives</div>
      </div>
      <div class="card-body">
        <div class="alert alert-warning-transparent mb-2">12 dossiers incomplets</div>
        <div class="alert alert-danger-transparent mb-2">5 d\xE9parts \xE0 la retraite sous 90 jours</div>
        <div class="alert alert-info-transparent mb-0">9 validations manager en attente</div>
      </div>
    </div>
  </div>
</div>

<div class="row row-sm">
  <div class="col-xl-12">
    <div class="card custom-card">
      <div class="card-header">
        <div class="card-title">Demandes \xE0 traiter</div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <spk-reusable-tables
            [tableClass]="'table text-nowrap'"
            [showCheckbox]="true"
            [columns]="[
              { header: 'R\xE9f\xE9rence' },
              { header: 'Agent' },
              { header: 'Type' },
              { header: 'Structure' },
              { header: 'Soumis le' },
              { header: 'Statut' }
            ]"
            [data]="pendingRequests"
            (toggleSelectAll)="toggleAllRows($event)"
          >
            @for (row of pendingRequests; track row.reference) {
              <tr>
                <td><input class="form-check-input" type="checkbox" [(ngModel)]="row.checked" /></td>
                <td>{{ row.reference }}</td>
                <td>{{ row.agent }}</td>
                <td>{{ row.type }}</td>
                <td>{{ row.unit }}</td>
                <td>{{ row.submittedAt }}</td>
                <td><span class="badge bg-warning-transparent text-warning">{{ row.status }}</span></td>
              </tr>
            }
          </spk-reusable-tables>
        </div>
      </div>
    </div>
  </div>
</div>
` }]
  }], null, null);
})();
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HrDashboardPage, { className: "HrDashboardPage", filePath: "src/app/modules/dashboard/pages/hr-dashboard/hr-dashboard.ts", lineNumber: 21 });
})();
export {
  HrDashboardPage
};
//# sourceMappingURL=chunk-UZPHPPIA.js.map
