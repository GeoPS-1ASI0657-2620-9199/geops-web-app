import { Injectable, inject } from '@angular/core';
import { SessionStore } from '../../iam/application/session.store';
import { DEFAULT_RADIUS_MINUTES, isValidRadius } from '../domain/model/nearby-offer';
import { RadiusPreferenceGateway } from '../domain/ports/radius-preference.gateway';
import { RadiusPreferenceStore } from '../domain/ports/radius-preference.store';

/** The radius to search with, and whether it just came from the consumer profile. */
export interface SavedRadius {
  readonly minutes: number;
  readonly fromProfile: boolean;
}

/**
 * The last walking radius the consumer chose (US46, E2-07): in the browser for any visitor and, with a
 * consumer session, also in the Identity profile. The profile wins once per session, so the choice
 * made in another browser applies here; saving there never blocks the search.
 */
@Injectable({ providedIn: 'root' })
export class SearchRadiusPreference {
  private readonly local = inject(RadiusPreferenceStore);
  private readonly profile = inject(RadiusPreferenceGateway);
  private readonly sessions = inject(SessionStore);
  /** Consumer whose profile radius was already read in this tab. */
  private syncedConsumer: number | null = null;

  /** The radius in this browser, or the default one. */
  current(): number {
    return this.local.read() ?? DEFAULT_RADIUS_MINUTES;
  }

  /** Reads the profile radius the first time a consumer session is seen; otherwise the local one. */
  async resolve(): Promise<SavedRadius> {
    const consumer = this.consumerId();
    if (consumer === null || consumer === this.syncedConsumer) {
      return { minutes: this.current(), fromProfile: false };
    }
    this.syncedConsumer = consumer;
    try {
      const minutes = await this.profile.fetch();
      if (isValidRadius(minutes)) {
        this.local.write(minutes);
        return { minutes, fromProfile: true };
      }
    } catch {
      // Identity unreachable: search with what this browser has.
    }
    return { minutes: this.current(), fromProfile: false };
  }

  remember(minutes: number): void {
    this.local.write(minutes);
    if (this.consumerId() !== null) {
      this.profile.save(minutes).catch(() => undefined);
    }
  }

  private consumerId(): number | null {
    const session = this.sessions.activeSession();
    return session?.role === 'CONSUMER' ? session.userId : null;
  }
}
