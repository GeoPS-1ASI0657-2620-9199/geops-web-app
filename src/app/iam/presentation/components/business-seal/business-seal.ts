import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { VerifyBusinessUseCase } from '../../../application/verify-business.use-case';

/**
 * The seal of the owner's business as Identity has it (E2-16): "Verificado" only when the profile is
 * VERIFIED; otherwise the way to "Verificar mi comercio" (US38). Nothing shows while it is unknown.
 */
@Component({
  selector: 'app-business-seal',
  standalone: true,
  imports: [RouterLink, TranslateModule, GeoSeal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (verification.verificationStatus()) {
      @case (null) {}
      @case ('VERIFIED') {
        <geo-seal kind="verified" data-testid="business-seal" [text]="name() ?? ('seal.verified' | translate)" />
      }
      @case ('PENDING') {
        <span class="seal-row">
          @if (name()) {
            <span class="name">{{ name() }}</span>
          }
          <geo-seal kind="pending" [text]="'verifyBusiness.status.PENDING' | translate" />
        </span>
      }
      @default {
        <span class="seal-row">
          @if (name()) {
            <span class="name">{{ name() }}</span>
          }
          <a class="link" routerLink="/business/verify" data-testid="verify-business-link">
            {{ 'verifyBusiness.link' | translate }}
          </a>
        </span>
      }
    }
  `,
  styles: [
    `
      .seal-row { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 10px; }
      .name { font: 500 13px/1.3 var(--font-brand); color: var(--text-primary); }
      .link { font: 500 12.5px/1 var(--font-brand); color: var(--brand-action); }
    `,
  ],
})
export class BusinessSeal implements OnInit {
  protected readonly verification = inject(VerifyBusinessUseCase);
  /** Text of the verified seal, e.g. the business name; "Verificado" when absent. */
  readonly name = input<string | null>(null);

  ngOnInit(): void {
    if (this.verification.verificationStatus() === null) {
      // Without the status the seal stays hidden: never a seal the business does not have.
      this.verification.profile().catch(() => undefined);
    }
  }
}
