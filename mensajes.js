// mensajes.js - Versión Final DNPlus para David Oviedo (Corregida)
console.log("✅ DNPlus Messenger: Sistema Activado");

const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};
// Asegurar inicialización segura de Firebase
if (!firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (error) {
        console.error("❌ Error al inicializar Firebase:", error);
    }
}
const db = firebase.database();

const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");
// Elementos del DOM con comprobación
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
    // Validar elementos necesarios antes de continuar
    if (!idOtro || !salaId || !input || !actionIcon || !chatContainer) {
        console.warn("⚠️ Faltan datos o elementos del DOM para cargar el chat");
        return;
    }

    // Cargar datos del destinatario
    db.ref("usuarios_registrados/" + idOtro).on("value", (snapshot) => {
        const datosUsuario = snapshot.val();
        if (datosUsuario) {
            const headerName = document.getElementById('header-name');
            const headerPhoto = document.getElementById('header-photo');
            if (headerName) headerName.innerText = datosUsuario.nombre || idOtro;
            if (headerPhoto) headerPhoto.src = datosUsuario.foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        }
    });

    // Escuchar nuevos mensajes
    db.ref("chats_privados/" + salaId).on("child_added", (snapshot) => {
        dibujarBurbuja(snapshot.val(), snapshot.key);
    });

    // Escuchar mensajes eliminados
    db.ref("chats_privados/" + salaId).on("child_removed", (snapshot) => {
        const elementoMensaje = document.getElementById(snapshot.key);
        if (elementoMensaje) elementoMensaje.remove();
    });

    // Cargar fondo guardado
    const bgSaved = localStorage.getItem("chat_bg_" + salaId);
    if (bgSaved) {
        chatContainer.style.backgroundImage = `url('${bgSaved}')`;
        chatContainer.style.backgroundSize = "cover";
    }

    cargarEmojis();
};

function dibujarBurbuja(data, key) {
    if (!data || !key) return;
    const esMio = data.emisor === miId;
    const burbuja = document.createElement('div');
    burbuja.id = key;
    burbuja.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
    // Manejo de menú de acciones
    burbuja.oncontextmenu = (e) => { 
        e.preventDefault(); 
        showMsgMenu(key); 
    };

    // Contenido según tipo de mensaje
    switch(data.tipo) {
        case 'audio':
            burbuja.innerHTML = `
            <div class="audio-wrapper">
                <i class="fas fa-play text-2xl cursor-pointer" onclick="reproducirAudio('${data.url}', this)"></i>
                <div class="flex-1">
                    <div class="h-[4px] bg-gray-600 w-full rounded-full"><div class="h-full bg-white w-0 rounded-full"></div></div>
                    <div class="text-[10px] mt-1">Voz (${data.duracion || '0:00'})</div>
                </div>
            </div>
            <span class="msg-time">${data.hora || 'Hora no disponible'}</span>`;
            break;
        case 'imagen':
            burbuja.innerHTML = `
            <div class="img-frame" onclick="verImagen('${data.url}')">
                <img src="${data.url}" alt="Imagen del chat">
            </div>
            <span class="msg-time">${data.hora || 'Hora no disponible'}</span>`;
            break;
        case 'texto':
        default:
            burbuja.innerHTML = `<div class="text-content">${data.mensaje || ''}</div><span class="msg-time">${data.hora || 'Hora no disponible'}</span>`;
            break;
    }

    chatContainer.appendChild(burbuja);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- FUNCIONES DE AUDIO ---
function reproducirAudio(url, icono) {
    if (!url || !icono) return;
    if (audioActual && !audioActual.paused) {
        audioActual.pause();
        if (iconoActual) iconoActual.className = "fas fa-play text-2xl";
        if (audioActual.src === url) return;
    }
    audioActual = new Audio(url);
    iconoActual = icono;
    icono.className = "fas fa-pause text-2xl";
    audioActual.play().catch((err) => {
        console.error("❌ Error al reproducir audio:", err);
        icono.className = "fas fa-play text-2xl";
    });
    audioActual.onended = () => {
        if (iconoActual) iconoActual.className = "fas fa-play text-2xl";
    };
}

async function startRec() {
    if (isRecording) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;
        if (recOverlay) recOverlay.style.display = 'flex';
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.start();
    } catch (err) { 
        console.error("❌ Error al iniciar grabación:", err);
        alert("Permiso de micrófono denegado o error en el dispositivo"); 
    }
}

function stopRec() {
    if (!mediaRecorder || !isRecording) return;
    mediaRecorder.stop();
    isRecording = false;
    if (recOverlay) recOverlay.style.display = 'none';
    mediaRecorder.onstop = () => {
        const reader = new FileReader();
        reader.readAsDataURL(new Blob(audioChunks, { type: 'audio/webm' })); // Formato más compatible que MP3
        reader.onloadend = () => {
            sendData({ tipo: 'audio', url: reader.result, duracion: "Voz" });
        };
    };
    // Detener stream de micrófono
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
}

// --- FUNCIONES DE VISOR DE IMAGEN ---
function verImagen(url) {
    if (!url || !imageViewer || !fullImage) return;
    fullImage.src = url;
    fullImage.alt = "Vista previa de imagen";
    currentZoom = 1;
    fullImage.style.transform = `scale(${currentZoom})`;
    imageViewer.style.display = 'flex';
}

function zoomImg(scale) {
    if (!fullImage) return;
    currentZoom *= scale;
    // Limitar zoom entre 0.5 y 3 para evitar problemas
    currentZoom = Math.min(Math.max(currentZoom, 0.5), 3);
    fullImage.style.transform = `scale(${currentZoom})`;
}

function cerrarVisor() {
    if (imageViewer) imageViewer.style.display = 'none';
}

// --- FUNCIONES DE MENÚ DE ACCIONES ---
function showMsgMenu(key) {
    if (!key || !actionHeaderMenu) return;
    msgSeleccionado = key;
    // Resaltar mensaje seleccionado
    document.querySelectorAll('.bubble').forEach(el => el.style.filter = "none");
    const mensajeSeleccionado = document.getElementById(key);
    if (mensajeSeleccionado) mensajeSeleccionado.style.filter = "brightness(0.8)";
    actionHeaderMenu.style.display = 'flex';
}

function cerrarMenuAcciones() {
    if (msgSeleccionado) {
        const mensajeSeleccionado = document.getElementById(msgSeleccionado);
        if (mensajeSeleccionado) mensajeSeleccionado.style.filter = "none";
        msgSeleccionado = null;
    }
    if (actionHeaderMenu) actionHeaderMenu.style.display = 'none';
}

function borrarMensaje() {
    if (!msgSeleccionado) return;
    db.ref("chats_privados/" + salaId + "/" + msgSeleccionado).remove()
        .catch((err) => console.error("❌ Error al borrar mensaje:", err));
    cerrarMenuAcciones();
}

function vaciarChat() {
    if (confirm("¿Vaciar todos los mensajes? Esta acción no se puede deshacer")) {
        db.ref("chats_privados/" + salaId).remove()
            .catch((err) => console.error("❌ Error al vaciar chat:", err));
        toggleHeaderMenu();
    }
}

// --- FUNCIONES DE EMOJIS ---
function toggleEmojis() {
    if (!emojiPanel) return;
    emojiPanel.style.display = emojiPanel.style.display === 'grid' ? 'none' : 'grid';
}

function cargarEmojis() {
    if (!emojiPanel) return;
    const packEmojis = {
        "Caritas": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","😍","🥰","😘","😋","😎","🤩","🥳","😏","😢","😭","😡","🥺"],
        "Gestos": ["👋","👍","👎","👊","🤞","🤟","🤘","👏","🙌","👐","🤲","🙏","🤝"],
        "Corazones": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❣️","💕","💞"],
        "Banderas": ["🇵🇾","🇦🇷","🇧🇷","🇺🇾","🇨🇱","🇧🇴","🇨🇴","🇲🇽","🇪🇸","🇺🇸"]
    };
    emojiPanel.innerHTML = "";
    for (const [categoria, listaEmojis] of Object.entries(packEmojis)) {
        const tituloCategoria = document.createElement('div');
        tituloCategoria.className = 'emoji-category-title';
        tituloCategoria.innerText = categoria;
        emojiPanel.appendChild(tituloCategoria);
        listaEmojis.forEach(emoji => {
            const botonEmoji = document.createElement('span');
            botonEmoji.className = 'text-2xl p-2 cursor-pointer text-center';
            botonEmoji.innerText = emoji;
            botonEmoji.onclick = () => {
                if (input) {
                    input.value += emoji;
                    input.focus();
                    input.oninput();
                }
            };
            emojiPanel.appendChild(botonEmoji);
        });
    }
}

// --- OTROS FUNCIONES ---
function toggleHeaderMenu() {
    if (!headerMenu) return;
    headerMenu.style.display = headerMenu.style.display === 'flex' ? 'none' : 'flex';
}

function cambiarFondo() {
    if (bgInput) bgInput.click();
}

function aplicarNuevoFondo(el) {
    if (!el || !el.files || !el.files[0]) return;
    const archivo = el.files[0];
    // Validar que sea un archivo de imagen
    if (!archivo.type.startsWith('image/')) {
        alert("Por favor selecciona un archivo de imagen válido");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        if (chatContainer) {
            chatContainer.style.backgroundImage = `url('${e.target.result}')`;
            chatContainer.style.backgroundSize = "cover";
            localStorage.setItem("chat_bg_" + salaId, e.target.result);
        }
    };
    reader.readAsDataURL(archivo);
    toggleHeaderMenu();
}

function manejarAdjunto(el) {
    if (!el || !el.files || !el.files[0]) return;
    const archivo = el.files[0];
    if (!archivo.type.startsWith('image/')) {
        alert("Por el momento solo se admiten imágenes como adjuntos");
        return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = (e) => sendData({ tipo: 'imagen', url: e.target.result });
}

function sendData(payload) {
    if (!payload || !salaId) return;
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    db.ref("chats_privados/" + salaId).push({ 
        ...payload, 
        emisor: miId, 
        hora: horaActual 
    }).catch((err) => console.error("❌ Error al enviar mensaje:", err));
}

// --- EVENTOS PRINCIPALES ---
if (input) {
    input.oninput = () => {
        actionIcon.className = input.value.trim() ? "fas fa-paper-plane" : "fas fa-microphone";
    };
}

const btnAccion = document.getElementById('action-btn');
if (btnAccion) {
    btnAccion.onclick = () => {
        if (input && input.value.trim()) {
            sendData({ tipo: 'texto', mensaje: input.value });
            input.value = "";
            input.oninput();
        }
    };

    btnAccion.onmousedown = btnAccion.ontouchstart = (e) => {
        e.preventDefault(); // Evitar comportamiento por defecto
        if (input && !input.value.trim()) startRec();
    };

    btnAccion.onmouseup = btnAccion.ontouchend = () => {
        if (isRecording) stopRec();
    };

    // Manejar caso en que el usuario se salga del botón mientras graba
    btnAccion.onmouseleave = btnAccion.ontouchcancel = () => {
        if (isRecording) stopRec();
    };
}

// Cerrar paneles al hacer clic fuera
document.addEventListener('click', (e) => {
    if (emojiPanel && !e.target.closest('.input-area') && !e.target.closest('#emoji-panel')) {
        emojiPanel.style.display = 'none';
    }
    if (!e.target.closest('.bubble') && !e.target.closest('#action-header-menu')) {
        cerrarMenuAcciones();
    }
    if (headerMenu && !e.target.closest('.relative')) {
        headerMenu.style.display = 'none';
    }
});

// Manejar cierre de visor con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cerrarVisor();
        cerrarMenuAcciones();
        if (emojiPanel) emojiPanel.style.display = 'none';
        if (headerMenu) headerMenu.style.display = 'none';
    }
});
