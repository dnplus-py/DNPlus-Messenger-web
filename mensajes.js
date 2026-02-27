// mensajes.js - Versión Final Corregida para David Oviedo
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

window.onload = () => {
    if(!idOtro || !salaId) return;

    db.ref("usuarios_registrados/" + idOtro).on("value", s => {
        const d = s.val();
        if(d) {
            document.getElementById('header-name').innerText = d.nombre || idOtro;
            document.getElementById('header-photo').src = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        }
    });

    // Escuchar mensajes nuevos
    db.ref("chats_privados/" + salaId).on("child_added", s => {
        dibujarBurbuja(s.val(), s.key);
    });

    // Escuchar cuando se borra un mensaje para quitarlo de la pantalla sin recargar
    db.ref("chats_privados/" + salaId).on("child_removed", s => {
        const el = document.getElementById(s.key);
        if(el) el.remove();
    });

    cargarEmojis();
};

function dibujarBurbuja(data, key) {
    const esMio = data.emisor === miId;
    const b = document.createElement('div');
    b.id = key; // ID para poder borrarlo luego
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
    b.oncontextmenu = (e) => { e.preventDefault(); showMsgMenu(e, key); };

    if (data.tipo === 'audio') {
        b.innerHTML = `
        <div class="audio-wrapper">
            <i class="fas fa-play text-2xl cursor-pointer" onclick="reproducirAudio('${data.url}', this)"></i>
            <div class="flex-1">
                <div class="h-[4px] bg-gray-600 w-full rounded-full"><div class="h-full bg-white w-0 rounded-full"></div></div>
                <div class="text-[10px] mt-1">Voz (${data.duracion || '0:05'})</div>
            </div>
        </div>
        <span class="msg-time">${data.hora}</span>`;
    } 
    else if (data.tipo === 'imagen') {
        b.innerHTML = `
        <div class="img-frame" onclick="verImagen('${data.url}')">
            <img src="${data.url}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <span class="msg-time">${data.hora}</span>`;
    } 
    else {
        b.innerHTML = `<div class="text-content">${data.mensaje}</div><span class="msg-time">${data.hora}</span>`;
    }

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
    } catch (err) { alert("Permiso de micrófono denegado"); }
}

function stopRec() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('rec-overlay').style.display = 'none';
        mediaRecorder.onstop = () => {
            const reader = new FileReader();
            reader.readAsDataURL(new Blob(audioChunks, { type: 'audio/mp3' }));
            reader.onloadend = () => {
                sendData({ tipo: 'audio', url: reader.result, duracion: "Voz" });
            };
        };
    }
}

// --- VISOR DE IMAGEN ---
function verImagen(url) {
    const v = document.getElementById('image-viewer');
    document.getElementById('full-image').src = url;
    v.style.display = 'flex';
}

// --- MENÚ Y BORRADO ---
function showMsgMenu(e, key) {
    e.preventDefault();
    msgSeleccionado = key;
    const menu = document.getElementById('context-menu');
    menu.style.display = 'flex';
    menu.style.top = e.pageY + 'px';
    menu.style.left = e.pageX + 'px';
}

function borrarMensaje() {
    if(msgSeleccionado) {
        db.ref("chats_privados/" + salaId + "/" + msgSeleccionado).remove();
        document.getElementById('context-menu').style.display = 'none';
        // Ya no hace falta reload, child_removed lo quita solo
    }
}

// --- EMOJIS ---
function toggleEmojis() {
    const p = document.getElementById('emoji-panel');
    p.style.display = p.style.display === 'grid' ? 'none' : 'grid';
}

function cargarEmojis() {
    const panel = document.getElementById('emoji-panel');
    const pack = {
        "Caritas": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","😍","🥰","😘","😋","😎","🤩","🥳","😏","😢","😭","😡","🥺"],
        "Gestos": ["👋","👍","👎","👊","🤞","🤟","🤘","👏","🙌","👐","🤲","🙏","🤝"],
        "Corazones": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❣️","💕","💞"],
        "Banderas": ["🇵🇾","🇦🇷","🇧🇷","🇺🇾","🇨🇱","🇧🇴","🇨🇴","🇲🇽","🇪🇸","🇺🇸"]
    };
    panel.innerHTML = "";
    for (const [cat, lista] of Object.entries(pack)) {
        const t = document.createElement('div');
        t.className = 'emoji-category-title'; t.innerText = cat;
        panel.appendChild(t);
        lista.forEach(e => {
            const s = document.createElement('span');
            s.className = 'text-2xl p-2 cursor-pointer text-center';
            s.innerText = e;
            s.onclick = () => { input.value += e; input.focus(); input.oninput(); };
            panel.appendChild(s);
        });
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

// Eventos de grabación
btn.onmousedown = btn.ontouchstart = (e) => { if(!input.value) startRec(); };
btn.onmouseup = btn.ontouchend = () => { if(isRecording) stopRec(); };

document.addEventListener('click', (e) => {
    if(!e.target.closest('.input-area') && !e.target.closest('#emoji-panel')) document.getElementById('emoji-panel').style.display = 'none';
    if(!e.target.closest('.bubble')) document.getElementById('context-menu').style.display = 'none';
});


// Abrir/Cerrar menú de cabecera
function toggleHeaderMenu() {
    const menu = document.getElementById('header-menu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

// Lógica para Vaciar Chat
function vaciarChat() {
    if(confirm("¿Estás seguro de que quieres vaciar todos los mensajes de este chat?")) {
        db.ref("chats_privados/" + salaId).remove();
        document.getElementById('header-menu').style.display = 'none';
        chatContainer.innerHTML = ""; // Limpia la pantalla al instante
    }
}

// Lógica para cambiar fondo de pantalla
function cambiarFondo() {
    document.getElementById('bg-input').click();
}

function aplicarNuevoFondo(inputEl) {
    const file = inputEl.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            chatContainer.style.backgroundImage = `url('${e.target.result}')`;
            chatContainer.style.backgroundSize = "cover";
            // Guardar en localStorage para que no se pierda al recargar
            localStorage.setItem("chat_bg_" + salaId, e.target.result);
        };
        reader.readAsDataURL(file);
        document.getElementById('header-menu').style.display = 'none';
    }
}

// Cargar fondo guardado al iniciar
window.addEventListener('load', () => {
    const bgSaved = localStorage.getItem("chat_bg_" + salaId);
    if(bgSaved) {
        chatContainer.style.backgroundImage = `url('${bgSaved}')`;
        chatContainer.style.backgroundSize = "cover";
    }
});

// Cerrar menú si se toca fuera
document.addEventListener('click', (e) => {
    if(!e.target.closest('.relative')) {
        document.getElementById('header-menu').style.display = 'none';
    }
});
