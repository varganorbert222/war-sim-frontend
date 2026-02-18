import {
  Component,
  OnInit,
  AfterViewInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';
import 'leaflet.offline'; // plugin adds caching capabilities to L.tileLayer
import { UnitService } from '../../services/unit.service';
import { Unit } from '../../models/unit';
import { takeUntil } from 'rxjs';
import { BaseComponent } from '../base.component';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent
  extends BaseComponent
  implements OnInit, AfterViewInit
{
  @Output() viewChanged = new EventEmitter<{
    lat: number;
    lng: number;
    zoom: number;
  }>();
  @Output() statsChanged = new EventEmitter<{ unitCount: number }>();

  private map!: L.Map;
  private unitMarkers = new Map<string, L.Marker>();

  errorMessageKey: string | null = null;

  constructor(private unitService: UnitService) {
    super();
  }

  ngOnInit(): void {
    // start polling right away; map will be initialized once the view is ready
    this.startPolling();
  }

  ngAfterViewInit(): void {
    // the map container element (#map) is guaranteed to exist here
    this.initMap();

    // Leaflet sometimes calculates an incorrect size if the container
    // was not visible when the map was created (common in Angular).
    // Force a resize pass after the view has settled.
    setTimeout(() => this.map.invalidateSize(), 0);
  }

  private initMap(): void {
    // initial map with some performance tweaks
    const mapOptions: any = {
      // allow zooming with the mouse wheel; leaving this enabled means
      // the map will intercept scroll events, which is usually desirable
      // when users actively interact with the map.  If you want to require
      // a modifier key instead, use `scrollWheelZoom: 'ctrl'`.
      scrollWheelZoom: true,
      updateWhenIdle: true, // delay tile requests until user stops dragging
      updateInterval: 200, // throttle requests while dragging
      keepBuffer: 2, // keep an extra row/column of tiles to reduce reloads
    };

    this.map = L.map('map', mapOptions).setView([47.4979, 19.0402], 10);

    // use the offline-capable tile layer provided by the plugin
    const offlineLayer = (L.tileLayer as any).offline(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
        detectRetina: true,
        useCache: true, // enable plugin cache
        crossOrigin: true, // required for cache
        cacheMaxAge: 24 * 3600 * 1000, // keep tiles for one day
      },
    );

    offlineLayer.addTo(this.map);

    // emit initial view state and subscribe to later changes
    this.emitViewInfo();
    this.map.on('moveend zoomend', () => this.emitViewInfo());
  }

  private emitViewInfo() {
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    this.viewChanged.emit({ lat: center.lat, lng: center.lng, zoom });
  }

  private startPolling(): void {
    const fetchUnits = () => {
      this.unitService
        .getUnits()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (units) => {
            // clear any previous error
            this.errorMessageKey = null;
            if (units.length === 0 && !navigator.onLine) {
              this.errorMessageKey = 'OFFLINE_NO_CACHE';
            }
            this.updateUnits(units);
          },
          error: () => {
            if (!navigator.onLine) {
              this.errorMessageKey = 'OFFLINE_FAILED';
            } else {
              this.errorMessageKey = 'ERROR_LOADING';
            }
          },
        });
    };

    // immediately fetch and then poll every 2 seconds
    fetchUnits();
    setInterval(fetchUnits, 2000);
  }

  private updateUnits(units: Unit[]): void {
    units.forEach((u) => {
      const key = u.id;

      if (!this.unitMarkers.has(key)) {
        const marker = L.marker([u.latitude, u.longitude]).addTo(this.map);
        marker.bindPopup(`${u.name}`);
        this.unitMarkers.set(key, marker);
      } else {
        const marker = this.unitMarkers.get(key)!;
        marker.setLatLng([u.latitude, u.longitude]);
      }
    });

    // emit statistics so parent can display
    this.statsChanged.emit({ unitCount: units.length });
  }
}
