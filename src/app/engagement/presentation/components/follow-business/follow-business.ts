import { ChangeDetectionStrategy, Component, OnChanges, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { FollowBusinessUseCase, ListFollowedBusinessesUseCase, UnfollowBusinessUseCase } from '../../../application/follows.use-cases';
import { ApiError } from '../../../../shared/domain/api-error';

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
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  ngOnChanges() { void this.load(); }

  private async load() {
    const id = this.businessId();
    this.busy.set(true);
    this.error.set(null);
    try { const items = await this.list.execute(); if (id === this.businessId()) this.following.set(items.some(b => b.businessId === id)); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'followsPage.error'); }
    finally { this.busy.set(false); }
  }

  async toggle() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      if (this.following()) await this.unfollow.execute(this.businessId());
      else await this.follow.execute(this.businessId());
      this.following.update(value => !value);
    } catch (error) { this.error.set(error instanceof ApiError ? error.message : 'followsPage.error'); }
    finally { this.busy.set(false); }
  }
}
