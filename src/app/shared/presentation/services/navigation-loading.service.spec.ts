import { TestBed } from '@angular/core/testing';
import { NavigationLoadingService } from './navigation-loading.service';

describe('NavigationLoadingService', () => {
  let service: NavigationLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationLoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with isNavigating as false', () => {
    expect(service.isNavigating()).toBe(false);
  });

  it('should show backdrop', () => {
    service.showBackdrop();
    expect(service.isNavigating()).toBe(true);
  });

  it('should hide backdrop', () => {
    service.showBackdrop();
    service.hideBackdrop();
    expect(service.isNavigating()).toBe(false);
  });

  it('should toggle backdrop', () => {
    expect(service.isNavigating()).toBe(false);
    service.toggleBackdrop();
    expect(service.isNavigating()).toBe(true);
    service.toggleBackdrop();
    expect(service.isNavigating()).toBe(false);
  });
});
