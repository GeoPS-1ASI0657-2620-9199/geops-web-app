import { Injectable, inject } from '@angular/core';
import { FollowRepository } from '../domain/ports/follow.repository';

@Injectable({ providedIn: 'root' })
export class ListFollowedBusinessesUseCase {
  private readonly repository = inject(FollowRepository);
  execute() { return this.repository.findMine(); }
}

@Injectable({ providedIn: 'root' })
export class FollowBusinessUseCase {
  private readonly repository = inject(FollowRepository);
  execute(businessId: number) { return this.repository.follow(businessId); }
}

@Injectable({ providedIn: 'root' })
export class UnfollowBusinessUseCase {
  private readonly repository = inject(FollowRepository);
  execute(businessId: number) { return this.repository.unfollow(businessId); }
}
