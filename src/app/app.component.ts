import { Component } from '@angular/core';
import { NotificationService } from './services/notification.service';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MapComponent } from './components/map/map.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatSnackBarModule,
    TranslateModule,
    MapComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(
    private notify: NotificationService,
    private translate: TranslateService,
  ) {
    // set up translations
    const browserLang = navigator.language.split('-')[0];
    const lang = browserLang === 'hu' ? 'hu' : 'en';
    this.translate.addLangs(['en', 'hu']);
    this.translate.setDefaultLang('en');
    this.translate.use(lang);

    // notify user when connectivity changes
    window.addEventListener('online', () => this.notify.info('BACK_ONLINE'));
    window.addEventListener('offline', () => this.notify.error('OFFLINE'));

    // update clock every second
    setInterval(
      () =>
        (this.currentTime = new Date().toLocaleTimeString(this.locale, {
          timeZone: this.timezone,
        })),
      1000,
    );
  }

  // data displayed in footer
  lastLat = 0;
  lastLng = 0;
  zoom = 0;
  place = 'n/a';
  unitCount = 0;
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  locale = navigator.language;
  currentTime = new Date().toLocaleTimeString(this.locale, {
    timeZone: this.timezone,
  });

  async onViewChanged(info: { lat: number; lng: number; zoom: number }) {
    // run on next macrotask so change detection has finished
    setTimeout(async () => {
      this.lastLat = info.lat;
      this.lastLng = info.lng;
      this.zoom = info.zoom;
      await this.lookupLocation(info.lat, info.lng);
    });
  }

  onStatsChanged(stats: { unitCount: number }) {
    this.unitCount = stats.unitCount;
  }

  private async lookupLocation(lat: number, lng: number) {
    try {
      // we proxy requests through Angular dev server to bypass CORS
      const response = await fetch(
        `/api/nominatim/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      );
      const data: any = await response.json();
      this.place = data.display_name || 'n/a';
    } catch {
      this.place = 'n/a';
    }
  }
}
