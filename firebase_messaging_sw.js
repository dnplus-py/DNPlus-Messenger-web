importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    projectId: "dnplus-messenger-pro",
    messagingSenderId: "565345717315" 
});

const messaging = firebase.messaging();

// Escuchar mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('Mensaje recibido en segundo plano: ', payload);

    const titulo = payload.data.title || "Llamada de DNPlus";
    const opciones = {
        body: payload.data.body || "Tienes una llamada entrante",
        icon: payload.data.foto || 'https://dnplus-py.github.io/DNPlus-Messenger-web/icono.png',
        click_action: payload.data.click_action,
        vibrate: [200, 100, 200, 100, 200, 100, 400], // Vibración tipo llamada
        tag: 'llamada-dnplus', // Evita que se amontonen
        renotify: true,
        data: payload.data
    };

    self.registration.showNotification(titulo, opciones);
});
