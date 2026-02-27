<script>
// mensajes.js - Versión Centralizada
console.log("✅ DNPlus Messenger: Librería cargada correctamente");

function enviarPorPartes(tipo, contenido) {
    console.log("Extrayendo URL del tipo: " + tipo);
    // Aquí irá la lógica de Firebase que ya tenemos
}

// Esto avisará en la consola del navegador si funcionó
document.addEventListener("DOMContentLoaded", () => {
    alert("¡Conectado a la librería central de DNPlus!");
});

// Configuración de Firebase (Asegúrate de que coincida con tu proyecto)
const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Variables de Sesión y Elementos
const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");
const input = document.getElementById('chat-input');
const actionIcon = document.getElementById('action-icon');
const chatContainer = document.getElementById('chat-container');
let msgSeleccionado = null;

// --- CARGA INICIAL ---
window.onload = () => {
    if(!idOtro || !salaId) return;

    // Cargar datos del contacto
    db.ref("usuarios_registrados/" + idOtro).on("value", s => {
        const d = s.val();
        if(d) {
            document.getElementById('header-name').innerText = d.nombre || idOtro;
            document.getElementById('header-photo').src = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        }
    });

    // Escuchar nuevos mensajes
    db.ref("chats_privados/" + salaId).on("child_added", s => {
        dibujarBurbuja(s.val(), s.key);
    });

    cargarEmojis();
};

// --- DIBUJAR MENSAJES ---
function dibujarBurbuja(data, key) {
    const esMio = data.emisor === miId;
    const b = document.createElement('div');
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
    // Evento para menú de eliminar (toque largo o clic derecho)
    b.oncontextmenu = (e) => { e.preventDefault(); showMsgMenu(e, key); };

    if(data.tipo === 'audio') {
        b.innerHTML = `
        <div class="audio-wrapper">
            <img src="${esMio ? 'https://i.postimg.cc/mD8zM1vW/david-profile.jpg' : document.getElementById('header-photo').src}" class="audio-avatar">
            <i class="fas fa-play text-2xl cursor-pointer" onclick="new Audio('${data.url}').play()"></i>
            <div class="flex-1">
                <div class="h-1 bg-gray-500 w-full rounded"></div>
                <div class="text-[10px] mt-1">Mensaje de voz (${data.duracion})</div>
            </div>
        </div>
        <span class="msg-time">${data.hora}</span>`;
    } else {
        b.innerHTML = `
        <div class="text-content">${data.mensaje}</div>
        <span class="msg-time">${data.hora}</span>`;
    }

    chatContainer.appendChild(b);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- ENVÍO DE DATOS ---
function sendData(payload) {
    const ahora = new Date();
    const horaStr = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    db.ref("chats_privados/" + salaId).push({
        ...payload,
        emisor: miId,
        hora: horaStr,
        timestamp: Date.now()
    });
}

// --- LÓGICA DE GRABACIÓN DE AUDIO ---
let mediaRecorder, audioChunks = [], isRecording = false;

async function startRec() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;
        document.getElementById('rec-overlay').style.display = 'flex';
        
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/mp3' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                if(audioChunks.length > 0) {
                    sendData({ tipo: 'audio', url: reader.result, duracion: "0:05" });
                }
            };
        };
        mediaRecorder.start();
    } catch(e) { alert("Error: Acceso al micrófono denegado."); }
}

function stopRec() {
    if(mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('rec-overlay').style.display = 'none';
    }
}

// --- CONTROLES DEL BOTÓN DE ACCIÓN ---
const actionBtn = document.getElementById('action-btn');

actionBtn.onclick = () => {
    if(input.value.trim() !== "") {
        sendData({ tipo: 'texto', mensaje: input.value });
        input.value = "";
        actionIcon.className = "fas fa-microphone";
    }
};

// Grabación táctil/ratón
actionBtn.onmousedown = actionBtn.ontouchstart = (e) => {
    if(input.value.trim() === "") startRec();
};
actionBtn.onmouseup = actionBtn.ontouchend = () => {
    if(isRecording) setTimeout(stopRec, 300);
};

// Cambio de icono al escribir
input.oninput = () => {
    actionIcon.className = input.value.trim() !== "" ? "fas fa-paper-plane" : "fas fa-microphone";
};

// --- MENÚS Y EMOJIS ---
function toggleEmojis() {
    const p = document.getElementById('emoji-panel');
    p.style.display = p.style.display === 'grid' ? 'none' : 'grid';
}

function cargarEmojis() {
    const emojis = ["😀","😂","😍","👍","🔥","🙌","❤️","😎","🤔","😊","😡","😭"];
    const panel = document.getElementById('emoji-panel');
    emojis.forEach(e => {
        const s = document.createElement('span');
        s.className = 'text-2xl cursor-pointer text-center p-1';
        s.innerText = e;
        s.onclick = () => { 
            input.value += e; 
            input.dispatchEvent(new Event('input')); 
        };
        panel.appendChild(s);
    });
}

function showMsgMenu(e, key) {
    msgSeleccionado = key;
    const menu = document.getElementById('msg-menu');
    menu.style.display = 'flex';
    menu.style.top = e.pageY + 'px';
    menu.style.left = (e.pageX > 200 ? e.pageX - 150 : e.pageX) + 'px';
}
        
function accionMsg(tipo) {
    if(tipo === 'eliminar') {
        if(confirm("¿Eliminar este mensaje?")) {
            db.ref("chats_privados/" + salaId + "/" + msgSeleccionado).remove();
            location.reload();
        }
    }
    if(tipo === 'reenviar') { alert("Función de reenvío: Selecciona un contacto."); }
    document.getElementById('msg-menu').style.display = 'none';
}

// Cerrar menús al hacer clic fuera
document.addEventListener('click', (e) => {
    if(!e.target.closest('.bubble')) document.getElementById('msg-menu').style.display = 'none';
    if(!e.target.closest('.input-area') && !e.target.closest('#emoji-panel')) {
        document.getElementById('emoji-panel').style.display = 'none';
    }
});
</script>
