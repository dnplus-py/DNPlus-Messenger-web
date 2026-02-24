<script>
// chat-logic.js - Lógica Pro para David Oviedo
const db = firebase.database();
const miId = localStorage.getItem("user_temp_id");
const salaId = localStorage.getItem("chat_sala_id");
const destId = localStorage.getItem("chat_destinatario_id");

// --- 1. CARGAR MENSAJES CON TAMAÑO DE IMAGEN FIJO ---
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
            // Aquí aplicamos el contenedor de 230dp x 180dp
            div.innerHTML = `
                <div style="width:230px; height:180px; overflow:hidden; border-radius:10px;">
                    <img src="${m.contenido}" style="width:100%; height:100%; object-fit:cover;" onclick="abrirVisor('${m.contenido}')">
                </div>
                <span class="hora-msg">${hora}</span>`;
        } else if(m.tipo === "audio") {
            div.innerHTML = `
                <div style="width:255px; height:60px; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:30px; cursor:pointer;" onclick="new Audio('${m.contenido}').play()">▶️</span>
                    <div style="flex:1; height:3px; background:#8696a0; border-radius:2px;"></div>
                    <span class="hora-msg">${hora}</span>
                </div>`;
        } else {
            div.innerHTML = `<span>${m.contenido}</span><span class="hora-msg">${hora}</span>`;
        }
        box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
});

// --- 2. LÓGICA DE AUDIO (GRABAR Y ENVIAR) ---
let recorder; let chunks = [];
const btn = document.getElementById('btn-main');

function iniciarGrabacion() {
    if(document.getElementById('msg-input').value.length > 0) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        recorder = new MediaRecorder(stream);
        recorder.start();
        chunks = [];
        btn.style.backgroundColor = "red";
        recorder.ondataavailable = e => chunks.push(e.data);
    });
}

function detenerGrabacion() {
    if(!recorder || recorder.state === "inactive") return;
    recorder.stop();
    btn.style.backgroundColor = "#00a884";
    recorder.onstop = () => {
        const reader = new FileReader();
        reader.readAsDataURL(new Blob(chunks, { type: 'audio/mp3' }));
        reader.onloadend = () => {
            db.ref("chats_privados/" + salaId).push({ emisor: miId, contenido: reader.result, tipo: "audio", fecha: Date.now() });
        };
    };
}

// --- 3. CAMBIO DE FONDO ---
function cambiarFondo(color) {
    document.getElementById('chat-box').style.backgroundColor = color;
    localStorage.setItem("fondo_chat", color);
}

// Cargar fondo al iniciar
if(localStorage.getItem("fondo_chat")) {
    document.getElementById('chat-box').style.backgroundColor = localStorage.getItem("fondo_chat");
}

function abrirVisor(src) {
    const v = document.getElementById('visor');
    v.style.display = 'flex';
    document.getElementById('img-zoom').src = src;
}
</script>
