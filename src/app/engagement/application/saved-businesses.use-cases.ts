import { Injectable, inject } from '@angular/core';
import { SavedBusinessRepository } from '../domain/ports/saved-business.repository';
@Injectable({ providedIn: 'root' })
export class ListSavedBusinessesUseCase {
  private readonly repository = inject(SavedBusinessRepository);
  execute() { return this.repository.findMine(); }
}
@Injectable({ providedIn: 'root' })
export class SaveBusinessUseCase {
  private readonly repository = inject(SavedBusinessRepository);
  execute(businessId: number) { return this.repository.save(businessId); }
}
@Injectable({ providedIn: 'root' })
export class RemoveSavedBusinessUseCase {
  private readonly repository = inject(SavedBusinessRepository);
  execute(businessId: number) { return this.repository.remove(businessId); }
}
