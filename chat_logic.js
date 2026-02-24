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
