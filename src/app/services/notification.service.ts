import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(
    private snackBar: MatSnackBar,
    private translate: TranslateService,
  ) {}

  success(key: string) {
    this.translate.get(key).subscribe((msg) => {
      this.snackBar.open(msg, 'OK', {
        duration: 3000,
        panelClass: ['snackbar-success'],
      });
    });
  }

  error(key: string) {
    this.translate.get(key).subscribe((msg) => {
      this.snackBar.open(msg, 'Dismiss', {
        duration: 5000,
        panelClass: ['snackbar-error'],
      });
    });
  }

  info(key: string) {
    this.translate.get(key).subscribe((msg) => {
      this.snackBar.open(msg, undefined, { duration: 3000 });
    });
  }
}
