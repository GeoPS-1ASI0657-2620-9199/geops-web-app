import { ChangeDetectionStrategy, Component, OnChanges, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { FollowBusinessUseCase, ListFollowedBusinessesUseCase, UnfollowBusinessUseCase } from '../../../application/follows.use-cases';
import { ApiError } from '../../../../shared/domain/api-error';

/**
 * "Seguir comercio" on the offer detail (US13). It asks Engagement on every business it is given,
 * so any offer of a followed business says "Siguiendo", and it never shows the state of the
 * business of the previous offer while it asks.
 */
@Component({
  selector: 'app-follow-business',
  imports: [MatButtonModule, TranslateModule],
  template: `<button mat-stroked-button [disabled]="busy()" [attr.aria-pressed]="following()" (click)="toggle()">{{ (following() ? 'followsPage.following' : 'followsPage.follow') | translate }}</button>
    @if (error(); as message) { <p role="alert">{{ message | translate }}</p> }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowBusiness implements OnChanges {
  readonly businessId = input.required<number>();
  private readonly list = inject(ListFollowedBusinessesUseCase);
  private readonly follow = inject(FollowBusinessUseCase);
  private readonly unfollow = inject(UnfollowBusinessUseCase);
  readonly following = signal(false);
  readonly busy = signal(true);
  readonly error = signal<string | null>(null);

  ngOnChanges(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const id = this.businessId();
    this.following.set(false);
    this.busy.set(true);
    this.error.set(null);
    try {
      const items = await this.list.execute();
      if (id === this.businessId()) this.following.set(items.some((business) => business.businessId === id));
    } catch (error) {
      if (id === this.businessId()) this.error.set(error instanceof ApiError ? error.message : 'followsPage.error');
    } finally {
      if (id === this.businessId()) this.busy.set(false);
    }
  }

  async toggle(): Promise<void> {
    if (this.busy()) return;
    const id = this.businessId();
    this.busy.set(true);
    this.error.set(null);
    try {
      if (this.following()) await this.unfollow.execute(id);
      else await this.follow.execute(id);
      if (id === this.businessId()) this.following.update((value) => !value);
    } catch (error) {
      if (id === this.businessId()) this.error.set(error instanceof ApiError ? error.message : 'followsPage.error');
    } finally {
      if (id === this.businessId()) this.busy.set(false);
    }
  }
}
