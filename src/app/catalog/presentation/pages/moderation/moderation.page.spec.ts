import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Session } from '../../../../iam/domain/model/session';
import { SessionStorage } from '../../../../iam/domain/ports/session.storage';
import { ApiError } from '../../../../shared/domain/api-error';
import { ModerationOffer } from '../../../domain/model/moderation';
import { ModerationRepository } from '../../../domain/ports/moderation.repository';
import { ModerationPage } from './moderation.page';

class AdminStorage extends SessionStorage {
  override read(): Session {
    return { accessToken: 't', expiresAt: Date.now() + 60_000, userId: 1, role: 'ADMIN', email: 'admin@geops.pe' };
  }
  override write(): void {}
  override clear(): void {}
}

const OFFER: ModerationOffer = {
  offerId: 1052,
  title: '2x1 en almuerzos ejecutivos',
  category: 'Gastronomía',
  source: 'AFFILIATED',
  businessId: 84,
  businessName: 'Restaurante Don Pepe',
  status: 'PUBLISHED',
  validTo: '2026-11-30',
  openReports: 2,
  verifiedSeal: false,
};

describe('ModerationPage', () => {
  let moderation: jasmine.SpyObj<ModerationRepository>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let fixture: ComponentFixture<ModerationPage>;

  const render = async (answer: string | null = null) => {
    moderation = jasmine.createSpyObj<ModerationRepository>('ModerationRepository', ['findOffers', 'remove', 'findHistory']);
    moderation.findOffers.and.resolveTo({ items: [OFFER], page: 0, totalElements: 1, totalPages: 1 });
    moderation.findHistory.and.resolveTo({
      items: [{ moderationId: 31, offerId: 1052, offerTitle: OFFER.title, adminId: 1, reason: 'Precio engañoso en el anuncio', removedAt: '2026-11-22T15:04:05Z' }],
      page: 0,
      totalElements: 1,
      totalPages: 1,
    });
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({ afterClosed: () => of(answer) } as ReturnType<MatDialog['open']>);
    await TestBed.configureTestingModule({
      imports: [ModerationPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SessionStorage, useClass: AdminStorage },
        { provide: ModerationRepository, useValue: moderation },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ModerationPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const click = async (selector: string) => {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(selector)!.click();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('lists the offers with their business and status (CA-24.1)', async () => {
    await render();

    expect(moderation.findOffers).toHaveBeenCalledWith({ status: null, reportedOnly: false, text: '' }, 0, 20);
    expect(text()).toContain('2x1 en almuerzos ejecutivos');
    expect(text()).toContain('Restaurante Don Pepe');
    expect(text()).toContain('moderationPage.status.PUBLISHED');
  });

  it('asks only for the offers of businesses with open reports', async () => {
    await render();

    await click('[data-testid="reported-only"]');

    expect(moderation.findOffers).toHaveBeenCalledWith({ status: null, reportedOnly: true, text: '' }, 0, 20);
  });

  it('removes the offer with the reason given in the dialog and shows it as removed (CA-24.2)', async () => {
    await render('Precio engañoso en el anuncio');
    moderation.remove.and.resolveTo({
      moderationId: 31,
      offerId: 1052,
      adminId: 1,
      reason: 'Precio engañoso en el anuncio',
      removedAt: '2026-11-22T15:04:05Z',
    });

    await click('[data-testid="remove"]');

    expect(dialog.open).toHaveBeenCalled();
    expect(moderation.remove).toHaveBeenCalledOnceWith(1052, 'Precio engañoso en el anuncio');
    expect(text()).toContain('moderationPage.status.REMOVED');
    expect(text()).toContain('moderationPage.removed');
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="remove"]')).toBeNull();
  });

  it('does nothing when the administrator cancels the dialog', async () => {
    await render(null);

    await click('[data-testid="remove"]');

    expect(moderation.remove).not.toHaveBeenCalled();
    expect(text()).toContain('moderationPage.status.PUBLISHED');
  });

  it('shows the message of Catalog when the removal is rejected', async () => {
    await render('Imagen tomada de otro comercio');
    moderation.remove.and.rejectWith(new ApiError('OFFER_ALREADY_REMOVED', 'La oferta 1052 ya fue retirada del catálogo.'));

    await click('[data-testid="remove"]');

    expect(text()).toContain('La oferta 1052 ya fue retirada del catálogo.');
  });

  it('shows who removed each offer in the history', async () => {
    await render();

    await click('[data-testid="history-tab"]');

    expect(moderation.findHistory).toHaveBeenCalledWith(0, 20);
    expect(text()).toContain('Precio engañoso en el anuncio');
    expect(text()).toContain('moderationPage.history.you');
  });
});
