import { PushControls } from '../../components/push-controls/push-controls';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { GetNotificationPreferencesUseCase, UpdateNotificationPreferencesUseCase } from '../../../application/preferences.use-cases';
import { ApiError } from '../../../../shared/domain/api-error';
@Component({
  selector: 'app-preferences',
  imports: [PushControls, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, TranslateModule],
  templateUrl: './preferences.page.html', styleUrl: './preferences.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesPage implements OnInit {
  private readonly get = inject(GetNotificationPreferencesUseCase);
  private readonly update = inject(UpdateNotificationPreferencesUseCase);
  readonly loading = signal(true);
  readonly loaded = signal(false);
  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = new FormGroup({ pushEnabled: new FormControl(false, { nonNullable: true }), emailEnabled: new FormControl(false, { nonNullable: true }), dailyLimit: new FormControl(3, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(10), Validators.pattern(/^\d+$/)] }) });
  async enableEmail() { this.form.controls.emailEnabled.setValue(true); await this.save(); }
  async pushEnabled() { this.form.controls.pushEnabled.setValue(true); await this.save(); }
  ngOnInit() { void this.load(); }
  async load() {
    this.loading.set(true); this.error.set(null); this.loaded.set(false);
    try { this.form.patchValue(await this.get.execute()); this.loaded.set(true); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'notificationPage.error'); }
    finally { this.loading.set(false); }
  }
  async save() {
    if (!this.loaded() || this.busy() || this.form.invalid) return;
    this.busy.set(true); this.saved.set(false); this.error.set(null);
    try { this.form.patchValue(await this.update.execute(this.form.getRawValue())); this.saved.set(true); this.form.markAsPristine(); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'notificationPage.error'); }
    finally { this.busy.set(false); }
  }
}
