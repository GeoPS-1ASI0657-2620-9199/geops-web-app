import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ListFollowedBusinessesUseCase, UnfollowBusinessUseCase } from '../../../application/follows.use-cases';
import { FollowedBusiness } from '../../../domain/model/followed-business';
import { ApiError } from '../../../../shared/domain/api-error';

@Component({
  selector: 'app-follows',
  imports: [RouterLink, MatButtonModule, TranslateModule],
  templateUrl: './follows.page.html',
  styleUrl: './follows.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowsPage implements OnInit {
  private readonly list = inject(ListFollowedBusinessesUseCase);
  private readonly unfollow = inject(UnfollowBusinessUseCase);
  readonly businesses = signal<FollowedBusiness[]>([]);
  readonly loading = signal(true);
  readonly removing = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit() { void this.load(); }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try { this.businesses.set(await this.list.execute()); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'followsPage.error'); }
    finally { this.loading.set(false); }
  }

  async remove(businessId: number) {
    if (this.removing() !== null) return;
    this.removing.set(businessId);
    this.error.set(null);
    try {
      await this.unfollow.execute(businessId);
      this.businesses.update(list => list.filter(b => b.businessId !== businessId));
    } catch (error) { this.error.set(error instanceof ApiError ? error.message : 'followsPage.error'); }
    finally { this.removing.set(null); }
  }
}
