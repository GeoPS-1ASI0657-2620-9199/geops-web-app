import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { QrScanner } from './qr-scanner';

type Global = { BarcodeDetector?: unknown };

describe('QrScanner', () => {
  const original = (globalThis as Global).BarcodeDetector;

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideTranslateService()] }));
  afterEach(() => {
    (globalThis as Global).BarcodeDetector = original;
  });

  it('stays hidden where the browser cannot read QR codes, so the typed code is the way', () => {
    (globalThis as Global).BarcodeDetector = undefined;
    const fixture = TestBed.createComponent(QrScanner);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('offers "Escanear QR" where the browser can read them', () => {
    (globalThis as Global).BarcodeDetector = class {
      detect() {
        return Promise.resolve([]);
      }
    };
    const fixture = TestBed.createComponent(QrScanner);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')?.textContent).toContain('validatePage.scan.start');
  });
});
