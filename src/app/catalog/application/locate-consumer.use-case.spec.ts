import { TestBed } from '@angular/core/testing';
import { LocationReading } from '../domain/model/location-reading';
import { LocationProvider } from '../domain/ports/location.provider';
import { LocateConsumerUseCase } from './locate-consumer.use-case';

describe('LocateConsumerUseCase', () => {
  const run = (reading: LocationReading) => {
    TestBed.configureTestingModule({
      providers: [{ provide: LocationProvider, useValue: { locate: () => Promise.resolve(reading) } }],
    });
    return TestBed.inject(LocateConsumerUseCase).execute();
  };
  const point = { latitude: -12.0782, longitude: -77.0464 };

  it('searches from a precise reading (CA-03.1)', async () => {
    const start = await run({ status: 'GRANTED', point, accuracyMeters: 12 });

    expect(start.kind).toBe('POINT');
  });

  it('asks for a district when the permission is denied (CA-03.2)', async () => {
    expect(await run({ status: 'DENIED' })).toEqual({ kind: 'PICK_DISTRICT', reason: 'DENIED' });
  });

  it('asks for a district and reports the margin when the reading is imprecise (US46)', async () => {
    expect(await run({ status: 'GRANTED', point, accuracyMeters: 1203.6 })).toEqual({
      kind: 'PICK_DISTRICT',
      reason: 'IMPRECISE',
      accuracyMeters: 1204,
    });
  });

  it('asks for a district outside HTTPS', async () => {
    expect(await run({ status: 'INSECURE_CONTEXT' })).toEqual({ kind: 'PICK_DISTRICT', reason: 'INSECURE_CONTEXT' });
  });
});
