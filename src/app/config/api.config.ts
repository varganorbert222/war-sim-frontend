import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  apiBaseUrl: string;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  apiBaseUrl: '/api',
};

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

export function buildApiUrl(apiBaseUrl: string, path: string): string {
  const normalizedBase = apiBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}
