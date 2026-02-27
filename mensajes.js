// mensajes.js - COMPLETO Y CORREGIDO PARA DAVID OVIEDO
console.log("✅ DNPlus Messenger: Cargando sistema completo...");

// 1. CONFIGURACIÓN FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. VARIABLES GLOBALES
const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");
const input = document.getElementById('chat-input');
const actionIcon = document.getElementById('action-icon');
const chatContainer = document.getElementById('chat-container');
let msgSeleccionado = null;

// 3. CARGA INICIAL
window.onload = () => {
    if(!idOtro || !salaId) return;

    // Cargar info del contacto
    db.ref("usuarios_registrados/" + idOtro).on("value", s => {
        const d = s.val();
        if(d) {
            document.getElementById('header-name').innerText = d.nombre || idOtro;
            document.getElementById('header-photo').src = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        }
    });

    // Escuchar mensajes
    db.ref("chats_privados/" + salaId).on("child_added", s => {
        dibujarBurbuja(s.val(), s.key);
    });

    cargarEmojis();
};

// 4. DIBUJAR BURBUJAS (Medidas exactas de David)
function dibujarBurbuja(data, key) {
    const esMio = data.emisor === miId;
    const b = document.createElement('div');
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
    b.oncontextmenu = (e) => { e.preventDefault(); showMsgMenu(e, key); };

    if (data.tipo === 'audio') {
        b.innerHTML = `
        <div class="audio-wrapper" style="height:60px; display:flex; align-items:center; gap:10px; width:250px;">
            <i class="fas fa-play text-2xl cursor-pointer" onclick="new Audio('${data.url}').play()"></i>
            <div class="flex-1">
                <div class="h-[4px] bg-gray-600 w-full rounded-full"><div class="h-full bg-white w-0 rounded-full"></div></div>
                <div class="text-[10px] mt-1">Voz (${data.duracion || '0:05'})</div>
            </div>
        </div>
        <span class="msg-time">${data.hora}</span>`;
    } 
    else if (data.tipo === 'imagen') {
        b.innerHTML = `
        <div style="width:180px; height:230px; overflow:hidden; border-radius:10px;">
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

// 5. SISTEMA DE EMOJIS (Pack WhatsApp)
function toggleEmojis() {
    const p = document.getElementById('emoji-panel');
    p.style.display = p.style.display === 'grid' ? 'none' : 'grid';
}

function cargarEmojis() {
    const emojis = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕"];
    const panel = document.getElementById('emoji-panel');
    panel.innerHTML = "";
    emojis.forEach(e => {
        const s = document.createElement('span');
        s.className = 'text-2xl p-2 cursor-pointer text-center';
        s.innerText = e;
        s.onclick = () => { 
            input.value += e; 
            input.oninput(); // Actualiza el icono de enviar
        };
        panel.appendChild(s);
    });
}

// 6. EXTRAER URL DE ARCHIVOS
function manejarAdjunto(inputElement) {
    const archivo = inputElement.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.readAsDataURL(archivo);
    lector.onload = (e) => {
        sendData({
            tipo: archivo.type.includes('image') ? 'imagen' : 'archivo',
            url: e.target.result,
            mensaje: "Archivo enviado"
        });
    };
}

// 7. GRABACIÓN DE AUDIO
let mediaRecorder, audioChunks = [], isRecording = false;

async function startRec() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;
        document.getElementById('rec-overlay').style.display = 'flex';
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.start();
    } catch(e) { alert("Acceso al micrófono denegado"); }
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
                sendData({ tipo: 'audio', url: reader.result, duracion: "0:05" });
            };
        };
    }
}

// 8. ENVÍO Y BOTONES
function sendData(p) {
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    db.ref("chats_privados/" + salaId).push({ ...p, emisor: miId, hora: hora });
}

input.oninput = () => {
    actionIcon.className = input.value.trim() ? "fas fa-paper-plane" : "fas fa-microphone";
};

const btn = document.getElementById('action-btn');
btn.onclick = () => {
    if(input.value.trim()) {
        sendData({ tipo: 'texto', mensaje: input.value });
        input.value = "";
        input.oninput();
    }
};

// Toque largo para grabar
btn.onmousedown = btn.ontouchstart = (e) => { if(!input.value) startRec(); };
btn.onmouseup = btn.ontouchend = () => { if(isRecording) stopRec(); };

// Cerrar paneles al hacer clic en el chat
document.addEventListener('click', (e) => {
    if(!e.target.closest('.input-area') && !e.target.closest('#emoji-panel')) {
        document.getElementById('emoji-panel').style.display = 'none';
    }
});
