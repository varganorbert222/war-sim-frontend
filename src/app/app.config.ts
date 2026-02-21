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
import { DEFAULT_MAP_CONFIG, MAP_CONFIG } from './config/map.config';
import { API_CONFIG, DEFAULT_API_CONFIG } from './config/api.config';

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
    { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
    { provide: MAP_CONFIG, useValue: DEFAULT_MAP_CONFIG },
  ],
};
