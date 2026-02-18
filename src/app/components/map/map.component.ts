import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { UnitService } from '../../services/unit.service';
import { Unit } from '../../models/unit';
import { takeUntil } from 'rxjs';
import { BaseComponent } from '../base.component';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent extends BaseComponent implements OnInit {
  private map!: L.Map;
  private unitMarkers = new Map<string, L.Marker>();

  constructor(private unitService: UnitService) {
    super();
  }

  ngOnInit(): void {
    this.initMap();
    this.startPolling();
  }

  private initMap(): void {
    this.map = L.map('map').setView([47.4979, 19.0402], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);
  }

  private startPolling(): void {
    setInterval(() => {
      this.unitService
        .getUnits()
        .pipe(takeUntil(this.destroy$))
        .subscribe((units) => {
          this.updateUnits(units);
        });
    }, 2000);
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
  }
}
