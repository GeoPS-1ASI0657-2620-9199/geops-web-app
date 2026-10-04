import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-help-center-provider',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './help-center-provider.component.html',
  styleUrls: ['./help-center-provider.component.css']
})
export class HelpCenterProviderComponent { }
