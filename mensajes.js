// mensajes.js - Versión Final DNPlus (Optimización Modal)
console.log("✅ DNPlus Messenger: Sistema Modal Activado");

const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- 1. DATOS INSTANTÁNEOS (MODO MODAL) ---
const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");

// Recuperamos nombre y foto de la memoria para carga inmediata
const nombreLocal = localStorage.getItem("chat_destinatario_nombre");
const fotoLocal = localStorage.getItem("chat_destinatario_foto");

const input = document.getElementById('chat-input');
const actionIcon = document.getElementById('action-icon');
const chatContainer = document.getElementById('chat-container');

let msgSeleccionado = null;
let mediaRecorder, audioChunks = [], isRecording = false;
let currentZoom = 1;

window.onload = () => {
    if(!idOtro || !salaId) return;

    // CARGA MODAL INMEDIATA: Ponemos los datos antes de llamar a Firebase
    if(nombreLocal) document.getElementById('header-name').innerText = nombreLocal;
    if(fotoLocal) document.getElementById('header-photo').src = fotoLocal;

    // Luego, Firebase actualiza si hubo cambios y maneja el "En línea"
    db.ref("usuarios_registrados/" + idOtro).on("value", s => {
        const d = s.val();
        if(d) {
            document.getElementById('header-name').innerText = d.nombre || idOtro;
            document.getElementById('header-photo').src = d.foto || d.foto_perfil || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            
            // Actualizar la "Rayita" de estado
            const statusTxt = document.getElementById('header-status');
            if(statusTxt){
                const pres = d.presencia || d.estado || "offline";
                statusTxt.innerText = pres === "online" ? "en línea" : (d.ultima_vez ? "últ. vez " + d.ultima_vez : pres);
                statusTxt.style.color = (pres === "online" || pres === "escribiendo...") ? "#4ade80" : "#8696a0";
            }
        }
    });

    // Carga de Mensajes
    db.ref("chats_privados/" + salaId).on("child_added", s => {
        dibujarBurbuja(s.val(), s.key);
    });

    db.ref("chats_privados/" + salaId).on("child_removed", s => {
        const el = document.getElementById(s.key);
        if(el) el.remove();
    });

    // Fondo personalizado
    const bgSaved = localStorage.getItem("chat_bg_" + salaId);
    if(bgSaved && chatContainer) {
        chatContainer.style.backgroundImage = `url('${bgSaved}')`;
        chatContainer.style.backgroundSize = "cover";
    }

    cargarEmojis();
};

// --- 2. DIBUJAR MENSAJES ---
function dibujarBurbuja(data, key) {
    const esMio = (data.emisor === miId || data.remitente === miId);
    const b = document.createElement('div');
    b.id = key;
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
    b.oncontextmenu = (e) => { e.preventDefault(); showMsgMenu(key); };

    let contenido = "";
    if (data.tipo === 'audio') {
        contenido = `
        <div class="audio-wrapper">
            <i class="fas fa-play text-2xl cursor-pointer" onclick="reproducirAudio('${data.url}', this)"></i>
            <div class="flex-1">
                <div class="h-[4px] bg-gray-600 w-full rounded-full"><div class="h-full bg-white w-0 rounded-full"></div></div>
                <div class="text-[10px] mt-1">Voz</div>
            </div>
        </div>`;
    } else if (data.tipo === 'imagen') {
        contenido = `<div class="img-frame" onclick="verImagen('${data.url}')"><img src="${data.url}"></div>`;
    } else {
        contenido = `<div class="text-content">${data.mensaje}</div>`;
    }

    b.innerHTML = `${contenido}<span class="msg-time">${data.hora}</span>`;
    chatContainer.appendChild(b);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- 3. FUNCIONES DE ENVÍO ---
function sendData(p) {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    db.ref("chats_privados/" + salaId).push({ 
        ...p, 
        emisor: miId, 
        remitente: miId, 
        hora: hora,
        timestamp: firebase.database.ServerValue.TIMESTAMP 
    });
}

// --- 4. AUDIO Y GRABACIÓN ---
async function startRec() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;
        document.getElementById('rec-overlay').style.display = 'flex';
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.start();
        db.ref("usuarios_registrados/" + miId).update({ presencia: "grabando audio..." });
    } catch (err) { console.log("Mic error"); }
}

function stopRec() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('rec-overlay').style.display = 'none';
        mediaRecorder.onstop = () => {
            const reader = new FileReader();
            reader.readAsDataURL(new Blob(audioChunks, { type: 'audio/mp3' }));
            reader.onloadend = () => sendData({ tipo: 'audio', url: reader.result });
            db.ref("usuarios_registrados/" + miId).update({ presencia: "online" });
        };
    }
}

// --- 5. INTERFAZ Y EVENTOS ---
input.oninput = () => {
    actionIcon.className = input.value.trim() ? "fas fa-paper-plane" : "fas fa-microphone";
    if(input.value.trim()) db.ref("usuarios_registrados/" + miId).update({ presencia: "escribiendo..." });
};

const btn = document.getElementById('action-btn');
btn.onclick = () => {
    if(input.value.trim()) {
        sendData({ tipo: 'texto', mensaje: input.value });
        input.value = ""; 
        input.dispatchEvent(new Event('input'));
    }
};

btn.onmousedown = btn.ontouchstart = (e) => { if(!input.value) startRec(); };
btn.onmouseup = btn.ontouchend = () => { if(isRecording) stopRec(); };

// --- 6. GESTIÓN DE MENSAJES (BORRAR) ---
function showMsgMenu(key) {
    msgSeleccionado = key;
    document.getElementById('action-header-menu').style.display = 'flex';
}

function cerrarMenuAcciones() {
    document.getElementById('action-header-menu').style.display = 'none';
    msgSeleccionado = null;
}

function borrarMensaje() {
    if (msgSeleccionado) {
        db.ref("chats_privados/" + salaId + "/" + msgSeleccionado).remove();
        cerrarMenuAcciones();
    }
}

// --- 7. OTROS (Fondo, Emojis, Menú) ---
function cambiarFondo() { document.getElementById('bg-input').click(); }

function aplicarNuevoFondo(el) {
    const file = el.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            chatContainer.style.backgroundImage = `url('${e.target.result}')`;
            localStorage.setItem("chat_bg_" + salaId, e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// (CargarEmojis y toggleHeaderMenu se mantienen igual que en tu código)
