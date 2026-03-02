// mensajes.js - Versión DNPlus SIN AUDIO (Manejado externamente)
console.log("✅ DNPlus Messenger: Cargando sistema...");

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

let fotoOtroGlobal = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 
let miFotoGlobal = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 

// Referencias de Presencia
const presenciRef = db.ref("usuarios_registrados/" + miId + "/estado");
const ultimaVezRef = db.ref("usuarios_registrados/" + miId + "/ultimaVez");

// --- INICIO DEL SISTEMA ---
window.onload = () => {
    if(!idOtro || !salaId) return;

    // Cargar mi foto
    db.ref("usuarios_registrados/" + miId).on("value", s => {
        const d = s.val();
        if(d && d.foto) miFotoGlobal = d.foto;
    });

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
            fotoOtroGlobal = d.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            document.getElementById('header-name').innerText = d.nombre || idOtro;
            document.getElementById('header-photo').src = fotoOtroGlobal;
            
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

    // Inicializar Emojis
    const pickerOptions = { 
        onEmojiSelect: (emoji) => {
            input.value += emoji.native;
            input.focus();
            actualizarIcono();
        },
        theme: "dark", locale: "es"
    };
    if (window.EmojiMart) {
        const picker = new EmojiMart.Picker(pickerOptions);
        const container = document.getElementById("emoji-picker-container");
        if(container) container.appendChild(picker);
    }

    // Cargar fondo guardado
    const bgSaved = localStorage.getItem("chat_bg_" + salaId);
    if(bgSaved) {
        chatContainer.style.backgroundImage = `url('${bgSaved}')`;
        chatContainer.style.backgroundSize = "cover";
        chatContainer.style.backgroundPosition = "center";
    }
};

// --- LÓGICA DE ENVÍO ---
function sendData(p) {
    const ahora = new Date();
    const hora = ahora.getHours() + ":" + ahora.getMinutes().toString().padStart(2, '0');
    db.ref("chats_privados/" + salaId).push({ ...p, emisor: miId, hora: hora });
}

actionBtn.onclick = () => {
    if(input.value.trim()) {
        sendData({ tipo: 'texto', mensaje: input.value });
        input.value = "";
        actualizarIcono();
        document.getElementById("emoji-picker-container").style.display = "none";
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
    
    // Color personalizado David Oviedo (Favorito: #176f47)
    if(esMio) b.style.backgroundColor = "#176f47";

    let contenido = "";
    if (data.tipo === 'audio') {
        contenido = `
            <div style="display:flex; align-items:center; gap:10px; min-width:150px;">
                <i class="fas fa-play cursor-pointer" onclick="reproducirAudio('${data.url}', this)"></i>
                <div style="flex:1; height:3px; background:rgba(255,255,255,0.2); border-radius:5px;">
                    <div class="progress-bar" style="width:0%; height:100%; background:#34b7f1;"></div>
                </div>
                <span style="font-size:11px;">Audio</span>
            </div>`;
    } else if (data.tipo === 'imagen') {
        contenido = `<img src="${data.url}" onclick="verImagen('${data.url}')" style="border-radius:10px; max-width:220px; cursor:pointer;">`;
    } else {
        contenido = `<div class="text-content">${data.mensaje}</div>`;
    }
    
    b.innerHTML = `${contenido}<span style="font-size:9px; opacity:0.6; display:block; text-align:right; margin-top:4px;">${data.hora}</span>`;
    chatContainer.appendChild(b);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Función para reproducir audios recibidos
function reproducirAudio(url, btn) {
    const audio = new Audio(url);
    const icono = btn;
    icono.className = "fas fa-pause cursor-pointer";
    audio.play();
    audio.onended = () => icono.className = "fas fa-play cursor-pointer";
}

// --- FUNCIONES DE INTERFAZ ---
function toggleEmojis() {
    const c = document.getElementById("emoji-picker-container");
    c.style.display = (c.style.display === "none" || c.style.display === "") ? "block" : "none";
}

function toggleHeaderMenu() {
    const m = document.getElementById("header-menu");
    m.style.display = (m.style.display === "none" || m.style.display === "") ? "flex" : "none";
}

function cambiarFondo() { document.getElementById('bg-input').click(); toggleHeaderMenu(); }

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

function vaciarChat() {
    if(confirm("¿Deseas vaciar el chat?")) {
        db.ref("chats_privados/" + salaId).remove();
        chatContainer.innerHTML = "";
        toggleHeaderMenu();
    }
}

function verImagen(url) {
    document.getElementById('full-image').src = url;
    document.getElementById('image-viewer').style.display = 'flex';
}

function cerrarVisor() { document.getElementById('image-viewer').style.display = 'none'; }

function manejarAdjunto(el) {
    const file = el.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => sendData({ tipo: 'imagen', url: e.target.result });
        reader.readAsDataURL(file);
    }
}

function abrirPerfilContacto() {
    alert("Perfil de: " + document.getElementById('header-name').innerText);
}

// Cerrar menús al tocar el chat
document.addEventListener("click", (e) => {
    const menu = document.getElementById("header-menu");
    if (menu && menu.style.display === "flex" && !menu.contains(e.target) && !e.target.classList.contains('fa-ellipsis-v')) {
        menu.style.display = "none";
    }
});
