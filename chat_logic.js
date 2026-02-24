// chat_logic.js - Creado para David Oviedo
const db = firebase.database();
const miId = localStorage.getItem("user_temp_id");
const salaId = localStorage.getItem("chat_sala_id");
const destId = localStorage.getItem("chat_destinatario_id");

// 1. CARGAR MENSAJES CON CONTENEDORES FIJOS
db.ref("chats_privados/" + salaId).on("value", snap => {
    const box = document.getElementById('chat-box');
    box.innerHTML = "";
    snap.forEach(child => {
        const m = child.val();
        const esMio = m.emisor === miId;
        const hora = new Date(m.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        const div = document.createElement("div");
        div.className = `msg ${esMio ? 'msg-mio' : 'msg-otro'}`;

        if(m.tipo === "imagen") {
            div.innerHTML = `
                <div class="img-wrapper">
                    <img src="${m.contenido}" onclick="zoom('${m.contenido}')">
                </div>
                <span class="hora-msg">${hora}</span>`;
        } else if(m.tipo === "audio") {
            div.innerHTML = `
                <div class="audio-container">
                    <span class="play-icon" onclick="new Audio('${m.contenido}').play()">▶️</span>
                    <div style="flex:1; height:3px; background:#8696a0; border-radius:2px;"></div>
                    <span class="hora-msg">${hora}</span>
                </div>`;
        } else if(m.contenido === "❤️") {
            div.innerHTML = `<span style="font-size:50px; display:block; text-align:center;">❤️</span><span class="hora-msg">${hora}</span>`;
        } else {
            div.innerHTML = `<span>${m.contenido}</span><span class="hora-msg">${hora}</span>`;
        }
        box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
});

// 2. LÓGICA DE AUDIO
let recorder; let chunks = [];
function iniciarGrabacion() {
    if(document.getElementById('msg-input').value.length > 0) { enviarTexto(); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        recorder = new MediaRecorder(stream);
        recorder.start();
        chunks = [];
        document.getElementById('btn-main').style.background = "red";
        recorder.ondataavailable = e => chunks.push(e.data);
    });
}

function detenerGrabacion() {
    if(!recorder || recorder.state === "inactive") return;
    recorder.stop();
    document.getElementById('btn-main').style.background = "var(--verde)";
    recorder.onstop = () => {
        const reader = new FileReader();
        reader.readAsDataURL(new Blob(chunks, { type: 'audio/mp3' }));
        reader.onloadend = () => {
            db.ref("chats_privados/" + salaId).push({ emisor: miId, contenido: reader.result, tipo: "audio", fecha: Date.now() });
        };
    };
}

// 3. ENVÍO DE TEXTO E IMAGEN
function enviarTexto() {
    const input = document.getElementById('msg-input');
    if(input.value.trim() === "") return;
    db.ref("chats_privados/" + salaId).push({ emisor: miId, contenido: input.value, tipo: "texto", fecha: Date.now() });
    input.value = "";
    actualizarBoton();
}

function subirImagen(e) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        db.ref("chats_privados/" + salaId).push({ emisor: miId, contenido: ev.target.result, tipo: "imagen", fecha: Date.now() });
    };
    reader.readAsDataURL(e.target.files[0]);
}

// 4. FUNCIONES EXTRAS
function actualizarBoton() {
    document.getElementById('btn-main').innerText = document.getElementById('msg-input').value.length > 0 ? "🕊️" : "🎙️";
}

function cambiarFondo(color) {
    document.getElementById('chat-box').style.backgroundColor = color;
    localStorage.setItem("fondo_chat", color);
}

// Cargar fondo guardado
if(localStorage.getItem("fondo_chat")) document.getElementById('chat-box').style.backgroundColor = localStorage.getItem("fondo_chat");

function zoom(src) { document.getElementById('visor').style.display='flex'; document.getElementById('img-zoom').src=src; }
