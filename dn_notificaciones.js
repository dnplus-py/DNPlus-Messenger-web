// dn_notificaciones.js
const messaging = firebase.messaging();

function activarNotificacionesDN(idUsuario) {
    // 1. Pedir permiso al navegador/celular
    Notification.requestPermission().then((permiso) => {
        if (permiso === 'granted') {
            console.log('Permiso concedido para DNPlus');
            
            // 2. Obtener el Token único de este celular
            // Reemplaza "TU_CLAVE_VAPID" por la que generas en la consola de Firebase
            messaging.getToken({ vapidKey: 'TU_CLAVE_VAPID_AQUI' })
                .then((tokenActual) => {
                    if (tokenActual) {
                        // 3. Guardar el Token en Firebase bajo el ID del usuario
                        firebase.database().ref("usuarios_registrados/" + idUsuario).update({
                            fcm_token: tokenActual
                        });
                        console.log("Token guardado con éxito");
                    }
                }).catch((err) => console.log('Error al obtener token', err));
        }
    });
}

function enviarAviso(idDestinatario, textoMensaje) {
    db.ref("usuarios_registrados/" + idDestinatario + "/fcm_token").once("value", (s) => {
        const tokenDestino = s.val();
        if (tokenDestino) {
            // Aquí llamarías a la API de Firebase para enviar la notificación
            console.log("Enviando notificación al token: " + tokenDestino);
        }
    });
}

