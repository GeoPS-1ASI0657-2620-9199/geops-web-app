import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStore } from '../../../../iam/application/session.store';
import { BusinessReviews } from '../../components/business-reviews/business-reviews';
@Component({
  selector: 'app-business-comments',
  imports: [BusinessReviews, TranslateModule],
  template: `<section class="page"><h1>{{ 'reviewsPage.panelTitle' | translate }}</h1><p>{{ 'reviewsPage.panelHint' | translate }}</p>@if (sessions.activeSession()?.businessId; as businessId) { <app-business-reviews [businessId]="businessId" [canReply]="true" /> } @else { <p role="alert">{{ 'reviewsPage.missingBusiness' | translate }}</p> }</section>`,
  styles: [`.page { max-width: 960px; margin-inline: auto; padding: var(--space-2xl) var(--space-xl); } h1 { font: 600 24px/1.3 var(--font-brand); } p { color: var(--text-dim); line-height: 1.6; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessCommentsPage { readonly sessions = inject(SessionStore); }
