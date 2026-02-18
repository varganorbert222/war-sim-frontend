import * as L from 'leaflet';

// Plugin extends L.tileLayer with an `offline` factory and adds options
// for caching. We only declare the bits we use so TypeScript stops complaining.

declare module 'leaflet' {
  namespace TileLayer {
    interface OfflineOptions extends TileLayerOptions {
      useCache?: boolean;
      cacheMaxAge?: number; // milliseconds
    }
  }

  interface TileLayerStatic {
    offline(urlTemplate: string, options?: TileLayer.OfflineOptions): TileLayer;
  }
}
