u// mensajes.js - EL CEREBRO DE DNPLUS
console.log("🚀 Sistema DNPlus iniciado por David Oviedo");

const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");

// Exportar variables para que button_audio.js las vea
window.presenciRef = db.ref("usuarios_registrados/" + miId + "/estado");
window.db = db; 

const input = document.getElementById('chat-input');
const actionIcon = document.getElementById('action-icon');
const chatContainer = document.getElementById('chat-container');
const actionBtn = document.getElementById('action-btn');

// --- FUNCIÓN DE ENVÍO GLOBAL ---
window.sendData = function(p) {
    if(!salaId) return;
    const ahora = new Date();
    const hora = ahora.getHours() + ":" + ahora.getMinutes().toString().padStart(2, '0');
    
    db.ref("chats_privados/" + salaId).push({ 
        ...p, 
        emisor: miId, 
        hora: hora 
    }).then(() => {
        console.log("✅ Mensaje enviado");
    }).catch(e => console.error("❌ Error al enviar:", e));
};

// --- PRESENCIA Y CARGA ---
window.onload = () => {
    if(!idOtro || !salaId) return;

    // Online / Offline
    db.ref(".info/connected").on("value", (snapshot) => {
        if (snapshot.val() === true) {
            window.presenciRef.onDisconnect().set("offline");
            db.ref("usuarios_registrados/" + miId + "/ultimaVez").onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
            window.presenciRef.set("online");
        }
    });

    // Escuchar mensajes
    db.ref("chats_privados/" + salaId).on("child_added", s => dibujarBurbuja(s.val(), s.key));
    
    // Cargar info del otro
    db.ref("usuarios_registrados/" + idOtro).on("value", s => {
        const d = s.val();
        if(d) {
            document.getElementById('header-name').innerText = d.nombre || idOtro;
            document.getElementById('header-photo').src = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            actualizarEstadoVisual(d.estado);
        }
    });
};

function actualizarEstadoVisual(estado) {
    const el = document.getElementById('header-status');
    if(!el) return;
    el.innerText = estado || "offline";
    el.style.color = (estado === "online" || estado === "escribiendo...") ? "#4ade80" : "#9ca3af";
}

// --- BURBUJAS ---
function dibujarBurbuja(data, key) {
    if (document.getElementById(key)) return;
    const esMio = data.emisor === miId;
    const b = document.createElement('div');
    b.id = key;
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
    if(esMio) b.style.backgroundColor = "#176f47"; // Tu verde favorito

    let html = "";
    if (data.tipo === 'audio') {
        html = `<div class="flex items-center gap-2"><i class="fas fa-play cursor-pointer" onclick="reproducirAudio('${data.url}', this)"></i> <span>Audio</span></div>`;
    } else if (data.tipo === 'imagen') {
        html = `<img src="${data.url}" class="rounded-lg max-w-[200px]" onclick="verImagen('${data.url}')">`;
    } else {
        html = `<div>${data.mensaje}</div>`;
    }

    b.innerHTML = `${html}<span class="text-[9px] opacity-50 block text-right">${data.hora}</span>`;
    chatContainer.appendChild(b);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- MENÚ Y MODAL (BORRAR CHAT) ---
window.toggleHeaderMenu = function() {
    const m = document.getElementById("header-menu");
    m.style.display = (m.style.display === "none" || m.style.display === "") ? "flex" : "none";
};

window.vaciarChat = function() {
    if(confirm("¿David, estás seguro de borrar todo el chat?")) {
        db.ref("chats_privados/" + salaId).remove();
        chatContainer.innerHTML = "";
        window.toggleHeaderMenu();
    }
};

// Lógica del botón enviar texto
actionBtn.onclick = () => {
    if(input.value.trim()) {
        window.sendData({ tipo: 'texto', mensaje: input.value });
        input.value = "";
        window.presenciRef.set("online");
    }
};

input.oninput = () => {
    if(input.value.trim()) {
        actionIcon.className = "fas fa-paper-plane";
        window.presenciRef.set("escribiendo...");
    } else {
        actionIcon.className = "fas fa-microphone";
        window.presenciRef.set("online");
    }
};


    // button_audio.js - REPARADO PARA SONIDO REAL
let mediaRecorder, audioChunks = [], isRecording = false;

// Función para iniciar grabación
async function startRec() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Usamos audio/webm;codecs=opus que es el más compatible
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;

        if(document.getElementById('rec-overlay')) document.getElementById('rec-overlay').style.display = 'flex';
        
        // Avisamos a Firebase que David está grabando
        if(typeof presenciRef !== 'undefined') presenciRef.set("grabando audio...");

        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        // button_audio.js
mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
        // AQUÍ LLAMAMOS AL CEREBRO
        window.sendData({ tipo: 'audio', url: reader.result });
    };
};

// Función para detener y enviar
function stopRec() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        if(document.getElementById('rec-overlay')) document.getElementById('rec-overlay').style.display = 'none';
        if(typeof presenciRef !== 'undefined') presenciRef.set("online");

        mediaRecorder.onstop = () => {
            // Creamos el Blob con los trozos de audio capturados
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Verificamos si hay sonido antes de enviar
            if (audioBlob.size > 1000) { 
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64data = reader.result;
                    // Enviamos a la función global de mensajes.js
                    if(typeof sendData === 'function') {
                        sendData({ tipo: 'audio', url: base64data });
                    }
                };
            } else {
                console.warn("Audio demasiado corto o vacío.");
            }

            // Liberamos el micrófono
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        };
    }
}

// EVENTOS DE BOTÓN (Soporte total David Oviedo Edition)
const btnAccion = document.getElementById('action-btn');
const inputMsj = document.getElementById('chat-input');

if(btnAccion) {
    // Para PC
    btnAccion.addEventListener('mousedown', (e) => {
        if(!inputMsj.value.trim()) startRec();
    });
    btnAccion.addEventListener('mouseup', () => {
        if(isRecording) stopRec();
    });

    // Para Celular (Touch)
    btnAccion.addEventListener('touchstart', (e) => {
        if(!inputMsj.value.trim()) {
            e.preventDefault();
            startRec();
        }
    });
    btnAccion.addEventListener('touchend', (e) => {
        if(isRecording) {
            e.preventDefault();
            stopRec();
        }
    });
}           
