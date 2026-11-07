importScripts('https://www.gstatic.com/firebasejs/13.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.2.0/firebase-messaging-compat.js');
const rawConfig = new URL(self.location.href).searchParams.get('config');
if (rawConfig) {
  const source = JSON.parse(rawConfig);
  const config = { apiKey: source.apiKey, authDomain: source.authDomain, projectId: source.projectId, messagingSenderId: source.messagingSenderId, appId: source.appId };
  firebase.initializeApp(config);
  firebase.messaging();
}
