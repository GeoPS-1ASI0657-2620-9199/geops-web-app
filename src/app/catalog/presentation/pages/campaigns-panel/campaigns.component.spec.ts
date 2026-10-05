import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Session } from '../../../../iam/domain/model/session';
import { SessionStorage } from '../../../../iam/domain/ports/session.storage';
import { CampaignsComponent } from './campaigns.component';

class OwnerStorage extends SessionStorage {
  override read(): Session {
    return {
      accessToken: 't',
      expiresAt: Date.now() + 60_000,
      userId: 42,
      role: 'BUSINESS_OWNER',
      email: 'mirta@correo.pe',
      businessName: 'Menús Doña Mirta',
    };
  }
  override write(): void {}
  override clear(): void {}
}

describe('CampaignsComponent', () => {
  const render = async (query: Record<string, string> = {}) => {
    await TestBed.configureTestingModule({
      imports: [CampaignsComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SessionStorage, useClass: OwnerStorage },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CampaignsComponent);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  };

  it('shows the business of the session and the entry to publish a campaign', async () => {
    const text = await render();

    expect(text).toContain('Menús Doña Mirta');
    expect(text).toContain('campaignsPage.new');
    expect(text).not.toContain('campaignsPage.created.title');
  });

  it('confirms the campaign just published', async () => {
    expect(await render({ created: '1' })).toContain('campaignsPage.created.title');
  });
});
