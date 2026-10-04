import { TestBed } from '@angular/core/testing';
import { CartApi } from './cart-api';

describe('SubscriptionsApi', () => {
  let service: CartApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
