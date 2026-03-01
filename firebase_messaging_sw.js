importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    projectId: "dnplus-messenger-pro",
    messagingSenderId: "TU_SENDER_ID" // Lo encuentras en la consola de Firebase -> Configuración del proyecto
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icono-dnplus.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
