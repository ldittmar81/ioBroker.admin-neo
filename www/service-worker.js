/* jshint -W097 */// jshint strict:true
/* jslint vars: true */
/* jslint browser:true */
/* jslint devel:true */
/* jshint browser:true */
/* jshint devel:true */
/* jshint jquery:true */
/* global io:false */
/* global jQuery:false */
/* global $:false */
/* global self */

'use strict';

self.addEventListener('push', function (event) {
    event.waitUntil(self.registration.showNotification('ServiceWorker ioBroker', {
        body: 'ioBroker Desktop Message test',
        icon: 'img/no-image.png'
    }));
});

self.addEventListener('pushsubscriptionchange', function (event) {
    console.log('Subscription expired');
    event.waitUntil(
        self.registration.pushManager.subscribe({userVisibleOnly: true}).then(function (subscription) {
            console.log('Subscribed after expiration', subscription.endpoint);
            return fetch('register', {
                method: 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint
                })
            });
        })
    );
});
