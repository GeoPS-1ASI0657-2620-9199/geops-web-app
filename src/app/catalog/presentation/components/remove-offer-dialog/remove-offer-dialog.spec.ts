import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { RemoveOfferDialog } from './remove-offer-dialog';

describe('RemoveOfferDialog', () => {
  let dialogRef: jasmine.SpyObj<MatDialogRef<RemoveOfferDialog, string | null>>;

  const render = async () => {
    dialogRef = jasmine.createSpyObj<MatDialogRef<RemoveOfferDialog, string | null>>('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [RemoveOfferDialog],
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: { title: '2x1 en almuerzos', businessName: 'Restaurante Don Pepe' } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RemoveOfferDialog);
    fixture.detectChanges();
    return fixture;
  };

  const type = (element: HTMLElement, value: string) => {
    const reason = element.querySelector<HTMLTextAreaElement>('[data-testid="reason"]')!;
    reason.value = value;
    reason.dispatchEvent(new Event('input'));
  };

  it('does not close without a reason of at least 10 characters', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    type(element, '  spam ');

    element.querySelector<HTMLButtonElement>('[data-testid="confirm-remove"]')!.click();
    fixture.detectChanges();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(element.textContent).toContain('moderationPage.removeDialog.reasonError');
  });

  it('closes with the reason without the surrounding spaces', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    type(element, '  Imagen tomada de otro comercio  ');

    element.querySelector<HTMLButtonElement>('[data-testid="confirm-remove"]')!.click();

    expect(dialogRef.close).toHaveBeenCalledOnceWith('Imagen tomada de otro comercio');
  });
});
