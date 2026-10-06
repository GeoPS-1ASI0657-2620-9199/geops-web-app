import { TestBed } from '@angular/core/testing';
import { RegisterConsumer, RegisteredUser } from '../domain/model/register-consumer';
import { IdentityGateway } from '../domain/ports/identity.gateway';
import { RegisterConsumerUseCase } from './register-consumer.use-case';

class FakeIdentityGateway extends IdentityGateway {
  received?: RegisterConsumer;

  override async registerConsumer(person: RegisterConsumer): Promise<RegisteredUser> {
    this.received = person;
    return { userId: 1, fullName: 'Ariana Torres', email: person.email, role: 'CONSUMER' };
  }
}

describe('RegisterConsumerUseCase', () => {
  let gateway: FakeIdentityGateway;
  let useCase: RegisterConsumerUseCase;

  beforeEach(() => {
    gateway = new FakeIdentityGateway();
    TestBed.configureTestingModule({ providers: [{ provide: IdentityGateway, useValue: gateway }] });
    useCase = TestBed.inject(RegisterConsumerUseCase);
  });

  it('sends the email in lower case and the phone without spaces', async () => {
    await useCase.execute({
      givenNames: ' Ariana ',
      surnames: ' Torres ',
      email: '  Ariana@Correo.PE ',
      phone: '987 654 321',
      password: 'Ofertas#2026',
    });

    expect(gateway.received).toEqual({
      givenNames: 'Ariana',
      surnames: 'Torres',
      email: 'ariana@correo.pe',
      phone: '987654321',
      password: 'Ofertas#2026',
    });
  });

  it('does not touch the password', async () => {
    await useCase.execute({
      givenNames: 'Ariana',
      surnames: 'Torres',
      email: 'ariana@correo.pe',
      phone: '987654321',
      password: '  con espacios  ',
    });

    expect(gateway.received?.password).toBe('  con espacios  ');
  });
});
