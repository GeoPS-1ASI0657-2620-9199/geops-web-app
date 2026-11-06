import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ListSavedBusinessesUseCase, RemoveSavedBusinessUseCase } from '../../../application/saved-businesses.use-cases';
import { SavedBusiness } from '../../../domain/model/saved-business';
import { ApiError } from '../../../../shared/domain/api-error';
@Component({
  selector: 'app-saved-businesses',
  imports: [MatButtonModule, TranslateModule],
  template: `<section [attr.aria-busy]="loading()">
    @if (loading()) { <p role="status">{{ 'savedBusinesses.loading' | translate }}</p> }
    @if (error(); as message) { <div role="alert"><p>{{ message | translate }}</p><button mat-stroked-button (click)="load()">{{ 'savedBusinesses.retry' | translate }}</button></div> }
    @if (!loading() && !error() && businesses().length === 0) { <p>{{ 'savedBusinesses.empty' | translate }}</p> }
    <ul>@for (business of businesses(); track business.businessId) { <li><h2>{{ business.businessName }}</h2><button mat-stroked-button [disabled]="busy() !== null" (click)="remove(business.businessId)">{{ 'savedBusinesses.remove' | translate }}<span class="sr-only"> {{ business.businessName }}</span></button></li> }</ul>
  </section>`,
  styles: [`ul { list-style: none; padding: 0; } li { display: flex; justify-content: space-between; align-items: start; gap: var(--space-lg); padding-block: var(--space-xl); border-bottom: 1px solid var(--neutral-line); } h2 { margin: 0; font: 600 18px/1.4 var(--font-brand); overflow-wrap: anywhere; } .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); } @media (max-width: 600px) { li { flex-direction: column; } }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedBusinesses implements OnInit {
  private readonly list = inject(ListSavedBusinessesUseCase);
  private readonly removeBusiness = inject(RemoveSavedBusinessUseCase);
  readonly businesses = signal<SavedBusiness[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  ngOnInit() { void this.load(); }
  async load() {
    this.loading.set(true); this.error.set(null);
    try { this.businesses.set(await this.list.execute()); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'savedBusinesses.error'); }
    finally { this.loading.set(false); }
  }
  async remove(businessId: number) {
    if (this.busy() !== null) return;
    this.busy.set(businessId); this.error.set(null);
    try { await this.removeBusiness.execute(businessId); this.businesses.update(items => items.filter(b => b.businessId !== businessId)); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'savedBusinesses.error'); }
    finally { this.busy.set(null); }
  }
}
