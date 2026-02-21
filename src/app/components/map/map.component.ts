import {
  Component,
  OnInit,
  AfterViewInit,
  Output,
  EventEmitter,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MAP_CONFIG, MapConfig } from '../../config/map.config';
import { UnitDetailsService } from '../../services/unit-details.service';
import { DetailedUnit } from '../../models/detailed-unit';
import { UnitDetailsPanelComponent } from './unit-details-panel/unit-details-panel.component';
import { MapOverlayComponent } from './map-overlay/map-overlay.component';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, UnitDetailsPanelComponent, MapOverlayComponent],
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

  private readonly mapConfig: MapConfig = inject(MAP_CONFIG);
  private map!: L.Map;
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
  selectedUnitDetails: DetailedUnit | null = null;
  selectedUnitId: string | null = null;
  detailsLoading = false;
  detailsErrorKey: string | null = null;
  private detailsRequestSequence = 0;
  private suppressMapClickUntil = 0;

  constructor(
    private movementService: MovementService,
    private factionService: FactionService,
    private unitDetailsService: UnitDetailsService,
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
    setTimeout(
      () => this.map.invalidateSize(),
      this.mapConfig.rendering.mapInvalidateDelayMs,
    );
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
    const mapOptions: L.MapOptions = {
      scrollWheelZoom: this.mapConfig.mapOptions.scrollWheelZoom,
    };

    this.map = L.map(this.mapConfig.mapContainerId, mapOptions).setView(
      [
        this.mapConfig.initialView.latitude,
        this.mapConfig.initialView.longitude,
      ],
      this.mapConfig.initialView.zoom,
    );

    // use the offline-capable tile layer provided by the plugin
    const offlineLayer = (L.tileLayer as any).offline(
      this.mapConfig.tileLayer.url,
      {
        attribution: this.mapConfig.tileLayer.attribution,
        maxZoom: this.mapConfig.tileLayer.maxZoom,
        detectRetina: this.mapConfig.tileLayer.detectRetina,
        useCache: this.mapConfig.tileLayer.useCache,
        crossOrigin: this.mapConfig.tileLayer.crossOrigin,
        cacheMaxAge: this.mapConfig.tileLayer.cacheMaxAgeMs,
        updateWhenIdle: this.mapConfig.tileLayer.updateWhenIdle,
        updateInterval: this.mapConfig.tileLayer.updateInterval,
        keepBuffer: this.mapConfig.tileLayer.keepBuffer,
      },
    );

    offlineLayer.addTo(this.map);

    const initialBounds = L.latLngBounds(
      [
        this.mapConfig.initialBounds.minLatitude,
        this.mapConfig.initialBounds.minLongitude,
      ],
      [
        this.mapConfig.initialBounds.maxLatitude,
        this.mapConfig.initialBounds.maxLongitude,
      ],
    );
    this.map.fitBounds(initialBounds);

    // emit initial view state and subscribe to later changes
    this.emitViewInfo();
    this.map.on(this.mapConfig.rendering.viewChangeEvents, () =>
      this.emitViewInfo(),
    );
    this.map.on('click', () => {
      if (Date.now() < this.suppressMapClickUntil) {
        return;
      }

      this.clearUnitDetails();
    });
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

    // immediately fetch and then start periodic polling
    fetchSnapshot();
    this.pollTimerId = window.setInterval(
      fetchSnapshot,
      this.mapConfig.polling.intervalMs,
    );
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

    if (this.selectedUnitId) {
      if (this.unitMovements.has(this.selectedUnitId)) {
        this.refreshSelectedUnitDetails(false);
      } else {
        this.clearUnitDetails();
      }
    }

    this.renderInterpolatedState(0);
  }

  private startInterpolationLoop(): void {
    const loop = () => {
      const elapsedSec = Math.min(
        (Date.now() - this.lastSnapshotReceivedAt) / 1000,
        this.mapConfig.rendering.maxInterpolationSeconds ??
          this.mapConfig.polling.intervalMs / 1000,
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
        marker.on('click', (event: L.LeafletMouseEvent) => {
          this.suppressMapClickUntil = Date.now() + 250;
          event.originalEvent?.stopPropagation();
          event.originalEvent?.preventDefault();
          this.selectUnitMarker(unit.id);
        });
        this.unitMarkers.set(unit.id, marker);
      } else {
        existing.setIcon(this.createUnitIcon(unit));
        existing.setLatLng(position);
      }
    });

    const currentIds = new Set(this.unitMovements.keys());
    this.unitMarkers.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        this.map.removeLayer(marker);
        this.unitMarkers.delete(id);
        if (this.selectedUnitId === id) {
          this.clearUnitDetails();
        }
      }
    });
  }

  clearUnitDetails(): void {
    const hadSelection = !!this.selectedUnitId;
    this.detailsRequestSequence += 1;
    this.selectedUnitId = null;
    this.selectedUnitDetails = null;
    this.detailsLoading = false;
    this.detailsErrorKey = null;
    if (hadSelection) {
      this.refreshUnitMarkerSelectionState();
    }
  }

  private selectUnitMarker(unitId: string): void {
    if (this.selectedUnitId === unitId) {
      this.clearUnitDetails();
      this.refreshUnitMarkerSelectionState();
      return;
    }

    this.selectedUnitId = unitId;
    this.refreshUnitMarkerSelectionState();
    this.refreshSelectedUnitDetails(true);
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
    const classes: string[] = ['map-unit'];
    if (this.selectedUnitId === unit.id) {
      classes.push('map-unit--selected');
    }
    if (unit.status) {
      classes.push(`map-unit--status-${this.toCssClass(unit.status)}`);
    }

    const mainCategory = unit.category;
    if (mainCategory) {
      classes.push(`map-unit--cat-${this.toCssClass(mainCategory)}`);
    }

    const subCategory = unit.subcategory;
    if (subCategory) {
      classes.push(`map-unit--sub-${this.toCssClass(subCategory)}`);
    }

    let style = '';
    const faction =
      unit.factionId !== undefined
        ? this.factions.get(unit.factionId)
        : undefined;
    if (faction) {
      style = `border-color:${faction.color};`;
    }

    const label = unit.name
      ? unit.name.charAt(0).toUpperCase()
      : this.mapConfig.icons.unit.labelFallback;

    const unitIconSize = this.mapConfig.icons.unit.sizePx;
    const unitIconAnchor = unitIconSize / 2;
    const vectorLength = unitIconSize * 0.6;
    const center = unitIconSize / 2;
    const vectorX = center + unit.directionX * vectorLength;
    const vectorY = center - unit.directionY * vectorLength;

    return L.divIcon({
      className: classes.join(' '),
      html: `<div class="map-unit__content" style="${style}"><div class="map-unit__label">${label}</div><svg class="map-unit__direction-vector" width="${unitIconSize}" height="${unitIconSize}" viewBox="0 0 ${unitIconSize} ${unitIconSize}" aria-hidden="true"><line x1="${center}" y1="${center}" x2="${vectorX}" y2="${vectorY}" /></svg></div>`,
      iconSize: [unitIconSize, unitIconSize],
      iconAnchor: [unitIconAnchor, unitIconAnchor],
    });
  }

  private createProjectileIcon(projectile: ProjectileMovement): L.DivIcon {
    const classes: string[] = [
      'map-projectile',
      `map-projectile--${this.toCssClass(projectile.type)}`,
    ];
    return L.divIcon({
      className: classes.join(' '),
      html: '<div></div>',
      iconSize: [
        this.mapConfig.icons.projectile.sizePx,
        this.mapConfig.icons.projectile.sizePx,
      ],
      iconAnchor: [
        this.mapConfig.icons.projectile.sizePx / 2,
        this.mapConfig.icons.projectile.sizePx / 2,
      ],
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
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private refreshSelectedUnitDetails(showLoading: boolean): void {
    if (!this.selectedUnitId) {
      return;
    }

    const unitId = this.selectedUnitId;
    const requestId = ++this.detailsRequestSequence;

    if (showLoading) {
      this.detailsLoading = true;
    }
    this.detailsErrorKey = null;

    this.unitDetailsService
      .getUnitDetails(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          if (
            requestId !== this.detailsRequestSequence ||
            this.selectedUnitId !== unitId
          ) {
            return;
          }
          this.selectedUnitDetails = details;
          this.detailsLoading = false;
        },
        error: () => {
          if (
            requestId !== this.detailsRequestSequence ||
            this.selectedUnitId !== unitId
          ) {
            return;
          }
          this.detailsLoading = false;
          this.detailsErrorKey = 'UNIT_DETAILS_ERROR';
        },
      });
  }

  private refreshUnitMarkerSelectionState(): void {
    this.unitMovements.forEach((unit) => {
      const marker = this.unitMarkers.get(unit.id);
      if (marker) {
        marker.setIcon(this.createUnitIcon(unit));
      }
    });
  }
}
