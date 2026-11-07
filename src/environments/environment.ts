import { FirebaseWebConfig } from '../app/notification/domain/model/firebase-config';
export const environment = {
  firebase: null as FirebaseWebConfig | null,
  production: false,
  apiBaseUrl: 'http://localhost:8080/api/v1'
};
