// chat_logic.js - Lógica pura, sin etiquetas HTML
const db = firebase.database();
const miId = localStorage.getItem("user_temp_id");
const salaId = localStorage.getItem("chat_sala_id");
const destId = localStorage.getItem("chat_destinatario_id");

// Cargar mensajes y aplicar las medidas de 230x180 que definimos en el CSS
db.ref("chats_privados/" + salaId).on("value", snap => {
    const box = document.getElementById('chat-box');
    if (!box) return; // Seguridad por si el componente no cargó aún
    box.innerHTML = "";
    
    snap.forEach(child => {
        const m = child.val();
        const esMio = m.emisor === miId;
        const hora = new Date(m.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        const div = document.createElement("div");
        div.className = `msg ${esMio ? 'msg-mio' : 'msg-otro'}`;

        if(m.tipo === "imagen") {
            div.innerHTML = `
                <div class="img-wrapper">
                    <img src="${m.contenido}" onclick="zoom('${m.contenido}')">
                </div>
                <span class="hora-msg">${hora}</span>`;
        } else if(m.tipo === "audio") {
            div.innerHTML = `
                <div class="audio-container">
                    <span class="play-icon" onclick="new Audio('${m.contenido}').play()">▶️</span>
                    <div style="flex:1; height:3px; background:#8696a0; border-radius:2px;"></div>
                    <span class="hora-msg">${hora}</span>
                </div>`;
        } else {
            div.innerHTML = `<span>${m.contenido}</span><span class="hora-msg">${hora}</span>`;
        }
        box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
});

// Función para el botón dinámico (cambia micro por flecha)
function detectarCambio() {
    const input = document.getElementById('msg-input');
    const btn = document.getElementById('btn-main');
    if (input.value.length > 0) {
        btn.innerText = "🕊️"; // Icono de enviar
    } else {
        btn.innerText = "🎙️"; // Icono de micro
    }
}

// ... aquí sigues con iniciarGrabacion, detenerGrabacion, etc.
