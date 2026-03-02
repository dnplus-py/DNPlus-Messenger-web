// button_audio.js - REPARADO PARA SONIDO REAL
let mediaRecorder, audioChunks = [], isRecording = false;

// Función para iniciar grabación
async function startRec() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Usamos audio/webm;codecs=opus que es el más compatible
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;

        if(document.getElementById('rec-overlay')) document.getElementById('rec-overlay').style.display = 'flex';
        
        // Avisamos a Firebase que David está grabando
        if(typeof presenciRef !== 'undefined') presenciRef.set("grabando audio...");

        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.start();
        console.log("Grabando...");
    } catch (err) {
        console.error("Error al acceder al mic:", err);
        alert("No se pudo activar el micrófono.");
    }
}

// Función para detener y enviar
function stopRec() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        if(document.getElementById('rec-overlay')) document.getElementById('rec-overlay').style.display = 'none';
        if(typeof presenciRef !== 'undefined') presenciRef.set("online");

        mediaRecorder.onstop = () => {
            // Creamos el Blob con los trozos de audio capturados
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Verificamos si hay sonido antes de enviar
            if (audioBlob.size > 1000) { 
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64data = reader.result;
                    // Enviamos a la función global de mensajes.js
                    if(typeof sendData === 'function') {
                        sendData({ tipo: 'audio', url: base64data });
                    }
                };
            } else {
                console.warn("Audio demasiado corto o vacío.");
            }

            // Liberamos el micrófono
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        };
    }
}

// EVENTOS DE BOTÓN (Soporte total David Oviedo Edition)
const btnAccion = document.getElementById('action-btn');
const inputMsj = document.getElementById('chat-input');

if(btnAccion) {
    // Para PC
    btnAccion.addEventListener('mousedown', (e) => {
        if(!inputMsj.value.trim()) startRec();
    });
    btnAccion.addEventListener('mouseup', () => {
        if(isRecording) stopRec();
    });

    // Para Celular (Touch)
    btnAccion.addEventListener('touchstart', (e) => {
        if(!inputMsj.value.trim()) {
            e.preventDefault();
            startRec();
        }
    });
    btnAccion.addEventListener('touchend', (e) => {
        if(isRecording) {
            e.preventDefault();
            stopRec();
        }
    });
}
