<script>
    /* Lógica de Chat DNPlus - Versión Integrada */
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let chatActual = "";

    // 1. Configuración al entrar al chat
    window.onload = function() {
        chatActual = localStorage.getItem("chat_actual") || "Contacto";
        document.getElementById('chatNombre').innerText = chatActual;
        
        cargarHistorial();
        
        // Bajar el scroll automáticamente
        const container = document.getElementById('msgContainer');
        container.scrollTop = container.scrollHeight;

        // Activar el micrófono
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = (event) => { audioChunks.push(event.data); };
                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                        const reader = new FileReader();
                        reader.readAsDataURL(audioBlob); 
                        reader.onloadend = () => {
                            guardarMensaje(reader.result, 'audio'); 
                        };
                        audioChunks = [];
                    };
                }).catch(err => console.log("Permiso de micro denegado"));
        }
    };

    // 2. Cambiar icono de Micro a Enviar
    function toggleIcon() {
        const input = document.getElementById('chatInput');
        const btnIcon = document.getElementById('actionIcon');
        btnIcon.innerText = input.value.trim() !== "" ? "➤" : "🎙️";
    }

    // 3. Manejar el botón (Enviar texto o Grabar)
    function handleAction() {
        const input = document.getElementById('chatInput');
        const btnIcon = document.getElementById('actionIcon');

        if (input.value.trim() !== "") {
            guardarMensaje(input.value, 'text');
            input.value = "";
            toggleIcon();
        } else {
            if (!isRecording) {
                audioChunks = [];
                mediaRecorder.start();
                btnIcon.innerText = "🛑";
                btnIcon.style.color = "#ff5252";
                isRecording = true;
            } else {
                mediaRecorder.stop();
                btnIcon.innerText = "🎙️";
                btnIcon.style.color = "white";
                isRecording = false;
            }
        }
    }

    // 4. Guardar en memoria del teléfono
    function guardarMensaje(contenido, tipo) {
        const now = new Date();
        const time = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
        const nuevoMsg = { tipo, contenido, time, sender: 'me' };

        let historial = JSON.parse(localStorage.getItem("historial_" + chatActual)) || [];
        historial.push(nuevoMsg);
        localStorage.setItem("historial_" + chatActual, JSON.stringify(historial));
        
        renderMensaje(nuevoMsg);
    }

    // 5. Cargar mensajes viejos
    function cargarHistorial() {
        let historial = JSON.parse(localStorage.getItem("historial_" + chatActual)) || [];
        const container = document.getElementById('msgContainer');
        container.innerHTML = ""; 
        historial.forEach(m => renderMensaje(m));
    }

    // 6. Mostrar en la pantalla
    function renderMensaje(m) {
        const container = document.getElementById('msgContainer');
        const bubble = document.createElement('div');
        bubble.className = m.sender === 'me' ? 'bubble sent' : 'bubble received';
        
        if (m.tipo === 'text') {
            bubble.innerHTML = `${m.contenido} <div class="time">${m.time}</div>`;
        } else if (m.tipo === 'audio') {
            bubble.innerHTML = `
                <div class="audio-msg">
                    <audio controls style="width: 180px; height: 35px;">
                        <source src="${m.contenido}" type="audio/mp3">
                    </audio>
                </div>
                <div class="time">${m.time}</div>`;
        }
        
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }
</script>
