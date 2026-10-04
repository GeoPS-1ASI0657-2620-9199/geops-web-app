import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer-content',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './footer-content.html',
  styleUrls: ['./footer-content.css']
})
export class FooterContent {
  get currentYear(): number {
    return new Date().getFullYear();
  }
}
