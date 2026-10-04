import { TestBed } from '@angular/core/testing';
import { SubscriptionsApi } from './subscriptions-api';

describe('SubscriptionsApi', () => {
  let service: SubscriptionsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubscriptionsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
