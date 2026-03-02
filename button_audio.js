// --- 1. VARIABLES GLOBALES DE AUDIO ---
let mediaRecorder, audioChunks = [], isRecording = false;

// --- 2. LÓGICA DE GRABACIÓN (Micrófono) ---
function startRec() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;
        
        // Mostrar overlay y avisar que estás grabando
        if(document.getElementById('rec-overlay')) document.getElementById('rec-overlay').style.display = 'flex';
        presenciRef.set("grabando audio..."); 
        
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.start();
    }).catch(err => alert("Error: No se pudo acceder al micrófono."));
}

function stopRec() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        if(document.getElementById('rec-overlay')) document.getElementById('rec-overlay').style.display = 'none';
        presenciRef.set("online");
        
        mediaRecorder.onstop = () => {
            const reader = new FileReader();
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                // Función que envía los datos a Firebase
                sendData({ tipo: 'audio', url: reader.result });
            };
            // Apagar el hardware del micrófono
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        };
    }
}

// --- 3. EVENTOS PARA EL BOTÓN (Soporte PC y Celular) ---
// Mouse (PC)
actionBtn.addEventListener('mousedown', () => { if(!input.value.trim()) startRec(); });
actionBtn.addEventListener('mouseup', () => { if(isRecording) stopRec(); });

// Touch (Celular - IMPORTANTE)
actionBtn.addEventListener('touchstart', (e) => { 
    if(!input.value.trim()) {
        e.preventDefault(); 
        startRec(); 
    }
});
actionBtn.addEventListener('touchend', (e) => { 
    if(isRecording) {
        e.preventDefault(); 
        stopRec(); 
    }
});

// --- 4. RENDERIZADO DE LA BURBUJA DE AUDIO ---
// (Poner esto dentro de tu función dibujarBurbuja)
/* if (data.tipo === 'audio') {
    contenido = `
        <div class="audio-player-wrapper" style="display:flex; align-items:center; gap:12px; min-width:160px; padding:5px;">
            <div style="position:relative;">
                <img src="${esMio ? miFotoGlobal : fotoOtroGlobal}" style="width:35px; height:35px; border-radius:50%; object-fit:cover;">
                <i class="fas fa-microphone" style="position:absolute; bottom:-2px; right:-2px; font-size:10px; color:#34b7f1; background:#202c33; border-radius:50%; padding:2px;"></i>
            </div>
            <button onclick="reproducirAudio('${data.url}', this)" style="background:transparent; border:none; color:white; cursor:pointer;">
                <i class="fas fa-play" style="font-size:20px;"></i>
            </button>
            <div style="flex:1; height:3px; background:rgba(255,255,255,0.2); border-radius:10px; position:relative;">
                <div class="progress-bar" style="width:0%; height:100%; background:#34b7f1; border-radius:10px;"></div>
            </div>
        </div>`;
}
*/

// --- 5. FUNCIÓN PARA REPRODUCIR CON BARRA DE PROGRESO ---
function reproducirAudio(url, btn) {
    const audio = new Audio(url);
    const icono = btn.querySelector('i');
    const progressBar = btn.parentElement.querySelector('.progress-bar');
    
    // Cambiar a pausa y reproducir
    icono.className = "fas fa-pause";
    audio.play();

    // Mover la barrita azul
    audio.ontimeupdate = () => {
        const porcentaje = (audio.currentTime / audio.duration) * 100;
        if(progressBar) progressBar.style.width = porcentaje + "%";
    };

    // Al terminar, volver al icono de play
    audio.onended = () => {
        icono.className = "fas fa-play";
        if(progressBar) progressBar.style.width = "0%";
    };
}
