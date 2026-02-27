
// Configuración de Firebase
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

// --- FUNCIÓN PARA EXTRAER URL Y ENVIAR ARCHIVOS ---
function manejarAdjunto(inputElement) {
    const archivo = inputElement.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    document.getElementById('header-status').innerText = "enviando...";

    lector.onload = (e) => {
        const urlData = e.target.result; // Aquí se extrae la URL/Base64 del archivo
        let tipoMsg = 'archivo';
        
        if (archivo.type.includes('image')) tipoMsg = 'imagen';
        if (archivo.type.includes('video')) tipoMsg = 'video';

        sendData({
            tipo: tipoMsg,
            url: urlData,
            mensaje: tipoMsg === 'imagen' ? '📷 Imagen' : '📁 Archivo'
        });
        document.getElementById('header-status').innerText = "en línea";
    };
    lector.readAsDataURL(archivo);
}

// --- LOGICA DE ENVÍO ---
function sendData(payload) {
    const horaStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    db.ref("chats_privados/" + salaId).push({
        ...payload,
        emisor: miId,
        hora: horaStr,
        timestamp: Date.now()
    });
}

// --- DIBUJAR MENSAJES MODULAR ---
function dibujarBurbuja(data, key) {
    const esMio = data.emisor === miId;
    const b = document.createElement('div');
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    b.oncontextmenu = (e) => { e.preventDefault(); showMsgMenu(e, key); };

    if(data.tipo === 'audio') {
        b.innerHTML = `<div class="audio-wrapper">
            <img src="${esMio ? 'https://i.postimg.cc/mD8zM1vW/david-profile.jpg' : document.getElementById('header-photo').src}" class="audio-avatar">
            <i class="fas fa-play text-2xl cursor-pointer" onclick="new Audio('${data.url}').play()"></i>
            <div class="flex-1"><div class="h-1 bg-gray-500 rounded"></div><div class="text-[10px] mt-1">Voz (${data.duracion || '0:05'})</div></div>
        </div><span class="msg-time">${data.hora}</span>`;
    } else if(data.tipo === 'imagen') {
        b.innerHTML = `<img src="${data.url}" class="rounded-lg max-w-full mb-1"><span class="msg-time">${data.hora}</span>`;
    } else {
        b.innerHTML = `<div class="text-content">${data.mensaje}</div><span class="msg-time">${data.hora}</span>`;
    }

    chatContainer.appendChild(b);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- MENÚS Y CONTROLES ---
function toggleEmojis() {
    const p = document.getElementById('emoji-panel');
    p.style.display = p.style.display === 'grid' ? 'none' : 'grid';
}

function showMsgMenu(e, key) {
    msgSeleccionado = key;
    const menu = document.getElementById('msg-menu');
    menu.style.display = 'flex';
    menu.style.top = e.pageY + 'px';
    menu.style.left = (e.pageX > 200 ? e.pageX - 150 : e.pageX) + 'px';
}

function accionMsg(tipo) {
    if(tipo === 'eliminar' && confirm("¿Eliminar mensaje?")) {
        db.ref("chats_privados/" + salaId + "/" + msgSeleccionado).remove().then(() => location.reload());
    }
    document.getElementById('msg-menu').style.display = 'none';
}

// Inicialización
window.onload = () => {
    db.ref("usuarios_registrados/" + idOtro).on("value", s => {
        if(s.val()) {
            document.getElementById('header-name').innerText = s.val().nombre || idOtro;
            document.getElementById('header-photo').src = s.val().foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        }
    });
    db.ref("chats_privados/" + salaId).on("child_added", s => dibujarBurbuja(s.val(), s.key));
    
    // Cargar emojis dinámicos
    const emojis = ["😀","😂","😍","👍","🔥","🙌","❤️","😎"];
    const panel = document.getElementById('emoji-panel');
    emojis.forEach(e => {
        const s = document.createElement('span'); s.className = 'text-2xl p-2 cursor-pointer'; s.innerText = e;
        s.onclick = () => { input.value += e; input.oninput(); };
        panel.appendChild(s);
    });
};

// Eventos de entrada
input.oninput = () => actionIcon.className = input.value.trim() ? "fas fa-paper-plane" : "fas fa-microphone";
document.getElementById('action-btn').onclick = () => {
    if(input.value.trim()) {
        sendData({ tipo: 'texto', mensaje: input.value });
        input.value = "";
        actionIcon.className = "fas fa-microphone";
    }
};
