// Configuración de Firebase (Asegúrate de que coincida con tu proyecto)
const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com",
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ID del usuario actual (David, asegúrate de que esto sea igual a tus otros archivos)
const miId = localStorage.getItem("user_phone") || "anonimo";

function cargarEstados() {
    const ahora = Date.now();
    const listaContenedor = document.getElementById("lista-estados-items");

    // Escuchar los estados en tiempo real
    db.ref("estados").on("value", (snapshot) => {
        listaContenedor.innerHTML = "";
        
        if (!snapshot.exists()) {
            listaContenedor.innerHTML = "<p style='text-align:center; color:#8696a0; padding:20px;'>No hay actualizaciones recientes.</p>";
            return;
        }

        snapshot.forEach((hijo) => {
            const estado = hijo.val();
            
            // VERIFICACIÓN DE 24 HORAS: Si el tiempo actual superó la expiración
            if (ahora > estado.expira) {
                // Borrar automáticamente de Firebase si ya caducó
                db.ref("estados/" + hijo.key).remove();
            } else {
                // Renderizar el estado si aún es válido
                const item = document.createElement("div");
                item.className = "fila-estado"; // Usa tus clases de CSS
                item.innerHTML = `
                    <div class="borde-historia">
                        <img src="${estado.foto_perfil || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" class="img-estado">
                    </div>
                    <div class="info-estado">
                        <p class="nombre">${estado.nombre_usuario}</p>
                        <p class="tiempo">${calcularRelativo(estado.timestamp)}</p>
                    </div>
                `;
                
                item.onclick = () => verEstadoFull(estado);
                listaContenedor.appendChild(item);
            }
        });
    });
}

// Función para mostrar "Hace 5 min", "Hace 1 hora", etc.
function calcularRelativo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "Recién";
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    return "Hace mucho";
}

function verEstadoFull(datos) {
    // Aquí puedes guardar en localStorage y abrir la pantalla que muestra la foto grande
    localStorage.setItem("ver_estado_url", datos.url_contenido);
    window.top.location.href = "ver_estado.html";
}

// Iniciar al cargar
window.onload = cargarEstados;
