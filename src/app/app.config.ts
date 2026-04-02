import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { FlatpickrDefaults } from 'angularx-flatpickr';
import { ColorPickerService } from 'ngx-color-picker';
import { ToastNoAnimationModule } from 'ngx-toastr';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { OverlayscrollbarsModule } from 'overlayscrollbars-ngx';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideSweetAlert2 } from '@sweetalert2/ngx-sweetalert2';
import { QuillModule } from 'ngx-quill';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { requestContextInterceptor } from './core/interceptors/request-context.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([requestContextInterceptor, errorInterceptor, authInterceptor])),
    provideCharts(withDefaultRegisterables()),
    ColorPickerService,
    provideAnimations(),
    provideSweetAlert2({
      fireOnInit: false,
      dismissOnDestroy: true,
    }),
    importProvidersFrom(
      FlatpickrDefaults,
      OverlayscrollbarsModule,
      NgbModule,
      QuillModule.forRoot(),
      NgCircleProgressModule.forRoot({}),
      ToastNoAnimationModule.forRoot({
        timeOut: 15000,
        closeButton: true,
        progressBar: true,
      }),
    ),
  ],
};

