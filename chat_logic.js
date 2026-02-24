// Abre el modal desde los tres puntos
function abrirMenuOpciones() {
    document.getElementById('modal-opciones').style.display = 'block';
}

// Cierra cualquier modal abierto
function cerrarModales() {
    document.getElementById('modal-opciones').style.display = 'none';
    if(document.getElementById('modal-colores')) {
        document.getElementById('modal-colores').style.display = 'none';
    }
}

// Lógica para VACIAR el chat (Solo borra para ti o para ambos según tu Firebase)
function confirmarVaciarChat() {
    if(confirm("¿Deseas vaciar todos los mensajes?")) {
        // Suponiendo que salaId está definido en tu lógica de mensajes
        db.ref("chats_privados/" + salaId).remove()
        .then(() => {
            alert("Chat vaciado");
            cerrarModales();
            location.reload(); // Recarga para limpiar la pantalla
        });
    }
}
// Función para conectar con Firebase y traer los datos del contacto
function cargarDatosContacto() {
    const destId = localStorage.getItem("chat_destId");
    
    if (!destId) {
        console.error("No se encontró el ID del destinatario");
        return;
    }

    // Buscamos en la rama de usuarios
    db.ref("usuarios/" + destId).once("value").then((snap) => {
        const datos = snap.val();
        if (datos) {
            // Inyectamos el nombre y la foto en los IDs de la cabecera
            document.getElementById("header-nombre-usuario").innerText = datos.nombre || "Usuario";
            
            if (datos.foto) {
                document.getElementById("header-foto-perfil").src = datos.foto;
            }
        }
    }).catch(e => console.error("Error al cargar datos:", e));
}

// Llamamos a la función cuando todo esté listo
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosContacto();
});
