// mensajes.js - Versión Final DNPlus para David Oviedo (Corregida)
console.log("✅ DNPlus Messenger: Sistema Activado");

const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");
const input = document.getElementById('chat-input');
const actionIcon = document.getElementById('action-icon');
const chatContainer = document.getElementById('chat-container');

let msgSeleccionado = null;
let mediaRecorder, audioChunks = [], isRecording = false;
let currentZoom = 1;
let fotoOtroGlobal = ""; 
let miFotoGlobal = ""; // Variable para tu foto real

// --- ÚNICO WINDOW.ONLOAD ---
window.onload = () => {
    if(!idOtro || !salaId) return;

    // 1. Cargar MI FOTO (David Oviedo)
    db.ref("usuarios_registrados/" + miId).on("value", s => {
        const d = s.val();
        miFotoGlobal = (d && d.foto) ? d.foto : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    });

    // 2. Cargar datos del DESTINATARIO
    db.ref("usuarios_registrados/" + idOtro).on("value", s => {
        const d = s.val();
        if(d) {
            fotoOtroGlobal = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            document.getElementById('header-name').innerText = d.nombre || idOtro;
            document.getElementById('header-photo').src = fotoOtroGlobal;
        }
    });

    // 3. Escuchar mensajes
    db.ref("chats_privados/" + salaId).on("child_added", s => {
        dibujarBurbuja(s.val(), s.key);
    });

    db.ref("chats_privados/" + salaId).on("child_removed", s => {
        const el = document.getElementById(s.key);
        if(el) el.remove();
    });

    // 4. Cargar fondo guardado
    const bgSaved = localStorage.getItem("chat_bg_" + salaId);
    if(bgSaved) {
        chatContainer.style.backgroundImage = `url('${bgSaved}')`;
        chatContainer.style.backgroundSize = "cover";
    }

    cargarEmojis();
};

function dibujarBurbuja(data, key) {
    const esMio = data.emisor === miId;
    const b = document.createElement('div');
    b.id = key;
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
    b.oncontextmenu = (e) => { 
        e.preventDefault(); 
        showMsgMenu(key); 
    };

    if (data.tipo === 'audio') {
        // CORRECCIÓN: Usar miFotoGlobal para mis mensajes
        const fotoParaAudio = esMio ? miFotoGlobal : fotoOtroGlobal;
        
        b.innerHTML = `
        <div class="audio-wrapper" style="display: flex; align-items: center; gap: 10px; padding: 5px;">
            <div class="audio-photo-container">
                <img src="${fotoParaAudio}" class="audio-user-photo" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;">
            </div>

            <i class="fas fa-play text-2xl cursor-pointer" onclick="reproducirAudio('${data.url}', this)"></i>
            
            <div class="flex-1" style="display: flex; flex-direction: column; justify-content: center;">
                <div class="h-[3px] bg-gray-600 w-full rounded-full relative">
                    <div class="h-full bg-white w-0 rounded-full"></div>
                </div>
                <div class="text-[10px] mt-1 opacity-70" style="margin-top: 4px;">Voz (${data.duracion || '0:05'})</div>
            </div>
        </div>
        <span class="msg-time">${data.hora}</span>`;
    } 
    else if (data.tipo === 'imagen') {
        b.innerHTML = `
        <div class="img-frame" onclick="verImagen('${data.url}')">
            <img src="${data.url}">
        </div>
        <span class="msg-time">${data.hora}</span>`;
    } 
    else {
        b.innerHTML = `<div class="text-content">${data.mensaje}</div><span class="msg-time">${data.hora}</span>`;
    }

    chatContainer.appendChild(b);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- AUDIO ---
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
        const overlay = document.getElementById('rec-overlay');
        if(overlay) overlay.style.display = 'flex';
        
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.start();
    } catch (err) { alert("Permiso de micrófono denegado"); }
}

function stopRec() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        const overlay = document.getElementById('rec-overlay');
        if(overlay) overlay.style.display = 'none';
        
        mediaRecorder.onstop = () => {
            const reader = new FileReader();
            reader.readAsDataURL(new Blob(audioChunks, { type: 'audio/webm' }));
            reader.onloadend = () => {
                sendData({ tipo: 'audio', url: reader.result, duracion: "Voz" });
            };
        };
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

// --- VISOR DE IMAGEN ---
function verImagen(url) {
    const v = document.getElementById('image-viewer');
    const img = document.getElementById('full-image');
    img.src = url;
    currentZoom = 1;
    img.style.transform = `scale(${currentZoom})`;
    v.style.display = 'flex';
}

function zoomImg(scale) {
    currentZoom *= scale;
    document.getElementById('full-image').style.transform = `scale(${currentZoom})`;
}

function cerrarVisor() {
    document.getElementById('image-viewer').style.display = 'none';
}

// --- MENÚ DE ACCIONES ---
function showMsgMenu(key) {
    msgSeleccionado = key;
    document.querySelectorAll('.bubble').forEach(el => el.style.filter = "none");
    const el = document.getElementById(key);
    if(el) el.style.filter = "brightness(0.8)";
    document.getElementById('action-header-menu').style.display = 'flex';
}

function cerrarMenuAcciones() {
    if (msgSeleccionado) {
        const el = document.getElementById(msgSeleccionado);
        if (el) el.style.filter = "none";
    }
    document.getElementById('action-header-menu').style.display = 'none';
    msgSeleccionado = null;
}

function borrarMensaje() {
    if (msgSeleccionado) {
        db.ref("chats_privados/" + salaId + "/" + msgSeleccionado).remove();
        cerrarMenuAcciones();
    }
}

function vaciarChat() {
    if(confirm("¿Vaciar todos los mensajes?")) {
        db.ref("chats_privados/" + salaId).remove();
        toggleHeaderMenu();
    }
}

// --- EMOJIS ---
function toggleEmojis() {
    const p = document.getElementById('emoji-panel');
    p.style.display = (p.style.display === 'grid') ? 'none' : 'grid';
}

function cargarEmojis() {
    const panel = document.getElementById('emoji-panel');
    const emojis = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","😍","🥰","😘","😋","😎","🤩","🥳","😏","😢","😭","😡","🥺","👋","👍","👎","👊","🤞","🤟","🤘","👏","🙌","👐","🤲","🙏","🤝","❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❣️","💕","💞","🇵🇾","🇦🇷","🇧🇷","🇺🇾","🇨🇱","🇧🇴","🇨🇴","🇲🇽","🇪🇸","🇺🇸"];
    panel.innerHTML = "";
    emojis.forEach(e => {
        const s = document.createElement('span');
        s.className = 'emoji-item';
        s.innerText = e;
        s.onclick = () => { input.value += e; input.focus(); input.oninput(); };
        panel.appendChild(s);
    });
}

// --- OTROS ---
function toggleHeaderMenu() {
    const menu = document.getElementById('header-menu');
    menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
}

function cambiarFondo() { document.getElementById('bg-input').click(); }

function aplicarNuevoFondo(el) {
    const file = el.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            chatContainer.style.backgroundImage = `url('${e.target.result}')`;
            chatContainer.style.backgroundSize = "cover";
            localStorage.setItem("chat_bg_" + salaId, e.target.result);
        };
        reader.readAsDataURL(file);
        toggleHeaderMenu();
    }
}

function manejarAdjunto(el) {
    const file = el.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => sendData({ tipo: 'imagen', url: e.target.result });
}

function sendData(p) {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    db.ref("chats_privados/" + salaId).push({ ...p, emisor: miId, hora: hora });
}

input.oninput = () => actionIcon.className = input.value.trim() ? "fas fa-paper-plane" : "fas fa-microphone";

const btn = document.getElementById('action-btn');
btn.onclick = () => {
    if(input.value.trim()) {
        sendData({ tipo: 'texto', mensaje: input.value });
        input.value = ""; input.oninput();
    }
};

btn.onmousedown = btn.ontouchstart = (e) => { 
    if(!input.value.trim()) {
        e.preventDefault();
        startRec(); 
    }
};
btn.onmouseup = btn.ontouchend = () => { if(isRecording) stopRec(); };

document.addEventListener('click', (e) => {
    if(!e.target.closest('.input-area') && !e.target.closest('#emoji-panel')) document.getElementById('emoji-panel').style.display = 'none';
    if(!e.target.closest('.bubble') && !e.target.closest('#action-header-menu')) cerrarMenuAcciones();
    if(!e.target.closest('.relative')) {
        const hm = document.getElementById('header-menu');
        if(hm) hm.style.display = 'none';
    }
});
