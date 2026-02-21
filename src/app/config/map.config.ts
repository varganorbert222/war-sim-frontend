import { InjectionToken } from '@angular/core';

export interface MapConfig {
  mapContainerId: string;
  initialView: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  initialBounds: {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
  };
  mapOptions: {
    scrollWheelZoom: boolean | 'center';
  };
  tileLayer: {
    url: string;
    attribution: string;
    maxZoom: number;
    detectRetina: boolean;
    useCache: boolean;
    crossOrigin: boolean;
    cacheMaxAgeMs: number;
    updateWhenIdle: boolean;
    updateInterval: number;
    keepBuffer: number;
  };
  polling: {
    intervalMs: number;
  };
  rendering: {
    mapInvalidateDelayMs: number;
    viewChangeEvents: string;
    maxInterpolationSeconds: number | null;
  };
  icons: {
    unit: {
      sizePx: number;
      labelFallback: string;
    };
    projectile: {
      sizePx: number;
    };
  };
}

export const DEFAULT_MAP_CONFIG: MapConfig = {
  mapContainerId: 'map',
  initialView: {
    // Back-end caucasus-default.json -> centerPoint
    latitude: 42.5,
    longitude: 42.0,
    zoom: 7,
  },
  initialBounds: {
    // Back-end caucasus-default.json -> mapBounds
    minLatitude: 41.0,
    maxLatitude: 45.5,
    minLongitude: 37.0,
    maxLongitude: 45.0,
  },
  mapOptions: {
    scrollWheelZoom: true,
  },
  tileLayer: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
    detectRetina: true,
    useCache: true,
    crossOrigin: true,
    cacheMaxAgeMs: 24 * 3600 * 1000,
    updateWhenIdle: true,
    updateInterval: 200,
    keepBuffer: 2,
  },
  polling: {
    intervalMs: 2000,
  },
  rendering: {
    mapInvalidateDelayMs: 0,
    viewChangeEvents: 'moveend zoomend',
    maxInterpolationSeconds: null,
  },
  icons: {
    unit: {
      sizePx: 24,
      labelFallback: 'U',
    },
    projectile: {
      sizePx: 8,
    },
  },
};

export const MAP_CONFIG = new InjectionToken<MapConfig>('MAP_CONFIG');
