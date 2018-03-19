'use strict';
importScripts('./build/sw-toolbox.js');

importScripts("//cdn.jsdelivr.net/npm/pouchdb@6.4.3/dist/pouchdb.min.js");



self.toolbox.options.cache = {
  name: 'wlc-memory-cache-201803181814'
};

// pre-cache our key assets
self.toolbox.precache(
  [
    './build/main.js',
    './build/vendor.js',
    './build/main.css',
    './build/polyfills.js',
    'index.html',
    'manifest.json'
  ]
);

// dynamically cache any other local assets
self.toolbox.router.any('/*', self.toolbox.fastest);

// for any other requests go to the network, cache,
// and then only use that cached resource if your user goes offline
self.toolbox.router.default = self.toolbox.networkFirst;

/* eslint-disable max-len */

const applicationServerPublicKey = 'BH8-hIchXKMI6AKSee8gD0hhPThRqaEhIEtMJwcTjEQhiOKdG-_2tTIO-6hOAK4kwg5M9Saedjxp4hVE-khhWxY';

/* eslint-enable max-len */

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

self.addEventListener('push', function (event) {
  //console.log('[Service Worker] Push Received.');
  //console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'WLC Memory';
  const options = {
    body: 'Esta é uma notificação de exemplo',
    icon: 'assets/imgs/logo_only.png',
    badge: 'assets/imgs/logo.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));

});

self.addEventListener('notificationclick', function (event) {
  //console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('https://developers.google.com/web/')
  );
});

self.addEventListener('pushsubscriptionchange', function (event) {
  //console.log('[Service Worker]: \'pushsubscriptionchange\' event fired.');
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    })
      .then(function (newSubscription) {
        // TODO: Send to application server
        //console.log('[Service Worker] New subscription: ', newSubscription);
      })
  );
});


//Envio de Notificações agendadas utilizando PouchDB

const db = new PouchDB('wlc-memory');
const remotedb = new PouchDB('https://admin:8eda208157d4@couchdb-bfef4c.smileupps.com/wlc-memory');

setInterval(async function () {
  //if (new Date().getHours() === 17 && new Date().getMinutes() === 43 && new Date().getSeconds() === 30) {
  if (new Date().getMinutes() === 0 && new Date().getSeconds() === 0) {
    db.sync(remotedb);

    db.changes({
      since: 'now'
    }).on('change', function (change) {
      console.log("atualizou");

    }).on('error', function (err) {
      console.error("Deu erro");
    });


    db.allDocs({
      limit: 1,
      descending: true,
      include_docs: true
    }).then((docs) => {
      const title = docs.rows[0].doc.title;
      const options = {
        body: docs.rows[0].doc.options.body,
        icon: docs.rows[0].doc.options.icon,
        badge: docs.rows[0].doc.options.badge
      };
      self.registration.showNotification(title, options);
    }).on('error', function (err) {
      console.log(err);
    });
  }
}, 1000);