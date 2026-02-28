// mensajes.js - Versión Final DNPlus para David Oviedo (Corregida)
console.log("✅ DNPlus Messenger: Sistema Activado");

const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");

// Elementos del DOM
const input = document.getElementById('chat-input');
const actionIcon = document.getElementById('action-icon');
const chatContainer = document.getElementById('chat-container');
const recOverlay = document.getElementById('rec-overlay');
const imageViewer = document.getElementById('image-viewer');
const fullImage = document.getElementById('full-image');
const actionHeaderMenu = document.getElementById('action-header-menu');
const emojiPanel = document.getElementById('emoji-panel');
const headerMenu = document.getElementById('header-menu');
const bgInput = document.getElementById('bg-input');

let msgSeleccionado = null;
let mediaRecorder, audioChunks = [], isRecording = false;
let currentZoom = 1;
let audioActual = null, iconoActual = null;

window.onload = () => {
    if (!idOtro || !salaId) return;

    // Datos del contacto
    db.ref("usuarios_registrados/" + idOtro).on("value", (snapshot) => {
        const datos = snapshot.val();
        if (datos) {
            document.getElementById('header-name').innerText = datos.nombre || idOtro;
            document.getElementById('header-photo').src = datos.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        }
    });

    // Cargar Mensajes
    db.ref("chats_privados/" + salaId).on("child_added", (snapshot) => {
        dibujarBurbuja(snapshot.val(), snapshot.key);
    });

    db.ref("chats_privados/" + salaId).on("child_removed", (snapshot) => {
        const el = document.getElementById(snapshot.key);
        if (el) el.remove();
    });

    const bgSaved = localStorage.getItem("chat_bg_" + salaId);
    if (bgSaved) chatContainer.style.backgroundImage = `url('${bgSaved}')`;

    cargarEmojis();
};

function dibujarBurbuja(data, key) {
    const esMio = data.emisor === miId;
    const burbuja = document.createElement('div');
    burbuja.id = key;
    burbuja.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
    burbuja.oncontextmenu = (e) => { e.preventDefault(); showMsgMenu(key); };

    if (data.tipo === 'audio') {
        burbuja.innerHTML = `
            <div class="audio-wrapper">
                <i class="fas fa-play text-2xl cursor-pointer" onclick="reproducirAudio('${data.url}', this)"></i>
                <div class="flex-1">
                    <div class="h-[4px] bg-gray-600 w-full rounded-full"><div class="h-full bg-white w-0 rounded-full"></div></div>
                    <div class="text-[10px] mt-1">Mensaje de voz</div>
                </div>
            </div>
            <span class="msg-time">${data.hora}</span>`;
    } else if (data.tipo === 'imagen') {
        burbuja.innerHTML = `<div class="img-frame" onclick="verImagen('${data.url}')"><img src="${data.url}"></div><span class="msg-time">${data.hora}</span>`;
    } else {
        burbuja.innerHTML = `<div>${data.mensaje}</div><span class="msg-time">${data.hora}</span>`;
    }

    chatContainer.appendChild(burbuja);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- GESTIÓN DE AUDIO ---
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
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.start();
        isRecording = true;
        recOverlay.classList.remove('hidden');
    } catch (err) { alert("Error al acceder al micro"); }
}

function stopRec() {
    if (!mediaRecorder || !isRecording) return;
    mediaRecorder.stop();
    isRecording = false;
    recOverlay.classList.add('hidden');
    mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => sendData({ tipo: 'audio', url: reader.result });
    };
}

// --- ENVÍO DE DATOS ---
function sendData(payload) {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    db.ref("chats_privados/" + salaId).push({ ...payload, emisor: miId, hora: hora });
}

// --- EVENTOS DEL BOTÓN DE ACCIÓN (IMPORTANTE) ---
const actionBtn = document.getElementById('action-btn');

actionBtn.addEventListener('click', () => {
    if (input.value.trim() !== "") {
        sendData({ tipo: 'texto', mensaje: input.value.trim() });
        input.value = "";
        actualizarIcono();
    }
});

// Grabación por pulsación larga
actionBtn.addEventListener('mousedown', () => { if (input.value.trim() === "") startRec(); });
actionBtn.addEventListener('mouseup', () => { if (isRecording) stopRec(); });
actionBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (input.value.trim() === "") startRec(); });
actionBtn.addEventListener('touchend', () => { if (isRecording) stopRec(); });

function actualizarIcono() {
    actionIcon.className = input.value.trim() ? "fas fa-paper-plane" : "fas fa-microphone";
}
input.oninput = actualizarIcono;

// --- EMOJIS ---
function cargarEmojis() {
    const emojis = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","😍","🥰","😘","😋","😎","🤩","🥳","😏","😢","😭","😡","🥺","👋","👍","👎","👊","🤞","🤟","🤘","👏","🙌","🙏","🤝","❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❣️","💕","💞","🇵🇾","🇦🇷","🇧🇷","🇺🇾","🇨🇱","🇧🇴","🇨🇴","🇲🇽","🇪🇸","🇺🇸"];
    emojiPanel.innerHTML = "";
    emojis.forEach(e => {
        const btn = document.createElement('span');
        btn.className = "emoji-item";
        btn.innerText = e;
        btn.onclick = () => { input.value += e; input.focus(); actualizarIcono(); };
        emojiPanel.appendChild(btn);
    });
}

function toggleEmojis() { emojiPanel.classList.toggle('hidden'); }
function toggleHeaderMenu() { headerMenu.classList.toggle('hidden'); }

// --- VISOR Y OTROS ---
function verImagen(url) { fullImage.src = url; imageViewer.classList.remove('hidden'); }
function cerrarVisor() { imageViewer.classList.add('hidden'); }
function showMsgMenu(key) { msgSeleccionado = key; actionHeaderMenu.classList.remove('hidden'); }
function cerrarMenuAcciones() { actionHeaderMenu.classList.add('hidden'); msgSeleccionado = null; }

function borrarMensaje() {
    if (msgSeleccionado) db.ref("chats_privados/" + salaId + "/" + msgSeleccionado).remove();
    cerrarMenuAcciones();
}

function cambiarFondo() { bgInput.click(); }
function aplicarNuevoFondo(el) {
    const reader = new FileReader();
    reader.onload = e => {
        chatContainer.style.backgroundImage = `url('${e.target.result}')`;
        localStorage.setItem("chat_bg_" + salaId, e.target.result);
    };
    reader.readAsDataURL(el.files[0]);
}
