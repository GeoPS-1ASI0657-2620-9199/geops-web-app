import { FirebaseWebConfig } from '../app/notification/domain/model/firebase-config';
export const environment = {
  firebase: {
    apiKey: 'AIzaSyALScCQJuLD3zKjDzHzIoeC_PYvxJ7RHRs',
    authDomain: 'geops-eda45.firebaseapp.com',
    projectId: 'geops-eda45',
    messagingSenderId: '948945877821',
    appId: '1:948945877821:web:ac110adbc083ae13aaa354',
    vapidKey: 'BAOKUx-tN612h3eNRBkrYDP22347-GK4JPMWdNyUJQni7c7q_WykDeOnsKh7afYk1jetlFuEE2BIFcsTf4joRCA'
  } as FirebaseWebConfig | null,
  production: false,
  apiBaseUrl: 'http://localhost:8080/api/v1'
};
