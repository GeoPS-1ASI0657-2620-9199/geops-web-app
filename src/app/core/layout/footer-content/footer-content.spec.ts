import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterContent } from './footer-content';

describe('FooterContent', () => {
  let component: FooterContent;
  let fixture: ComponentFixture<FooterContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterContent],
      providers: [provideHttpClient(), provideRouter([]), provideTranslateService()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
