import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/** The part of the Shape Detection API used here; not in the TypeScript DOM library yet. */
interface DetectedBarcode { readonly rawValue: string }
interface BarcodeDetectorLike { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> }
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike;

const SCAN_EVERY_MS = 300;

function detectorCtor(): BarcodeDetectorCtor | null {
  const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return ctor && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia ? ctor : null;
}

/**
 * "Escanear QR" for the business: reads the reservation QR with the camera and hands over its text.
 * It is a shortcut, never the only way: it shows only where the browser can read QR codes (Chrome on
 * Android, for one) and the camera needs HTTPS and the user's permission. The typed code stays.
 */
@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (supported) {
      @if (!open()) {
        <button mat-stroked-button type="button" class="start" (click)="start()">
          <mat-icon aria-hidden="true">qr_code_scanner</mat-icon>{{ 'validatePage.scan.start' | translate }}
        </button>
      } @else {
        <div class="scanner">
          <video #video playsinline muted [attr.aria-label]="'validatePage.scan.camera' | translate"></video>
          <p class="hint" role="status">{{ 'validatePage.scan.hint' | translate }}</p>
          <button mat-button type="button" (click)="stop()">{{ 'validatePage.scan.cancel' | translate }}</button>
        </div>
      }
      @if (failed()) {
        <p class="error" role="alert">{{ 'validatePage.scan.failed' | translate }}</p>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .start mat-icon { margin-right: 6px; }
    .scanner { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
    video { width: 100%; max-width: 360px; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-card); background: #000; }
    .hint, .error { margin: 0; font: 400 12px/1.4 var(--font-brand); color: var(--text-dim); }
    .error { color: var(--status-expired); }
  `],
})
export class QrScanner implements OnDestroy {
  readonly scanned = output<string>();
  protected readonly supported = detectorCtor() !== null;
  protected readonly open = signal(false);
  protected readonly failed = signal(false);
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  async start(): Promise<void> {
    const Ctor = detectorCtor();
    if (!Ctor) return;
    this.failed.set(false);
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch {
      this.failed.set(true);
      return;
    }
    this.open.set(true);
    // The <video> exists after this change detection.
    setTimeout(() => {
      const video = this.video()?.nativeElement;
      if (!video || !this.stream) return;
      video.srcObject = this.stream;
      void video.play();
      const detector = new Ctor({ formats: ['qr_code'] });
      this.timer = setInterval(async () => {
        const found = await detector.detect(video).catch(() => []);
        const text = found[0]?.rawValue?.trim();
        if (text) {
          this.stop();
          this.scanned.emit(text);
        }
      }, SCAN_EVERY_MS);
    });
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.open.set(false);
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
