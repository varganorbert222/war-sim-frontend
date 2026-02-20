import {
  Component,
  OnInit,
  AfterViewInit,
  Output,
  EventEmitter,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';
import 'leaflet.offline'; // plugin adds caching capabilities to L.tileLayer
import { FactionService } from '../../services/faction.service';
import { MovementService } from '../../services/movement.service';
import { Faction } from '../../models/faction';
import {
  MovementSnapshot,
  ProjectileMovement,
  UnitMovement,
} from '../../models/movement-snapshot';
import { takeUntil } from 'rxjs';
import { BaseComponent } from '../base.component';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  encapsulation: ViewEncapsulation.None,
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
  private readonly pollIntervalMs = 2000;
  private pollTimerId: number | null = null;
  private animationFrameId: number | null = null;
  private lastSnapshotReceivedAt = Date.now();

  private unitMovements = new Map<string, UnitMovement>();
  private projectileMovements = new Map<string, ProjectileMovement>();

  // markers keyed by object id so we can update them instead of recreating
  private unitMarkers = new Map<string, L.Marker>();
  private projectileMarkers = new Map<string, L.Marker>();

  /** loaded factions, keyed by id for convenience */
  private factions = new Map<number, Faction>();

  errorMessageKey: string | null = null;

  constructor(
    private movementService: MovementService,
    private factionService: FactionService,
  ) {
    super();
  }

  ngOnInit(): void {
    // fetch faction metadata before we start drawing units/icons
    this.factionService
      .getFactions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        list.forEach((f) => this.factions.set(f.id, f));
      });
  }

  ngAfterViewInit(): void {
    // the map container element (#map) is guaranteed to exist here
    this.initMap();
    this.startPolling();
    this.startInterpolationLoop();

    // Leaflet sometimes calculates an incorrect size if the container
    // was not visible when the map was created (common in Angular).
    // Force a resize pass after the view has settled.
    setTimeout(() => this.map.invalidateSize(), 0);
  }

  override ngOnDestroy(): void {
    if (this.pollTimerId !== null) {
      window.clearInterval(this.pollTimerId);
      this.pollTimerId = null;
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.map) {
      this.map.off();
      this.map.remove();
    }

    super.ngOnDestroy();
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
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        attribution:
          'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
        maxZoom: 17,
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
    const fetchSnapshot = () => {
      this.movementService
        .getSnapshot()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (snapshot) => {
            this.errorMessageKey = null;
            if (snapshot.units.length === 0 && !navigator.onLine) {
              this.errorMessageKey = 'OFFLINE_NO_CACHE';
            }

            this.applySnapshot(snapshot);
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
    fetchSnapshot();
    this.pollTimerId = window.setInterval(fetchSnapshot, this.pollIntervalMs);
  }

  private applySnapshot(snapshot: MovementSnapshot): void {
    this.lastSnapshotReceivedAt = Date.now();

    this.unitMovements.clear();
    snapshot.units.forEach((unit) => {
      this.unitMovements.set(unit.id, unit);
      const existing = this.unitMarkers.get(unit.id);
      if (existing) {
        existing.setIcon(this.createUnitIcon(unit));
      }
    });

    this.projectileMovements.clear();
    snapshot.projectiles.forEach((projectile) => {
      this.projectileMovements.set(projectile.id, projectile);
      const existing = this.projectileMarkers.get(projectile.id);
      if (existing) {
        existing.setIcon(this.createProjectileIcon(projectile));
      }
    });

    this.statsChanged.emit({ unitCount: snapshot.units.length });
    this.renderInterpolatedState(0);
  }

  private startInterpolationLoop(): void {
    const loop = () => {
      const elapsedSec = Math.min(
        (Date.now() - this.lastSnapshotReceivedAt) / 1000,
        this.pollIntervalMs / 1000,
      );

      this.renderInterpolatedState(elapsedSec);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private renderInterpolatedState(elapsedSec: number): void {
    this.updateUnitMarkers(elapsedSec);
    this.updateProjectileMarkers(elapsedSec);
  }

  private updateUnitMarkers(elapsedSec: number): void {
    this.unitMovements.forEach((unit) => {
      const projected = this.projectPosition(
        unit.latitude,
        unit.longitude,
        unit.heading,
        unit.speedMps,
        elapsedSec,
      );

      const position: L.LatLngExpression = [
        projected.latitude,
        projected.longitude,
      ];
      const existing = this.unitMarkers.get(unit.id);

      if (!existing) {
        const marker = L.marker(position, {
          icon: this.createUnitIcon(unit),
        }).addTo(this.map);
        marker.bindPopup(unit.name);
        this.unitMarkers.set(unit.id, marker);
      } else {
        existing.setLatLng(position);
      }
    });

    const currentIds = new Set(this.unitMovements.keys());
    this.unitMarkers.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        this.map.removeLayer(marker);
        this.unitMarkers.delete(id);
      }
    });
  }

  private updateProjectileMarkers(elapsedSec: number): void {
    this.projectileMovements.forEach((projectile) => {
      const projected = this.projectPosition(
        projectile.latitude,
        projectile.longitude,
        projectile.heading,
        projectile.speedMps,
        elapsedSec,
      );

      const position: L.LatLngExpression = [
        projected.latitude,
        projected.longitude,
      ];
      const existing = this.projectileMarkers.get(projectile.id);

      if (!existing) {
        const marker = L.marker(position, {
          icon: this.createProjectileIcon(projectile),
        }).addTo(this.map);
        this.projectileMarkers.set(projectile.id, marker);
      } else {
        existing.setLatLng(position);
      }
    });

    const currentIds = new Set(this.projectileMovements.keys());
    this.projectileMarkers.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        this.map.removeLayer(marker);
        this.projectileMarkers.delete(id);
      }
    });
  }

  private createUnitIcon(unit: UnitMovement): L.DivIcon {
    const classes: string[] = ['unit-icon'];
    if (unit.status) {
      classes.push(`status-${this.toCssClass(unit.status)}`);
    }

    const mainCategory = unit.mainCategory ?? unit.category;
    if (mainCategory) {
      classes.push(`cat-${this.toCssClass(mainCategory)}`);
    }

    const subCategory = unit.subCategory ?? unit.type;
    if (subCategory) {
      classes.push(`sub-${this.toCssClass(subCategory)}`);
    }

    let style = '';
    const faction =
      unit.factionId !== undefined
        ? this.factions.get(unit.factionId)
        : undefined;
    if (faction) {
      style = `border-color:${faction.color};`;
    }

    // rotate according to unit heading
    style += `transform: rotate(${unit.heading}deg);`;

    const label = unit.name ? unit.name.charAt(0).toUpperCase() : 'U';

    return L.divIcon({
      className: classes.join(' '),
      html: `<div style="${style}">${label}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  private createProjectileIcon(projectile: ProjectileMovement): L.DivIcon {
    const classes: string[] = [
      'projectile-icon',
      this.toCssClass(projectile.type),
    ];
    return L.divIcon({
      className: classes.join(' '),
      html: '<div></div>',
      iconSize: [8, 8],
      iconAnchor: [4, 4],
    });
  }

  private projectPosition(
    latitude: number,
    longitude: number,
    headingDeg: number,
    speedMps: number,
    elapsedSec: number,
  ): { latitude: number; longitude: number } {
    if (!speedMps || speedMps <= 0 || elapsedSec <= 0) {
      return { latitude, longitude };
    }

    const distance = speedMps * elapsedSec;
    const headingRad = (headingDeg * Math.PI) / 180;

    const northMeters = Math.cos(headingRad) * distance;
    const eastMeters = Math.sin(headingRad) * distance;

    const metersPerLatDegree = 111_320;
    const latRad = (latitude * Math.PI) / 180;
    const metersPerLonDegree = Math.max(111_320 * Math.cos(latRad), 1e-6);

    return {
      latitude: latitude + northMeters / metersPerLatDegree,
      longitude: longitude + eastMeters / metersPerLonDegree,
    };
  }

  private toCssClass(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
