// mensajes.js - EL MAESTRO FINAL POR DAVID OVIEDO
const firebaseConfig = {
    apiKey: "AIzaSyD2nZF5QC-Zti80xP1A518qbUPnhRru_9A",
    databaseURL: "https://dnplus-messenger-pro-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const miId = localStorage.getItem("user_phone") || "595992536184";
const idOtro = localStorage.getItem("chat_destinatario_id");
const salaId = localStorage.getItem("chat_sala_id");

let miFoto = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
let fotoOtro = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const input = document.getElementById('chat-input');
const actionBtn = document.getElementById('action-btn');
const actionIcon = document.getElementById('action-icon');
const chatContainer = document.getElementById('chat-container');

let mediaRecorder, audioChunks = [], isRecording = false;
let mensajeSeleccionado = null;
let touchTimer;

// --- 1. CARGA INICIAL Y PRESENCIA ---
window.onload = async () => {
    if(!idOtro || !salaId) return;

    // Obtener fotos de perfil para los audios
    db.ref("usuarios_registrados/" + miId).once("value", s => { if(s.val()?.foto) miFoto = s.val().foto; });
    db.ref("usuarios_registrados/" + idOtro).on("value", s => {
        const d = s.val();
        if(d) {
            fotoOtro = d.foto || fotoOtro;
            document.getElementById('header-name').innerText = d.nombre || idOtro;
            document.getElementById('header-photo').src = fotoOtro;
            const st = document.getElementById('header-status');
            st.innerText = d.estado || "offline";
            st.style.color = (d.estado === 'online' || d.estado === 'escribiendo...') ? '#00e676' : '#9ca3af';
        }
    });

    // Presencia
    const presRef = db.ref("usuarios_registrados/" + miId + "/estado");
    db.ref(".info/connected").on("value", s => {
        if(s.val()) { presRef.onDisconnect().set("offline"); presRef.set("online"); }
    });

    // Cargar mensajes
    db.ref("chats_privados/" + salaId).on("child_added", s => dibujarBurbuja(s.val(), s.key));
};

// --- 2. GRABACIÓN DE AUDIO ---
async function startRec() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;
        document.getElementById('rec-overlay').style.display = 'flex';
        db.ref("usuarios_registrados/" + miId + "/estado").set("grabando audio...");
        
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.start();
    } catch (e) { alert("Activa el micro, bro"); }
}

function stopRec() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('rec-overlay').style.display = 'none';
        db.ref("usuarios_registrados/" + miId + "/estado").set("online");
        
        mediaRecorder.onstop = () => {
            const reader = new FileReader();
            reader.readAsDataURL(new Blob(audioChunks, { type: 'audio/webm' }));
            reader.onloadend = () => enviarDatos({ tipo: 'audio', url: reader.result });
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
        };
    }
}

// --- 3. ENVÍO DE DATOS ---
function enviarDatos(data) {
    const ahora = new Date();
    const hora = ahora.getHours() + ":" + ahora.getMinutes().toString().padStart(2, '0');
    db.ref("chats_privados/" + salaId).push({ ...data, emisor: miId, hora: hora });
}

// Lógica de botones (Texto o Micrófono)
actionBtn.onclick = () => {
    if(input.value.trim()) {
        enviarDatos({ tipo: 'texto', mensaje: input.value });
        input.value = "";
        actualizarIcono();
    }
};

function actualizarIcono() {
    if(input.value.trim()) {
        actionIcon.className = "fas fa-paper-plane";
        db.ref("usuarios_registrados/" + miId + "/estado").set("escribiendo...");
    } else {
        actionIcon.className = "fas fa-microphone";
        db.ref("usuarios_registrados/" + miId + "/estado").set("online");
    }
}
input.oninput = actualizarIcono;

// Eventos de pulsación para audio
actionBtn.addEventListener('mousedown', () => { if(!input.value.trim()) startRec(); });
actionBtn.addEventListener('mouseup', stopRec);
actionBtn.addEventListener('touchstart', (e) => { if(!input.value.trim()) { e.preventDefault(); startRec(); }});
actionBtn.addEventListener('touchend', (e) => { if(isRecording) { e.preventDefault(); stopRec(); }});

// --- 4. DIBUJAR BURBUJAS (CON TU CSS MAESTRO) ---
function dibujarBurbuja(data, key) {
    if (document.getElementById(key)) return;
    const esMio = data.emisor === miId;
    const b = document.createElement('div');
    b.id = key;
    b.className = `bubble ${esMio ? 'bubble-mine' : 'bubble-theirs'}`;
    if(esMio) b.style.backgroundColor = "#176f47"; 

    // Pulsación larga para borrar
    b.onmousedown = () => { touchTimer = setTimeout(() => activarMenuBorrar(key), 800); };
    b.onmouseup = () => clearTimeout(touchTimer);
    b.ontouchstart = () => { touchTimer = setTimeout(() => activarMenuBorrar(key), 800); };
    b.ontouchend = () => clearTimeout(touchTimer);

    let html = "";
    if (data.tipo === 'audio') {
        html = `
            <div class="audio-wrapper">
                <div class="audio-photo-container">
                    <img src="${esMio ? miFoto : fotoOtro}" class="audio-user-photo">
                </div>
                <i class="fas fa-play cursor-pointer" style="color:#8696a0; font-size:1.4rem" onclick="reproducirAudio(this, '${data.url}')"></i>
                <div class="audio-info-container">
                    <div style="width:100%; height:3px; background:rgba(255,255,255,0.2); border-radius:5px; position:relative;">
                        <div class="p-bar" style="width:0%; height:100%; background:#34b7f1; border-radius:5px;"></div>
                    </div>
                    <span class="audio-time-text">Voz</span>
                </div>
            </div>`;
    } else if (data.tipo === 'imagen') {
        html = `<div class="img-frame"><img src="${data.url}" onclick="verImagen('${data.url}')"></div>`;
    } else {
        html = `<div>${data.mensaje}</div>`;
    }

    b.innerHTML = `${html}<span class="msg-time">${data.hora}</span>`;
    chatContainer.appendChild(b);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- 5. FUNCIONES DE UI (Borrar, Reproducir, Imagen) ---
function activarMenuBorrar(id) {
    mensajeSeleccionado = id;
    document.getElementById(id).style.filter = "brightness(0.7)";
    document.getElementById('action-header-menu').style.display = 'flex';
    if(navigator.vibrate) navigator.vibrate(50);
}

window.cerrarMenuAcciones = () => {
    if(mensajeSeleccionado) document.getElementById(mensajeSeleccionado).style.filter = "none";
    mensajeSeleccionado = null;
    document.getElementById('action-header-menu').style.display = 'none';
};

window.borrarMensaje = () => {
    if(mensajeSeleccionado && confirm("¿Borrar mensaje?")) {
        db.ref("chats_privados/" + salaId + "/" + mensajeSeleccionado).remove();
        document.getElementById(mensajeSeleccionado).remove();
        cerrarMenuAcciones();
    }
};

window.reproducirAudio = (el, url) => {
    const a = new Audio(url);
    const bar = el.parentElement.querySelector('.p-bar');
    el.className = "fas fa-pause";
    a.play();
    a.ontimeupdate = () => { if(bar) bar.style.width = (a.currentTime/a.duration)*100 + "%"; };
    a.onended = () => { el.className = "fas fa-play"; if(bar) bar.style.width = "0%"; };
};

window.verImagen = (u) => { document.getElementById('full-image').src = u; document.getElementById('image-viewer').style.display = 'flex'; };
window.cerrarVisor = () => document.getElementById('image-viewer').style.display = 'none';

window.toggleEmojis = () => {
    const p = document.getElementById('emoji-picker-container');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
};

window.toggleHeaderMenu = () => {
    const m = document.getElementById('header-menu');
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
};


// Función para mostrar/ocultar emojis
function toggleEmojis() {
    const panel = document.getElementById("emoji-panel");
    if (panel.style.display === "none") {
        panel.style.display = "grid";
        panel.innerHTML = ""; // Limpiar
        const emojis = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾"];
        
        emojis.forEach(emoji => {
            const span = document.createElement("span");
            span.innerText = emoji;
            span.style.cursor = "pointer";
            span.style.fontSize = "24px";
            span.onclick = () => {
                document.getElementById("chat-input").value += emoji;
            };
            panel.appendChild(span);
        });
    } else {
        panel.style.display = "none";
    }
}

async function manejarAdjunto(input) {
    const file = input.files[0];
    if (!file) return;

    const storageRef = firebase.storage().ref("chats/" + Date.now() + "_" + file.name);
    
    // 1. Subir imagen
    const snapshot = await storageRef.put(file);
    const urlImagen = await snapshot.ref.getDownloadURL();

    // 2. Enviar como mensaje
    const miId = localStorage.getItem("user_phone");
    const idAmigo = typeof idReceptor !== 'undefined' ? idReceptor : '';

    db.ref("chats").push({
        emisor: miId,
        receptor: idAmigo,
        mensaje: "📷 Imagen",
        imagenUrl: urlImagen,
        timestamp: Date.now()
    });

    // 3. Avisar al otro por notificación
    enviarAvisoDN(idAmigo, "DNPlus", "📷 Te envió una imagen");
}
