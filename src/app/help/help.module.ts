import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpCenterComponent } from './presentation/views/help-center/help-center.component';
import { TranslateModule } from '@ngx-translate/core';
/**
 * Módulo principal para la funcionalidad de ayuda.
 * Declara y exporta los componentes relacionados con el Help Center.
 */

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    HelpCenterComponent
  ]
})
export class HelpModule { }
