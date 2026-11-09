import { Provider } from '@angular/core';
import { BusinessProfileGateway } from '../domain/ports/business-profile.gateway';
import { IdentityGateway } from '../domain/ports/identity.gateway';
import { SessionStorage } from '../domain/ports/session.storage';
import { BrowserSessionStorage } from './browser-session.storage';
import { HttpBusinessProfileGateway } from './http-business-profile.gateway';
import { HttpIdentityGateway } from './http-identity.gateway';

/** Adapters of the iam context, registered once in app.config.ts. */
export const iamProviders: Provider[] = [
  { provide: IdentityGateway, useClass: HttpIdentityGateway },
  { provide: SessionStorage, useClass: BrowserSessionStorage },
  { provide: BusinessProfileGateway, useClass: HttpBusinessProfileGateway },
];
