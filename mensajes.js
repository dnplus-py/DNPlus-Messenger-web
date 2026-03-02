// mensajes.js - Versión Final DNPlus Pro - Corregida para David Oviedo
console.log("✅ DNPlus Messenger: Sistema de Mensajería Optimizado");

const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Datos de sesión
const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");

// Elementos del DOM
const input = document.getElementById('chat-input');
const actionIcon = document.getElementById('action-icon');
const chatContainer = document.getElementById('chat-container');
const actionBtn = document.getElementById('action-btn');

let msgSeleccionado = null;
let mediaRecorder, audioChunks = [], isRecording = false;
let fotoOtroGlobal = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 
let miFotoGlobal = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 

// --- INICIO DEL SISTEMA ---
window.onload = () => {
    if(!idOtro || !salaId) {
        console.error("Faltan datos de la sala o el contacto");
        return;
    }

    // 1. Cargar MI FOTO real desde la DB
    db.ref("usuarios_registrados/" + miId).on("value", s => {
        const d = s.val();
        if(d && d.foto) miFotoGlobal = d.foto;
    });

    // 2. Cargar datos del DESTINATARIO (Nombre, Foto, Estado)
    db.ref("usuarios_registrados/" + idOtro).on("value", s => {
        const d = s.val();
        if(d) {
            fotoOtroGlobal = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            document.getElementById('header-name').innerText = d.nombre || idOtro;
            document.getElementById('header-photo').src = fotoOtroGlobal;
        }
    });

    // 3. Escuchar mensajes en tiempo real
    db.ref("chats_privados/" + salaId).on("child_added", s => {
        dibujarBurbuja(s.val(), s.key);
    });

    db.ref("chats_privados/" + salaId).on("child_removed", s => {
        const el = document.getElementById(s.key);
        if(el) el.remove();
    });

    // 4. Cargar fondo personalizado
    const bgSaved = localStorage.getItem("chat_bg_" + salaId);
    if(bgSaved) {
        chatContainer.style.backgroundImage = `url('${bgSaved}')`;
        chatContainer.style.backgroundSize = "cover";
    }

    // Inicializar panel de emojis si existe en el HTML
    if(document.getElementById('emoji-panel')) cargarEmojis();
};

// --- DIBUJAR MENSAJES ---
function dibujarBurbuja(data, key) {
    if (document.getElementById(key)) return; // Evitar duplicados

    const esMio = data.emisor === miId;
    const b = document.createElement('div');
    b.id = key;
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
    // Menu contextual (Click derecho o toque largo)
    b.oncontextmenu = (e) => { 
        e.preventDefault(); 
        showMsgMenu(key); 
    };

    let contenido = "";

    if (data.tipo === 'audio') {
        const fotoAudio = esMio ? miFotoGlobal : fotoOtroGlobal;
        contenido = `
        <div class="audio-wrapper" style="display: flex; align-items: center; gap: 10px; padding: 5px;">
            <img src="${fotoAudio}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #00a884;">
            <i class="fas fa-play text-2xl cursor-pointer" onclick="reproducirAudio('${data.url}', this)"></i>
            <div class="flex-1">
                <div class="h-[3px] bg-gray-600 w-full rounded-full"><div class="h-full bg-white w-0"></div></div>
                <div class="text-[10px] mt-1 opacity-70">Nota de voz</div>
            </div>
        </div>`;
    } 
    else if (data.tipo === 'imagen') {
        // CORRECCIÓN: El onclick ahora pasa la URL correctamente para el visor
        contenido = `
        <div class="img-frame" onclick="verImagen('${data.url}')" style="cursor:pointer">
            <img src="${data.url}" style="border-radius: 10px; max-width: 100%; display: block;">
        </div>`;
    } 
    else {
        contenido = `<div class="text-content">${data.mensaje}</div>`;
    }

    b.innerHTML = `${contenido}<span class="msg-time" style="font-size: 10px; float: right; margin-top: 5px; opacity: 0.6;">${data.hora}</span>`;
    chatContainer.appendChild(b);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- FUNCIONES DE AUDIO ---
let audioActual = null, iconoActual = null;
function reproducirAudio(url, icono) {
    if (audioActual && !audioActual.paused) {
        audioActual.pause();
        iconoActual.className = "fas fa-play text-2xl";
        if (audioActual.src === url) return;
    }
    audioActual = new Audio(url);
    iconoActual = icono;
    icono.className = "fas fa-pause text-2xl";
    audioActual.play();
    audioActual.onended = () => icono.className = "fas fa-play text-2xl";
}

async function startRec() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;
        document.getElementById('rec-overlay').style.display = 'flex';
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.start();
    } catch (err) { alert("Activa el permiso de micrófono, bro."); }
}

function stopRec() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('rec-overlay').style.display = 'none';
        mediaRecorder.onstop = () => {
            const reader = new FileReader();
            reader.readAsDataURL(new Blob(audioChunks, { type: 'audio/webm' }));
            reader.onloadend = () => sendData({ tipo: 'audio', url: reader.result });
        };
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
}

// --- VISOR DE IMÁGENES (Corregido) ---
function verImagen(url) {
    const v = document.getElementById('image-viewer');
    const img = document.getElementById('full-image');
    if(!v || !img) return;
    img.src = url;
    v.style.display = 'flex';
}

function cerrarVisor() {
    document.getElementById('image-viewer').style.display = 'none';
}

// --- ENVÍO DE DATOS ---
function sendData(obj) {
    const ahora = new Date();
    const horaStr = ahora.getHours() + ":" + ahora.getMinutes().toString().padStart(2, '0');
    db.ref("chats_privados/" + salaId).push({
        ...obj,
        emisor: miId,
        hora: horaStr,
        timestamp: Date.now()
    });
    
    // Si tenemos la función de notificaciones conectada:
    if(typeof enviarAvisoDN === 'function') {
        const resumen = obj.tipo === 'texto' ? obj.mensaje : "📷 Imagen / 🎤 Audio";
        enviarAvisoDN(idOtro, "Nuevo mensaje de " + miNombre, resumen);
    }
}

// Evento del botón de acción (Enviar o Grabar)
actionBtn.onclick = () => {
    if(input.value.trim()) {
        sendData({ tipo: 'texto', mensaje: input.value });
        input.value = "";
        actualizarIcono();
    }
};

// Lógica de grabación (Mantener presionado)
actionBtn.onmousedown = actionBtn.ontouchstart = (e) => {
    if(!input.value.trim()) {
        e.preventDefault();
        startRec();
    }
};
actionBtn.onmouseup = actionBtn.ontouchend = () => {
    if(isRecording) stopRec();
};

function actualizarIcono() {
    actionIcon.className = input.value.trim() ? "fas fa-paper-plane" : "fas fa-microphone";
}
input.oninput = actualizarIcono;

// --- ADJUNTOS ---
function manejarAdjunto(el) {
    const file = el.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => sendData({ tipo: 'imagen', url: e.target.result });
    reader.readAsDataURL(file);
}

// --- EMOJIS ---
function toggleEmojis() {
    const p = document.getElementById('emoji-panel');
    if(p) p.style.display = (p.style.display === 'grid') ? 'none' : 'grid';
}

function cargarEmojis() {
    const panel = document.getElementById('emoji-panel');
    const lista = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","😍","🥰","😘","😋","😎","🤩","🥳","😏","😢","😭","😡","🥺","👋","👍","👎","👊","🤞","🤟","🤘","👏","🙌","👐","🤲","🙏","🤝","❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❣️","💕","💞","🇵🇾","🇦🇷","🇧🇷","🇺🇾","🇨🇱","🇧🇴","🇨🇴","🇲🇽","🇪🇸","🇺🇸"];
    panel.innerHTML = "";
    lista.forEach(e => {
        const s = document.createElement('span');
        s.className = 'emoji-item';
        s.innerText = e;
        s.style.cursor = "pointer";
        s.onclick = () => { 
            input.value += e; 
            actualizarIcono();
            input.focus();
        };
        panel.appendChild(s);
    });
}

// --- MENÚS Y ELIMINACIÓN ---
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

// Cerrar todo al hacer clic fuera
document.addEventListener('click', (e) => {
    if(!e.target.closest('.input-area') && !e.target.closest('#emoji-panel')) {
        const ep = document.getElementById('emoji-panel');
        if(ep) ep.style.display = 'none';
    }
    if(!e.target.closest('.bubble') && !e.target.closest('#action-header-menu')) cerrarMenuAcciones();
});
