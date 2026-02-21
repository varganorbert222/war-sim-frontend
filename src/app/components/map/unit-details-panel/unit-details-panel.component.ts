import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DetailedUnit } from '../../../models/detailed-unit';

@Component({
  selector: 'app-unit-details-panel',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './unit-details-panel.component.html',
  styleUrl: './unit-details-panel.component.scss',
})
export class UnitDetailsPanelComponent implements OnDestroy {
  @Input() visible = false;
  @Input() details: DetailedUnit | null = null;
  @Input() loading = false;
  @Input() errorKey: string | null = null;

  @Output() closed = new EventEmitter<void>();

  @ViewChild('detailsPanel')
  private detailsPanelRef?: ElementRef<HTMLDivElement>;

  panelTop = 12;
  panelLeft: number | null = null;

  private panelDragOffsetX = 0;
  private panelDragOffsetY = 0;
  private isDraggingPanel = false;
  private readonly onPanelDragMove = (event: MouseEvent) =>
    this.handlePanelDragMove(event);
  private readonly onPanelDragEnd = () => this.stopPanelDrag();

  get panelStyle(): Record<string, string> {
    return {
      top: `${this.panelTop}px`,
      left: this.panelLeft !== null ? `${this.panelLeft}px` : 'auto',
      right: this.panelLeft === null ? '12px' : 'auto',
    };
  }

  onClose(event?: Event): void {
    event?.stopPropagation();
    this.closed.emit();
  }

  startPanelDrag(event: MouseEvent): void {
    if (!this.visible || !this.detailsPanelRef) {
      return;
    }

    const panelRect =
      this.detailsPanelRef.nativeElement.getBoundingClientRect();

    if (this.panelLeft === null) {
      this.panelLeft = panelRect.left;
      this.panelTop = panelRect.top;
    }

    this.panelDragOffsetX = event.clientX - (this.panelLeft ?? panelRect.left);
    this.panelDragOffsetY = event.clientY - this.panelTop;
    this.isDraggingPanel = true;

    window.addEventListener('mousemove', this.onPanelDragMove);
    window.addEventListener('mouseup', this.onPanelDragEnd);
    event.preventDefault();
  }

  ngOnDestroy(): void {
    this.stopPanelDrag();
  }

  private handlePanelDragMove(event: MouseEvent): void {
    if (!this.isDraggingPanel || !this.detailsPanelRef) {
      return;
    }

    const panel = this.detailsPanelRef.nativeElement;
    const rect = panel.getBoundingClientRect();
    const maxLeft = Math.max(window.innerWidth - rect.width - 8, 8);
    const maxTop = Math.max(window.innerHeight - rect.height - 8, 8);

    this.panelLeft = Math.min(
      Math.max(event.clientX - this.panelDragOffsetX, 8),
      maxLeft,
    );
    this.panelTop = Math.min(
      Math.max(event.clientY - this.panelDragOffsetY, 8),
      maxTop,
    );
  }

  private stopPanelDrag(): void {
    this.isDraggingPanel = false;
    window.removeEventListener('mousemove', this.onPanelDragMove);
    window.removeEventListener('mouseup', this.onPanelDragEnd);
  }
}
