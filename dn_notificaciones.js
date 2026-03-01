const messaging = firebase.messaging();

// FUNCIÓN PARA ACTIVAR NOTIFICACIONES (Llamar en registro.html o index.html)
function activarNotificacionesDN(idUsuario) {
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            // TU CLAVE VAPID REAL
            messaging.getToken({ vapidKey: 'BN4OwsJeDrCxn6kWikOkM49z-npm3PD4b7b2sSAboRuCNJNBqo63U5zKg-LiOjV3CJnIXCN26_SQEo8ibJ7cGJQ' })
                .then((currentToken) => {
                    if (currentToken) {
                        // Guardar token en el perfil del usuario en Firebase
                        firebase.database().ref("usuarios_registrados/" + idUsuario).update({
                            fcm_token: currentToken
                        });
                        console.log("Notificaciones de DNPlus configuradas.");
                    }
                }).catch((err) => console.log('Error al obtener token:', err));
        }
    });
}

// FUNCIÓN PARA ENVIAR AVISO (Llamar en mensajes.html o llamadas.html)
async function enviarAvisoDN(idDestinatario, titulo, mensaje) {
    const snapshot = await firebase.database().ref("usuarios_registrados/" + idDestinatario + "/fcm_token").once("value");
    const tokenDestino = snapshot.val();

    if (tokenDestino) {
        // IMPORTANTE: Debes colocar tu SERVER KEY real aquí para que el envío funcione
        const SERVER_KEY = "TU_SERVER_KEY_HEREDADA_AQUI"; 

        fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'key=' + SERVER_KEY
            },
            body: JSON.stringify({
                "to": tokenDestino,
                "notification": {
                    "title": titulo,
                    "body": mensaje,
                    "icon": "https://dnplus-py.github.io/DNPlus-Messenger-web/icono.png",
                    "click_action": "https://dnplus-py.github.io/DNPlus-Messenger-web/"
                }
            })
        });
    }
}
