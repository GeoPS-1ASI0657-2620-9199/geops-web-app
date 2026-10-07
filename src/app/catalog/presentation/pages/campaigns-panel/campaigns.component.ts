import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStore } from '../../../../iam/application/session.store';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';

/**
 * Campaign panel of a business owner (US23, GEO-82). In the Sprint 1 it has no list: Catalog has no
 * endpoint to read campaigns yet (E-10), so it shows the entry to publish one and the confirmation
 * of the last one created.
 */
@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule, GeoAlert, GeoEmptyState],
  templateUrl: './campaigns.component.html',
  styleUrl: './campaigns.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsComponent {
  protected readonly sessions = inject(SessionStore);
  protected readonly justCreated = inject(ActivatedRoute).snapshot.queryParamMap.has('created');
}
