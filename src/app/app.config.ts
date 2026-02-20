import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideTranslateLoader,
  provideTranslateService,
} from '@ngx-translate/core';
import {
  provideTranslateHttpLoader,
  TranslateHttpLoader,
} from '@ngx-translate/http-loader';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    // translation providers
    provideTranslateService(),
    provideTranslateLoader(TranslateHttpLoader),
    ...provideTranslateHttpLoader({
      prefix: './i18n/',
      suffix: '.json',
    }),
  ],
};
