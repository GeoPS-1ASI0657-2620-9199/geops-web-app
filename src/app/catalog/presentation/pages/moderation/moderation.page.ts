import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../../../iam/application/session.store';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoSeal, SealKind } from '../../../../shared/ui/geo-seal/geo-seal';
import { ListModerationHistoryUseCase } from '../../../application/list-moderation-history.use-case';
import { ListOffersForModerationUseCase } from '../../../application/list-offers-for-moderation.use-case';
import { RemoveOfferUseCase } from '../../../application/remove-offer.use-case';
import {
  ModeratedOfferStatus,
  ModerationEntry,
  ModerationFilter,
  ModerationOffer,
  ModerationResults,
} from '../../../domain/model/moderation';
import { RemoveOfferDialog, RemoveOfferDialogData } from '../../components/remove-offer-dialog/remove-offer-dialog';

type ViewState = 'loading' | 'ready' | 'empty' | 'error';
type View = 'offers' | 'history';
type StatusFilter = ModeratedOfferStatus | 'ALL';

export const MODERATION_SEAL: Record<ModeratedOfferStatus, SealKind> = {
  PUBLISHED: 'active',
  EXPIRED: 'expired',
  REMOVED: 'withdrawn',
};

const EMPTY_PAGE = { items: [], page: 0, totalElements: 0, totalPages: 0 };

/**
 * "Moderación" of the administrator (US24): the offers of the catalog with their status, the action
 * to remove one with its reason, and the history of who removed what.
 */
@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, TranslateModule, GeoAlert, GeoEmptyState, GeoSeal],
  templateUrl: './moderation.page.html',
  styleUrl: './moderation.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModerationPage implements OnInit {
  private readonly sessions = inject(SessionStore);
  private readonly listOffers = inject(ListOffersForModerationUseCase);
  private readonly removeOffer = inject(RemoveOfferUseCase);
  private readonly listHistory = inject(ListModerationHistoryUseCase);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);

  protected readonly statusFilters: StatusFilter[] = ['ALL', 'PUBLISHED', 'EXPIRED', 'REMOVED'];
  protected readonly seals = MODERATION_SEAL;
  protected readonly view = signal<View>('offers');
  protected readonly status = signal<StatusFilter>('ALL');
  protected readonly reportedOnly = signal(false);
  protected readonly text = signal('');

  protected readonly offersState = signal<ViewState>('loading');
  protected readonly offers = signal<ModerationResults<ModerationOffer>>(EMPTY_PAGE);
  protected readonly historyState = signal<ViewState>('loading');
  protected readonly history = signal<ModerationResults<ModerationEntry>>(EMPTY_PAGE);
  protected readonly errorMessage = signal<string | null>(null);
  /** The offer being removed; its button stays disabled meanwhile. */
  protected readonly removing = signal<number | null>(null);
  protected readonly removeError = signal<string | null>(null);
  protected readonly removed = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadOffers();
  }

  async loadOffers(page = 0): Promise<void> {
    this.clearFeedback();
    this.offersState.set('loading');
    try {
      const result = await this.listOffers.execute(this.filter(), page);
      this.offers.set(result);
      this.offersState.set(result.totalElements ? 'ready' : 'empty');
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : null);
      this.offersState.set('error');
    }
  }

  async loadHistory(page = 0): Promise<void> {
    this.historyState.set('loading');
    try {
      const result = await this.listHistory.execute(page);
      this.history.set(result);
      this.historyState.set(result.totalElements ? 'ready' : 'empty');
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : null);
      this.historyState.set('error');
    }
  }

  protected show(view: View): void {
    this.clearFeedback();
    this.view.set(view);
    if (view === 'history') {
      void this.loadHistory();
    } else {
      void this.loadOffers(this.offers().page);
    }
  }

  protected filterByStatus(status: StatusFilter): void {
    this.status.set(status);
    void this.loadOffers();
  }

  protected toggleReported(): void {
    this.reportedOnly.update((on) => !on);
    void this.loadOffers();
  }

  protected search(event: Event): void {
    event.preventDefault();
    void this.loadOffers();
  }

  protected typed(event: Event): void {
    this.text.set((event.target as HTMLInputElement).value);
  }

  /** Asks for the reason; on confirm, Catalog removes the offer and the row shows it as removed. */
  async remove(offer: ModerationOffer): Promise<void> {
    const reason = await this.askReason(offer);
    if (!reason) {
      return;
    }
    this.removeError.set(null);
    this.removed.set(null);
    this.removing.set(offer.offerId);
    try {
      const changed = await this.removeOffer.execute(offer, reason);
      this.offers.update((page) => ({
        ...page,
        items: page.items.map((item) => (item.offerId === changed.offerId ? changed : item)),
      }));
      this.removed.set(offer.title);
    } catch (error) {
      this.removeError.set(
        error instanceof ApiError ? error.message : this.translate.instant('moderationPage.removeError'),
      );
    } finally {
      this.removing.set(null);
    }
  }

  protected isMe(entry: ModerationEntry): boolean {
    return this.sessions.session()?.userId === entry.adminId;
  }

  /** The result of a removal belongs to the list it happened on; another filter, page or tab drops it. */
  private clearFeedback(): void {
    this.removed.set(null);
    this.removeError.set(null);
  }

  private filter(): ModerationFilter {
    const status = this.status();
    return { status: status === 'ALL' ? null : status, reportedOnly: this.reportedOnly(), text: this.text() };
  }

  private async askReason(offer: ModerationOffer): Promise<string | null> {
    const data: RemoveOfferDialogData = { title: offer.title, businessName: offer.businessName };
    const answer = await firstValueFrom(
      this.dialog.open<RemoveOfferDialog, RemoveOfferDialogData, string | null>(RemoveOfferDialog, {
        data,
        autoFocus: 'first-tabbable',
      }).afterClosed(),
    );
    return typeof answer === 'string' && answer ? answer : null;
  }
}
