import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-map-overlay',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './map-overlay.component.html',
  styleUrl: './map-overlay.component.scss',
})
export class MapOverlayComponent {
  @Input() messageKey: string | null = null;
}
