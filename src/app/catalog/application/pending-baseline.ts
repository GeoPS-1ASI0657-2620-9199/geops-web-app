import { Injectable, inject } from '@angular/core';
import { DeclareBaselineUseCase } from './declare-baseline.use-case';

interface HeldBaseline {
  readonly email: string;
  readonly customersPerWeek: number;
  readonly averageTicket: number;
}

/**
 * Baseline the owner typed while affiliating (US45). Registering gives no token, so it waits here
 * until that same owner logs in. It lives in memory only: if the tab reloads in between, the owner
 * still declares it from Métricas.
 */
@Injectable({ providedIn: 'root' })
export class PendingBaseline {
  private readonly declareBaseline = inject(DeclareBaselineUseCase);
  private held: HeldBaseline | null = null;

  hold(email: string, customersPerWeek: number, averageTicket: number): void {
    this.held = { email, customersPerWeek, averageTicket };
  }

  /**
   * Declares the held baseline once its owner has a session. True when it was saved, false when it
   * failed (it is not retried: Métricas keeps asking for it), null when nothing was held for this email.
   */
  async declareFor(email: string): Promise<boolean | null> {
    const held = this.held;
    if (!held || held.email !== email) {
      return null;
    }
    this.held = null;
    try {
      await this.declareBaseline.execute(held.customersPerWeek, held.averageTicket);
      return true;
    } catch {
      return false;
    }
  }
}
