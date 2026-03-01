importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

// Configuración de tu proyecto DNPlus
firebase.initializeApp({
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    projectId: "dnplus-messenger-pro",
    messagingSenderId: "565345717315" 
});

const messaging = firebase.messaging();

// Recibir notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'https://dnplus-py.github.io/DNPlus-Messenger-web/icono.png',
        badge: 'https://dnplus-py.github.io/DNPlus-Messenger-web/icono.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
