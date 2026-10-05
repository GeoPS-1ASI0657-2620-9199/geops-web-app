import { Session } from '../domain/model/session';
import { BrowserSessionStorage } from './browser-session.storage';

const SESSION: Session = {
  accessToken: 'header.payload.signature',
  expiresAt: 1_791_200_000_000,
  userId: 12,
  role: 'CONSUMER',
  email: 'ariana@correo.pe',
  consumerId: 8,
};

describe('BrowserSessionStorage', () => {
  const storage = new BrowserSessionStorage();

  afterEach(() => sessionStorage.clear());

  it('keeps the session in sessionStorage, never in localStorage', () => {
    storage.write(SESSION);

    expect(storage.read()).toEqual(SESSION);
    expect(localStorage.getItem('geops.session')).toBeNull();
  });

  it('discards a damaged entry instead of failing', () => {
    sessionStorage.setItem('geops.session', '{not json');

    expect(storage.read()).toBeNull();
    expect(sessionStorage.getItem('geops.session')).toBeNull();
  });

  it('clears the session', () => {
    storage.write(SESSION);

    storage.clear();

    expect(storage.read()).toBeNull();
  });
});
