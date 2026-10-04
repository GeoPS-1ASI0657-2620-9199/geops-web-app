import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolbarHelpComponent } from './toolbar-help.component';

describe('ToolbarHelpComponent', () => {
  let component: ToolbarHelpComponent;
  let fixture: ComponentFixture<ToolbarHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToolbarHelpComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el título "Centro de Ayuda"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Centro de Ayuda');
  });
});
