import {Component, inject, signal} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Router, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('geops-frontend');
  private translate: TranslateService;
  private router: Router;

  constructor() {
    this.translate = inject(TranslateService);
    this.router = inject(Router);
    this.translate.addLangs(['en', 'es']);
    this.translate.use('en');
  }

  onGlobalSearch(q: string): void {
    if (!q) return;
    this.router.navigate(['/home'], { queryParams: { q } });
  }
}
