import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStore } from '../../../../iam/application/session.store';
import { BusinessSeal } from '../../../../iam/presentation/components/business-seal/business-seal';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoPoint } from '../../../../shared/domain/geo-point';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoLocationPicker } from '../../../../shared/ui/geo-location-picker/geo-location-picker';
import { TranslatedDatepickerIntl } from '../../../../shared/ui/translated-datepicker-intl';
import { CreateCampaignUseCase } from '../../../application/create-campaign.use-case';
import { UploadOfferImageUseCase } from '../../../application/upload-offer-image.use-case';
import { ListMyCampaignsUseCase } from '../../../application/list-my-campaigns.use-case';
import { VerifyBusinessUseCase } from '../../../../iam/application/verify-business.use-case';
import { ListOfferCategoriesUseCase } from '../../../application/list-offer-categories.use-case';
import { CampaignZone, hasValidRegularPrice, todayInLima } from '../../../domain/model/campaign';
import { ZoneSelector } from '../../components/zone-selector/zone-selector';
import { isoDatepickerProviders } from './iso-date-adapter';

/** Same limit as OfferJpaEntity.IMAGE_URL_LENGTH in catalog-service. */
const IMAGE_URL_MAX_LENGTH = 500;
const NAME_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 500;
const ADDRESS_MAX_LENGTH = 255;
/** Codes about the end date: the field is marked as well as the alert (CA-05.3). */
const END_DATE_CODES = ['CAMPAIGN_ALREADY_ENDED', 'INVALID_CAMPAIGN_PERIOD'];
const MIN_PRICE = 0.01;
const httpsLink = Validators.pattern(/^https:\/\/\S+$/);
const PHOTO_UPLOAD_FAILED = 'No pudimos subir la foto. Inténtalo de nuevo.';

/** A photo chosen for an offer: its local preview while and after it uploads. */
interface OfferPhoto {
  readonly preview: string;
  readonly busy: boolean;
}

/** Empty, or above the price of the same offer (same rule as Catalog). */
function regularAbovePrice(control: AbstractControl): ValidationErrors | null {
  const regularPrice = control.value as number | null;
  const price = control.parent?.get('price')?.value as number | null | undefined;
  if (regularPrice == null || price == null) {
    return null;
  }
  return hasValidRegularPrice({ price: Number(price), regularPrice: Number(regularPrice) }) ? null : { notAbovePrice: true };
}

/** An uploaded photo already carries its address; a pasted link must be https. */
function linkOrUploadedPhoto(control: AbstractControl): ValidationErrors | null {
  return control.parent?.get('imageId')?.value ? null : httpsLink(control);
}

function withEntry<V>(map: ReadonlyMap<AbstractControl, V>, key: AbstractControl, value: V | null): ReadonlyMap<AbstractControl, V> {
  const next = new Map(map);
  if (value === null) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  return next;
}

/** Campaign with its validity, store location, zone and offers (US05, US06; Figma 7 and 37). */
@Component({
  selector: 'app-create-campaign',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    GeoAlert,
    GeoLocationPicker,
    BusinessSeal,
    ZoneSelector,
  ],
  providers: [
    // The calendar labels in the language of the app (Spanish by default), only where a datepicker exists.
    { provide: MatDatepickerIntl, useClass: TranslatedDatepickerIntl },
...isoDatepickerProviders],
  templateUrl: './create-campaign.page.html',
  styleUrl: './create-campaign.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCampaignPage {
  private readonly createCampaign = inject(CreateCampaignUseCase);
  private readonly uploadImage = inject(UploadOfferImageUseCase);
  private readonly destroyRef = inject(DestroyRef);
  private readonly listCategories = inject(ListOfferCategoriesUseCase);
  private readonly router = inject(Router);
  private readonly sessions = inject(SessionStore);
  protected readonly businessName = computed(() => this.sessions.session()?.businessName ?? null);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  protected readonly today = todayInLima();
  protected readonly storePoint = signal<GeoPoint | null>(null);
  protected readonly zone = signal<CampaignZone | null>(null);
  /** Radius drawn on the store map; a district zone draws none. */
  protected readonly zoneRadius = computed(() => {
    const zone = this.zone();
    return zone?.type === 'RADIUS' ? zone.radiusMeters : null;
  });
  /** True when the store came filled from the profile and the last campaign. */
  protected readonly prefilled = signal(false);
  private readonly verification = inject(VerifyBusinessUseCase);
  private readonly myCampaigns = inject(ListMyCampaignsUseCase);
  protected readonly alert = signal<{ title: string; description: string } | null>(null);
  protected readonly submitting = signal(false);
  /** The closed list of Catalog for the category selector (US08, E2-06). */
  protected readonly categories = signal<string[]>([]);
  protected readonly categoriesFailed = signal(false);
  /** The end date the server or the rules rejected; read by a validator so it survives redraws. */
  private readonly rejectedEnd = signal(false);
  /** Offers whose "Vence" the owner chose; the others follow the end of the campaign. */
  private readonly ownValidTo = new WeakSet<AbstractControl>();
  private readonly photos = signal<ReadonlyMap<AbstractControl, OfferPhoto>>(new Map());
  private readonly photoErrors = signal<ReadonlyMap<AbstractControl, string>>(new Map());
  /** Publishing waits until every chosen photo is stored. */
  protected readonly uploading = computed(() => [...this.photos().values()].some((photo) => photo.busy));

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
    this.form.controls.end.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((end) => {
      if (this.rejectedEnd()) {
        this.rejectedEnd.set(false);
        this.form.controls.end.updateValueAndValidity({ emitEvent: false });
      }
      this.followEnd(end);
    });
    this.destroyRef.onDestroy(() => this.photos().forEach((photo) => URL.revokeObjectURL(photo.preview)));
    void this.loadCategories();
    void this.prefillStore();
  }

  /** The store is the same every time: its address from the profile and its point from the last campaign. */
  private async prefillStore(): Promise<void> {
    const [profile, point] = await Promise.all([
      this.verification.profile().catch(() => null),
      this.myCampaigns.lastStorePoint().catch(() => null),
    ]);
    const address = this.form.controls.address;
    if (profile?.address && !address.value) {
      address.setValue(profile.address);
    }
    if (point && !this.storePoint()) {
      this.storePoint.set(point);
    }
    this.prefilled.set(!!profile?.address || !!point);
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories.set(await this.listCategories.execute());
    } catch {
      this.categoriesFailed.set(true);
    }
  }

  get offers(): FormArray {
    return this.form.controls.offers;
  }

  addOffer(): void {
    this.offers.push(this.offerGroup());
  }

  removeOffer(index: number): void {
    if (this.offers.length > 1) {
      this.forgetPhoto(this.offers.at(index));
      this.offers.removeAt(index);
    }
  }

  protected photoOf(offer: AbstractControl): OfferPhoto | null {
    return this.photos().get(offer) ?? null;
  }

  protected photoErrorOf(offer: AbstractControl): string | null {
    return this.photoErrors().get(offer) ?? null;
  }

  async onPhotoSelected(offer: AbstractControl, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // The same file can be chosen again after removing it.
    input.value = '';
    if (file) {
      await this.uploadPhoto(offer, file);
    }
  }

  /** Uploads at once, so the offer only keeps the address of a photo Catalog already stored. */
  async uploadPhoto(offer: AbstractControl, file: File): Promise<void> {
    this.forgetPhoto(offer);
    const preview = URL.createObjectURL(file);
    this.setPhoto(offer, { preview, busy: true });
    try {
      const image = await this.uploadImage.execute(file);
      if (this.photoOf(offer)?.preview !== preview) {
        return;
      }
      offer.patchValue({ imageId: image.imageId, imageUrl: image.url });
      this.setPhoto(offer, { preview, busy: false });
    } catch (error) {
      if (this.photoOf(offer)?.preview === preview) {
        this.forgetPhoto(offer);
        this.setPhotoError(offer, error instanceof ApiError ? error.message : PHOTO_UPLOAD_FAILED);
      }
    }
  }

  removePhoto(offer: AbstractControl): void {
    this.forgetPhoto(offer);
    offer.patchValue({ imageId: '', imageUrl: '' });
  }

  private forgetPhoto(offer: AbstractControl): void {
    const photo = this.photoOf(offer);
    if (photo) {
      URL.revokeObjectURL(photo.preview);
    }
    this.setPhoto(offer, null);
    this.setPhotoError(offer, null);
  }

  private setPhoto(offer: AbstractControl, photo: OfferPhoto | null): void {
    this.photos.update((photos) => withEntry(photos, offer, photo));
  }

  private setPhotoError(offer: AbstractControl, message: string | null): void {
    this.photoErrors.update((errors) => withEntry(errors, offer, message));
  }

  /** The form does not exist yet while its first offer is built. */
  private campaignEnd(): string {
    const form = this.form as typeof this.form | undefined;
    return form?.controls.end.value ?? '';
  }

  /** "Vence" starts as the end of the campaign and keeps following it until the owner picks a day. */
  private followEnd(end: string | null): void {
    this.offers.controls
      .filter((offer) => !this.ownValidTo.has(offer))
      .forEach((offer) => offer.get('validTo')?.setValue(end ?? '', { emitEvent: false }));
  }

  onStorePoint(point: GeoPoint): void {
    this.storePoint.set(point);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting() || this.uploading()) {
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
          regularPrice: offer.regularPrice != null ? Number(offer.regularPrice) : null,
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
    const group = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
      conditions: ['', [Validators.required, Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
      price: [null as number | null, [Validators.required, Validators.min(MIN_PRICE)]],
      regularPrice: [null as number | null, [Validators.min(MIN_PRICE), regularAbovePrice]],
      validTo: [this.campaignEnd(), Validators.required],
      category: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
      imageUrl: ['', [Validators.maxLength(IMAGE_URL_MAX_LENGTH), linkOrUploadedPhoto]],
      /** Id of the photo uploaded to Catalog; empty when the offer has none or uses a link. */
      imageId: [''],
    });
    const controls = group.controls;
    controls.price.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => controls.regularPrice.updateValueAndValidity({ emitEvent: false }));
    controls.validTo.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((validTo) => {
      if (validTo) {
        this.ownValidTo.add(group);
      } else {
        this.ownValidTo.delete(group);
      }
    });
    return group;
  }
}
