import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { categoryIcon } from '../../../../shared/ui/category-icon';
import { OfferSearchStore } from '../../../application/offer-search.store';
import { SearchGate } from '../../components/search-gate/search-gate';
import { placeLabelOf } from '../../search-view';

export interface CategoryTile {
  readonly name: string;
  readonly icon: string;
  readonly count: number;
}

/**
 * Categorías tab: the way in by "what do I want". One tile per category of Catalog with how many
 * offers it has within the walking radius; a tile opens Ofertas already filtered (US08). The list,
 * the order and the map live only in Ofertas, so the search is one screen and not three.
 */
@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslateModule, SearchGate],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage implements OnInit {
  protected readonly search = inject(OfferSearchStore);

  protected readonly placeLabel = computed(() => placeLabelOf(this.search.origin()));
  protected readonly total = computed(() => this.search.offers().length);
  /** Categories with offers first, then the rest, each group in the order Catalog gives them. */
  protected readonly tiles = computed<CategoryTile[]>(() => {
    const counts = new Map<string, number>();
    for (const offer of this.search.offers()) {
      counts.set(offer.category, (counts.get(offer.category) ?? 0) + 1);
    }
    const tiles = this.search.categories().map((name) => ({ name, icon: categoryIcon(name), count: counts.get(name) ?? 0 }));
    return [...tiles.filter((t) => t.count > 0), ...tiles.filter((t) => t.count === 0)];
  });

  async ngOnInit(): Promise<void> {
    await this.search.ensureStarted();
    // The counts are over every offer in the radius, whatever filter Ofertas left chosen.
    if (this.search.category()) {
      await this.search.selectCategory(null);
    }
    await this.search.loadAll();
  }
}
