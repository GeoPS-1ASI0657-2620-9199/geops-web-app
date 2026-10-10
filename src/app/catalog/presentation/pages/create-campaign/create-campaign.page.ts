import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SessionStore } from '../../../../iam/application/session.store';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoPoint } from '../../../../shared/domain/geo-point';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoLocationPicker } from '../../../../shared/ui/geo-location-picker/geo-location-picker';
import { CreateCampaignUseCase } from '../../../application/create-campaign.use-case';
import { CampaignZone, todayInLima } from '../../../domain/model/campaign';
import { ZoneSelector } from '../../components/zone-selector/zone-selector';

/** Same limit as OfferJpaEntity.IMAGE_URL_LENGTH in catalog-service. */
const IMAGE_URL_MAX_LENGTH = 500;
const NAME_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 500;
const ADDRESS_MAX_LENGTH = 255;
/** Codes about the end date: the field is marked as well as the alert (CA-05.3). */
const END_DATE_CODES = ['CAMPAIGN_ALREADY_ENDED', 'INVALID_CAMPAIGN_PERIOD'];

/** Campaign with its validity, store location, zone and offers (US05, US06; Figma 7 and 37). */
@Component({
  selector: 'app-create-campaign',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    GeoAlert,
    GeoLocationPicker,
    GeoSeal,
    ZoneSelector,
  ],
  templateUrl: './create-campaign.page.html',
  styleUrl: './create-campaign.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCampaignPage {
  private readonly createCampaign = inject(CreateCampaignUseCase);
  private readonly router = inject(Router);
  private readonly sessions = inject(SessionStore);
  protected readonly businessName = computed(() => this.sessions.session()?.businessName ?? null);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  protected readonly today = todayInLima();
  protected readonly storePoint = signal<GeoPoint | null>(null);
  protected readonly zone = signal<CampaignZone | null>(null);
  protected readonly alert = signal<{ title: string; description: string } | null>(null);
  protected readonly submitting = signal(false);
  /** The end date the server or the rules rejected; read by a validator so it survives redraws. */
  private readonly rejectedEnd = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    description: ['', Validators.maxLength(DESCRIPTION_MAX_LENGTH)],
    start: [this.today, Validators.required],
    end: ['', [Validators.required, (_: AbstractControl): ValidationErrors | null => (this.rejectedEnd() ? { rule: true } : null)]],
    budget: [null as number | null, Validators.min(0)],
    address: ['', [Validators.required, Validators.maxLength(ADDRESS_MAX_LENGTH)]],
    offers: this.fb.array([this.offerGroup()]),
  });

  constructor() {
    this.form.controls.end.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      if (this.rejectedEnd()) {
        this.rejectedEnd.set(false);
        this.form.controls.end.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  get offers(): FormArray {
    return this.form.controls.offers;
  }

  addOffer(): void {
    this.offers.push(this.offerGroup());
  }

  removeOffer(index: number): void {
    if (this.offers.length > 1) {
      this.offers.removeAt(index);
    }
  }

  onStorePoint(point: GeoPoint): void {
    this.storePoint.set(point);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const zone = this.zone();
    if (!zone) {
      this.alert.set({
        title: 'Falta la zona de la campaña',
        description: 'Marca tu local en el mapa para usar un radio, o elige un distrito.',
      });
      this.revealAlert();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.alert.set(null);
    try {
      await this.createCampaign.execute({
        businessName: this.sessions.session()?.businessName ?? '',
        name: value.name,
        description: value.description,
        period: { start: value.start, end: value.end },
        estimatedBudget: value.budget,
        storeLocation: { address: value.address, point: this.storePoint() },
        zone,
        offers: value.offers.map((offer) => ({
          title: offer.title,
          conditions: offer.conditions,
          price: Number(offer.price),
          validTo: offer.validTo,
          category: offer.category,
          imageUrl: offer.imageUrl?.trim() || null,
        })),
      });
      await this.router.navigate(['/campaigns'], { queryParams: { created: 1 } });
    } catch (error) {
      this.showError(error);
    } finally {
      this.submitting.set(false);
    }
  }

  private showError(error: unknown): void {
    const apiError = error instanceof ApiError ? error : null;
    if (apiError && END_DATE_CODES.includes(apiError.code)) {
      this.rejectedEnd.set(true);
      this.form.controls.end.updateValueAndValidity({ emitEvent: false });
      this.form.controls.end.markAsTouched();
    }
    this.alert.set({
      title: apiError?.code === 'CAMPAIGN_ALREADY_ENDED' ? 'La vigencia que elegiste ya pasó' : 'No pudimos publicar la campaña',
      description: apiError?.message ?? 'Inténtalo de nuevo en un momento.',
    });
    this.revealAlert();
  }

  /** The alert sits above the form and the owner is at the button, so bring it into view. */
  private revealAlert(): void {
    afterNextRender(
      () => {
        const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.host.nativeElement
          .querySelector('geo-alert')
          ?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
      },
      { injector: this.injector },
    );
  }

  private offerGroup() {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
      conditions: ['', [Validators.required, Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
      price: [null as number | null, [Validators.required, Validators.min(0.01)]],
      validTo: ['', Validators.required],
      category: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
      imageUrl: ['', [Validators.maxLength(IMAGE_URL_MAX_LENGTH), Validators.pattern(/^https:\/\/\S+$/)]],
    });
  }
}
