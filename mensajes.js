// mensajes.js - Versión Final DNPlus Pro - CORREGIDA para David Oviedo
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

    // 2. Cargar datos del DESTINATARIO
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
};

// --- DIBUJAR MENSAJES ---
function dibujarBurbuja(data, key) {
    if (document.getElementById(key)) return;

    const esMio = data.emisor === miId;
    const b = document.createElement('div');
    b.id = key;
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    
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
        // CORRECCIÓN: Se añadió img-frame para que sea consistente con el visor
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

// --- VISOR DE IMÁGENES ---
function verImagen(url) {
    const v = document.getElementById('image-viewer');
    const img = document.getElementById('full-image');
    if(v && img) {
        img.src = url;
        v.style.display = 'flex';
    }
}

function cerrarVisor() {
    const v = document.getElementById('image-viewer');
    if(v) v.style.display = 'none';
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
        const overlay = document.getElementById('rec-overlay');
        if(overlay) overlay.style.display = 'flex';
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.start();
    } catch (err) { alert("Activa el permiso de micrófono, bro."); }
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
            reader.onloadend = () => sendData({ tipo: 'audio', url: reader.result });
        };
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
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
}

// Botón de acción (Enviar / Grabar)
actionBtn.onclick = () => {
    if(input.value.trim()) {
        sendData({ tipo: 'texto', mensaje: input.value });
        input.value = "";
        actualizarIcono();
        // Cerrar emojis si están abiertos al enviar
        const emoContainer = document.getElementById('emoji-picker-container');
        if(emoContainer) emoContainer.style.display = 'none';
    }
};

actionBtn.onmousedown = actionBtn.ontouchstart = (e) => {
    if(!input.value.trim()) {
        e.preventDefault();
        startRec();
    }
};
actionBtn.onmouseup = actionBtn.ontouchend = () => {
    if(isRecording) stopRec();
};

// --- ESTA FUNCIÓN ES LA QUE HACÍA FALTA PARA LOS EMOJIS ---
function actualizarIcono() {
    if(input.value.trim()) {
        actionIcon.className = "fas fa-paper-plane";
    } else {
        actionIcon.className = "fas fa-microphone";
    }
}
input.oninput = actualizarIcono;

// --- ADJUNTOS ---
function manejarAdjunto(el) {
    const file = el.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => sendData({ tipo: 'imagen', url: e.target.result });
        reader.readAsDataURL(file);
    }
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
    if(!e.target.closest('.input-area') && !e.target.closest('#emoji-picker-container')) {
        const ep = document.getElementById('emoji-picker-container');
        if(ep) ep.style.display = 'none';
    }
    if(!e.target.closest('.bubble') && !e.target.closest('#action-header-menu')) cerrarMenuAcciones();
});


// --- NUEVO: SISTEMA DE PRESENCIA Y ESTADOS ---

// 1. Detectar si ESTOY EN LÍNEA
const presenciRef = db.ref("usuarios_registrados/" + miId + "/estado");
const ultimaVezRef = db.ref("usuarios_registrados/" + miId + "/ultimaVez");

// Cuando me conecto a Firebase
db.ref(".info/connected").on("value", (snapshot) => {
    if (snapshot.val() === true) {
        // Si me desconecto (cierro la app), Firebase pone "offline" y la hora automáticamente
        presenciRef.onDisconnect().set("offline");
        ultimaVezRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
        
        // Mientras estoy dentro, estoy "online"
        presenciRef.set("online");
    }
});

// 2. MOSTRAR ESTADO DEL OTRO (En el Header)
db.ref("usuarios_registrados/" + idOtro).on("value", s => {
    const d = s.val();
    const statusEl = document.getElementById('header-status');
    if(d && statusEl) {
        if(d.estado === 'escribiendo...') {
            statusEl.innerText = "escribiendo...";
            statusEl.className = "text-[10px] text-green-400 italic";
        } else if(d.estado === 'grabando audio...') {
            statusEl.innerText = "grabando audio...";
            statusEl.className = "text-[10px] text-red-400 italic";
        } else if(d.estado === 'online') {
            statusEl.innerText = "en línea";
            statusEl.className = "text-[10px] text-green-400";
        } else {
            // Calcular última vez
            const fecha = new Date(d.ultimaVez);
            const hora = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            statusEl.innerText = "últ. vez hoy a las " + hora;
            statusEl.className = "text-[10px] text-gray-400";
        }
    }
});

// 3. DETECTAR CUANDO ESCRIBO O GRABO
input.oninput = () => {
    actualizarIcono(); // Tu función actual
    if(input.value.length > 0) {
        presenciRef.set("escribiendo...");
    } else {
        presenciRef.set("online");
    }
};

// Modifica tus funciones de Audio existentes para que activen el estado
async function startRec() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // ... (tu código de grabación actual) ...
        presenciRef.set("grabando audio..."); // <--- AGREGAR ESTO
    } catch (err) { alert("Permiso denegado"); }
}

function stopRec() {
    // ... (tu código de stop actual) ...
    presenciRef.set("online"); // <--- AGREGAR ESTO
}


// Configuración de Emojis
        const pickerOptions = { 
            onEmojiSelect: (emoji) => {
                const input = document.getElementById("chat-input");
                input.value += emoji.native;
                input.focus();
                if(typeof actualizarIcono === 'function') actualizarIcono();
            },
            theme: "dark", locale: "es"
        };
        const picker = new EmojiMart.Picker(pickerOptions);
        document.getElementById("emoji-picker-container").appendChild(picker);

        function toggleEmojis() {
            const container = document.getElementById("emoji-picker-container");
            container.style.display = (container.style.display === "none" || container.style.display === "") ? "block" : "none";
        }

        // Función para mostrar/ocultar menú de 3 puntos
        function toggleHeaderMenu() {
            const menu = document.getElementById("header-menu");
            menu.style.display = (menu.style.display === "none" || menu.style.display === "") ? "flex" : "none";
        }

        // Cerrar menús al hacer clic fuera
        document.addEventListener("click", (e) => {
            const menu = document.getElementById("header-menu");
            const btn = document.querySelector(".fa-ellipsis-v");
            if (menu && menu.style.display === "flex" && !menu.contains(e.target) && e.target !== btn) {
                menu.style.display = "none";
            }
        });

        // Funciones auxiliares para el menú
        function cambiarFondo() {
            document.getElementById('bg-input').click();
            toggleHeaderMenu();
        }

        function aplicarNuevoFondo(input) {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const salaId = localStorage.getItem("chat_sala_id");
                    document.getElementById('chat-container').style.backgroundImage = `url('${e.target.result}')`;
                    document.getElementById('chat-container').style.backgroundSize = "cover";
                    localStorage.setItem("chat_bg_" + salaId, e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }

        function vaciarChat() {
            if(confirm("¿Vaciar todos los mensajes?")) {
                const salaId = localStorage.getItem("chat_sala_id");
                firebase.database().ref("chats_privados/" + salaId).remove();
                toggleHeaderMenu();
            }
        }
