// mensajes.js - UNIFICADO Y CORREGIDO POR DAVID OVIEDO
console.log("✅ DNPlus Messenger: Cargando sistema unificado...");

// 1. CONFIGURACIÓN FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. DATOS DE SESIÓN
const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");

// 3. ELEMENTOS DEL DOM
const input = document.getElementById('chat-input');
const actionIcon = document.getElementById('action-icon');
const chatContainer = document.getElementById('chat-container');
const actionBtn = document.getElementById('action-btn');

let mediaRecorder, audioChunks = [], isRecording = false;

// Referencias de Presencia
const presenciRef = db.ref("usuarios_registrados/" + miId + "/estado");
const ultimaVezRef = db.ref("usuarios_registrados/" + miId + "/ultimaVez");

// --- INICIO DEL SISTEMA ---
window.onload = () => {
    if(!idOtro || !salaId) return;

    // Sistema de presencia Online/Offline
    db.ref(".info/connected").on("value", (snapshot) => {
        if (snapshot.val() === true) {
            presenciRef.onDisconnect().set("offline");
            ultimaVezRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
            presenciRef.set("online");
        }
    });

    // Cargar datos del contacto y su estado
    db.ref("usuarios_registrados/" + idOtro).on("value", s => {
        const d = s.val();
        if(d) {
            document.getElementById('header-name').innerText = d.nombre || idOtro;
            document.getElementById('header-photo').src = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            
            const statusEl = document.getElementById('header-status');
            if(d.estado === 'escribiendo...') {
                statusEl.innerText = "escribiendo...";
                statusEl.style.color = "#4ade80"; 
            } else if(d.estado === 'grabando audio...') {
                statusEl.innerText = "grabando audio...";
                statusEl.style.color = "#f87171";
            } else if(d.estado === 'online') {
                statusEl.innerText = "en línea";
                statusEl.style.color = "#4ade80";
            } else {
                statusEl.innerText = "últ. vez hoy";
                statusEl.style.color = "#9ca3af";
            }
        }
    });

    // Cargar mensajes
    db.ref("chats_privados/" + salaId).on("child_added", s => dibujarBurbuja(s.val(), s.key));

    // Cargar fondo guardado
    const bgSaved = localStorage.getItem("chat_bg_" + salaId);
    if(bgSaved) {
        chatContainer.style.backgroundImage = `url('${bgSaved}')`;
        chatContainer.style.backgroundSize = "cover";
        chatContainer.style.backgroundPosition = "center";
    }
};

// --- LÓGICA DE GRABACIÓN DE AUDIO ---
async function startRec() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;
        
        document.getElementById('rec-overlay').style.display = 'flex';
        presenciRef.set("grabando audio..."); 
        
        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.start();
    } catch (err) {
        alert("Por favor, permite el acceso al micrófono.");
    }
}

function stopRec() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('rec-overlay').style.display = 'none';
        presenciRef.set("online");
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            if (audioBlob.size > 1000) {
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    sendData({ tipo: 'audio', url: reader.result });
                };
            }
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        };
    }
}

// --- LÓGICA DE ENVÍO ---
function sendData(p) {
    const ahora = new Date();
    const hora = ahora.getHours() + ":" + ahora.getMinutes().toString().padStart(2, '0');
    db.ref("chats_privados/" + salaId).push({ ...p, emisor: miId, hora: hora });
}

// Eventos del botón de acción (Micrófono o Enviar)
actionBtn.addEventListener('mousedown', () => { if(!input.value.trim()) startRec(); });
actionBtn.addEventListener('mouseup', () => { if(isRecording) stopRec(); });
actionBtn.addEventListener('touchstart', (e) => { 
    if(!input.value.trim()) { e.preventDefault(); startRec(); } 
});
actionBtn.addEventListener('touchend', (e) => { 
    if(isRecording) { e.preventDefault(); stopRec(); } 
});

actionBtn.onclick = () => {
    if(input.value.trim()) {
        sendData({ tipo: 'texto', mensaje: input.value });
        input.value = "";
        actualizarIcono();
    }
};

function actualizarIcono() {
    if(input.value.trim()) {
        actionIcon.className = "fas fa-paper-plane";
        presenciRef.set("escribiendo...");
    } else {
        actionIcon.className = "fas fa-microphone";
        presenciRef.set("online");
    }
}
input.oninput = actualizarIcono;

// --- DIBUJAR MENSAJES ---
function dibujarBurbuja(data, key) {
    if (document.getElementById(key)) return;
    const esMio = data.emisor === miId;
    const b = document.createElement('div');
    b.id = key;
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
    // Color personalizado David Oviedo (#176f47)
    if(esMio) b.style.backgroundColor = "#176f47";

    let contenido = "";
    if (data.tipo === 'audio') {
        contenido = `
            <div style="display:flex; align-items:center; gap:12px; min-width:160px; padding:5px;">
                <button onclick="reproducirAudio('${data.url}', this)" style="background:none; border:none; color:white; cursor:pointer;">
                    <i class="fas fa-play text-xl"></i>
                </button>
                <div style="flex:1; height:3px; background:rgba(255,255,255,0.2); border-radius:10px;">
                    <div class="progress-bar" style="width:0%; height:100%; background:#34b7f1;"></div>
                </div>
                <span style="font-size:11px;">Audio</span>
            </div>`;
    } else if (data.tipo === 'imagen') {
        contenido = `<img src="${data.url}" onclick="verImagen('${data.url}')" style="border-radius:10px; max-width:220px; cursor:pointer;">`;
    } else {
        contenido = `<div>${data.mensaje}</div>`;
    }
    
    b.innerHTML = `${contenido}<span style="font-size:9px; opacity:0.6; display:block; text-align:right; margin-top:4px;">${data.hora}</span>`;
    chatContainer.appendChild(b);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

window.reproducirAudio = function(url, btn) {
    const audio = new Audio(url);
    const icono = btn.querySelector('i');
    const barra = btn.parentElement.querySelector('.progress-bar');
    
    icono.className = "fas fa-pause text-xl";
    audio.play();

    audio.ontimeupdate = () => {
        const pct = (audio.currentTime / audio.duration) * 100;
        if(barra) barra.style.width = pct + "%";
    };

    audio.onended = () => {
        icono.className = "fas fa-play text-xl";
        if(barra) barra.style.width = "0%";
    };
};

// --- FUNCIONES UI (Menús, Fondo, etc) ---
window.toggleHeaderMenu = () => {
    const m = document.getElementById("header-menu");
    m.style.display = (m.style.display === "none" || m.style.display === "") ? "flex" : "none";
};

window.vaciarChat = () => {
    if(confirm("¿Seguro que quieres vaciar el chat?")) {
        db.ref("chats_privados/" + salaId).remove();
        chatContainer.innerHTML = "";
    }
};

window.cambiarFondo = () => document.getElementById('bg-input').click();

window.aplicarNuevoFondo = (el) => {
    const file = el.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            chatContainer.style.backgroundImage = `url('${e.target.result}')`;
            localStorage.setItem("chat_bg_" + salaId, e.target.result);
        };
        reader.readAsDataURL(file);
    }
};

window.verImagen = (url) => {
    document.getElementById('full-image').src = url;
    document.getElementById('image-viewer').style.display = 'flex';
};

window.cerrarVisor = () => document.getElementById('image-viewer').style.display = 'none';

window.manejarAdjunto = (el) => {
    const file = el.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => sendData({ tipo: 'imagen', url: e.target.result });
        reader.readAsDataURL(file);
    }
};
