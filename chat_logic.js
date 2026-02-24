// Función para cargar los datos del contacto en la cabecera
function cargarDatosCabecera() {
    const destId = localStorage.getItem("chat_destId"); // El ID del contacto guardado
    
    if (destId) {
        db.ref("usuarios/" + destId).once("value", (snap) => {
            const user = snap.val();
            if (user) {
                document.getElementById("header-nombre-usuario").innerText = user.nombre || "Usuario";
                if (user.foto) {
                    document.getElementById("header-foto-perfil").src = user.foto;
                }
            }
        });
    }
}

// Función para abrir el modal desde los 3 puntos
function abrirMenuOpciones() {
    const modal = document.getElementById('modal-opciones');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Ejecutar cuando se cargue la página
window.onload = () => {
    cargarDatosCabecera();
};
