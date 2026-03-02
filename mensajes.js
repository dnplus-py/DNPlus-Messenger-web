// mensajes.js - COMPLEMENTO PARA EL CSS MAESTRO DNPlus
const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");

let mensajeSeleccionado = null;
let touchTimer;

// --- FUNCIÓN DE BORRADO (MODAL ARRIBA) ---
function iniciarTimerBorrado(id) {
    touchTimer = setTimeout(() => {
        mensajeSeleccionado = id;
        // Marcamos la burbuja visualmente
        document.querySelectorAll('.bubble').forEach(b => b.style.filter = "none");
        document.getElementById(id).style.filter = "brightness(0.8)";
        
        // Mostramos el menú de arriba (ID del HTML: action-header-menu)
        const menuAcciones = document.getElementById('action-header-menu');
        if(menuAcciones) menuAcciones.style.display = 'flex';
        
        if (navigator.vibrate) navigator.vibrate(50);
    }, 800); // 800ms para que sea rápido pero seguro
}

function cancelarTimerBorrado() { clearTimeout(touchTimer); }

window.cerrarMenuAcciones = () => {
    if(mensajeSeleccionado) document.getElementById(mensajeSeleccionado).style.filter = "none";
    mensajeSeleccionado = null;
    document.getElementById('action-header-menu').style.display = 'none';
};

window.borrarMensaje = () => {
    if(mensajeSeleccionado && confirm("¿David, quieres eliminar este mensaje?")) {
        db.ref("chats_privados/" + salaId + "/" + mensajeSeleccionado).remove();
        document.getElementById(mensajeSeleccionado).remove();
        cerrarMenuAcciones();
    }
};

// --- DIBUJAR BURBUJA (CON TU CSS DE AUDIO) ---
function dibujarBurbuja(data, key) {
    if (document.getElementById(key)) return;
    const esMio = data.emisor === miId;
    const chatContainer = document.getElementById('chat-container');
    
    const b = document.createElement('div');
    b.id = key;
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;

    // Eventos de borrado
    b.onmousedown = () => iniciarTimerBorrado(key);
    b.onmouseup = cancelarTimerBorrado;
    b.ontouchstart = () => iniciarTimerBorrado(key);
    b.ontouchend = cancelarTimerBorrado;

    let html = "";
    if (data.tipo === 'audio') {
        html = `
            <div class="audio-wrapper">
                <div class="audio-photo-container">
                    <img src="${esMio ? 'https://tu-foto.jpg' : 'https://foto-otro.jpg'}" class="audio-user-photo">
                </div>
                <i class="fas fa-play cursor-pointer" onclick="reproducirAudio(this, '${data.url}')"></i>
                <div class="audio-info-container">
                    <div style="width:100%; height:3px; background:rgba(255,255,255,0.2); border-radius:5px; position:relative;">
                        <div class="p-bar" style="width:0%; height:100%; background:#34b7f1; border-radius:5px;"></div>
                    </div>
                    <span class="audio-time-text">Voz</span>
                </div>
            </div>`;
    } else if (data.tipo === 'imagen') {
        html = `<div class="img-frame"><img src="${data.url}" onclick="verImagen('${data.url}')"></div>`;
    } else {
        html = `<div>${data.mensaje}</div>`;
    }

    b.innerHTML = `${html}<span class="msg-time">${data.hora}</span>`;
    chatContainer.appendChild(b);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Reproductor de Audio
window.reproducirAudio = (el, url) => {
    const a = new Audio(url);
    const bar = el.parentElement.querySelector('.p-bar');
    el.className = "fas fa-pause";
    a.play();
    a.ontimeupdate = () => { if(bar) bar.style.width = (a.currentTime/a.duration)*100 + "%"; };
    a.onended = () => { el.className = "fas fa-play"; if(bar) bar.style.width = "0%"; };
};

// Carga inicial
db.ref("chats_privados/" + salaId).on("child_added", s => dibujarBurbuja(s.val(), s.key));
