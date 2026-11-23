import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as L from 'leaflet';
import { GeoOffersMap } from './geo-offers-map';

describe('GeoOffersMap', () => {
  let fixture: ComponentFixture<GeoOffersMap>;
  let failures: number;

  const create = async (timeoutMs: number) => {
    await TestBed.configureTestingModule({ imports: [GeoOffersMap] }).compileComponents();
    fixture = TestBed.createComponent(GeoOffersMap);
    fixture.componentRef.setInput('loadTimeoutMs', timeoutMs);
    fixture.componentRef.setInput('ariaLabel', 'Mapa de ofertas cercanas');
    fixture.componentRef.setInput('center', { latitude: -12.12, longitude: -77.03 });
    failures = 0;
    fixture.componentInstance.failed.subscribe(() => failures++);
    fixture.detectChanges();
  };
  const tiles = (): L.TileLayer => {
    let layer: L.TileLayer | null = null;
    (fixture.componentInstance as unknown as { map: L.Map }).map.eachLayer((l) => {
      if (l instanceof L.TileLayer) {
        layer = l;
      }
    });
    return layer!;
  };

  afterEach(() => fixture.destroy());

  it('names the map with the label the screen translated', async () => {
    await create(60_000);

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="region"]')?.getAttribute('aria-label')).toBe(
      'Mapa de ofertas cercanas',
    );
  });

  it('names the zoom buttons in Spanish', async () => {
    await create(60_000);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.leaflet-control-zoom-in')?.getAttribute('aria-label')).toBe('Acercar');
    expect(host.querySelector('.leaflet-control-zoom-out')?.getAttribute('title')).toBe('Alejar');
  });

  it('names each pin with the offer it points to', async () => {
    await create(60_000);
    fixture.componentRef.setInput('pins', [
      { id: 7, point: { latitude: -12.12, longitude: -77.03 }, icon: 'restaurant', label: 'La Esquina: Menú 2x1', kind: 'verified' },
    ]);
    fixture.detectChanges();

    const pin = (fixture.nativeElement as HTMLElement).querySelector('.leaflet-marker-icon[title="La Esquina: Menú 2x1"]');
    expect(pin?.getAttribute('aria-label')).toBe('La Esquina: Menú 2x1');
  });

  it('emits failed once when the tiles answer with an error (US09, QAS12)', async () => {
    await create(60_000);

    tiles().fire('tileerror');
    tiles().fire('tileerror');

    expect(failures).toBe(1);
  });

  it('emits failed when the tiles do not load in time', async () => {
    await create(5);

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(failures).toBe(1);
  });

  it('keeps a map that already loaded when a later tile fails', async () => {
    await create(5);

    tiles().fire('load');
    tiles().fire('tileerror');
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(failures).toBe(0);
  });
});
