<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>DNPlus Messenger</title>
    
    <link rel="stylesheet" href="https://dnplus-py.github.io/DNPlus-Messenger-web/mensajes.css">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-database-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js"></script>

    <style>
        #emoji-panel {
            display: none;
            position: absolute;
            bottom: 70px;
            left: 10px;
            width: 280px;
            height: 200px;
            background: #232d36;
            grid-template-columns: repeat(6, 1fr);
            overflow-y: auto;
            padding: 10px;
            border-radius: 12px;
            z-index: 1000;
            box-shadow: 0 -2px 15px rgba(0,0,0,0.5);
        }
        #emoji-panel span { cursor: pointer; font-size: 22px; padding: 5px; text-align: center; }
        .img-msg { max-width: 200px; border-radius: 8px; margin-top: 5px; cursor: pointer; }
    </style>
</head>
<body style="background-color: #0b141a; height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

    <header style="height: 62px; background: #202c33; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; color: white;">
        <div class="flex items-center gap-2">
            <i class="fas fa-arrow-left p-2 cursor-pointer" onclick="history.back()"></i>
            <img id="header-photo" src="https://cdn-icons-png.flaticon.com/512/149/149071.png" class="w-10 h-10 rounded-full object-cover">
            <div>
                <div id="header-name" class="font-bold text-sm">Cargando...</div>
                <div id="header-status" class="text-[10px] text-green-400">en línea</div>
            </div>
        </div>
        <div class="flex gap-3 relative">
            <i class="fas fa-phone p-2 cursor-pointer" onclick="irALlamada()"></i>
            <i class="fas fa-ellipsis-v p-2 cursor-pointer" onclick="toggleHeaderMenu()"></i>
        </div>
    </header>

    <main id="chat-container" style="flex: 1; overflow-y: auto; background-color: #0b141a; padding: 15px;"></main>

    <div id="emoji-panel"></div>

    <div class="input-area" style="background: #202c33; padding: 10px; display: flex; align-items: center; gap: 10px; position: relative;">
        <div class="input-card" style="background: #2a3942; border-radius: 25px; flex: 1; display: flex; align-items: center; padding: 0 15px; height: 45px;">
            <i class="far fa-smile text-[#8696a0] text-xl cursor-pointer" onclick="toggleEmojis()"></i>
            <input type="text" id="chat-input" style="background: transparent; border: none; outline: none; flex: 1; color: white; padding: 0 10px;" placeholder="Mensaje" autocomplete="off">
            <label for="file-input"><i class="fas fa-paperclip text-[#8696a0] text-xl mx-2 cursor-pointer"></i></label>
            <input type="file" id="file-input" hidden accept="image/*" onchange="manejarImagen(this)">
        </div>
        <button id="action-btn" onclick="enviarTexto()" style="background: #00a884; width: 45px; height: 45px; border-radius: 50%; color: white; border: none;">
            <i class="fas fa-paper-plane"></i>
        </button>
    </div>

    <script src="https://dnplus-py.github.io/DNPlus-Messenger-web/mensajes.js"></script>
    <script src="https://dnplus-py.github.io/DNPlus-Messenger-web/dn_notificaciones.js"></script>

    <script>
        // 1. Lógica de Emojis
        function toggleEmojis() {
            const panel = document.getElementById("emoji-panel");
            if (panel.style.display === "none" || panel.style.display === "") {
                panel.style.display = "grid";
                const emojis = ["😀","😂","😍","😊","😎","🙌","👍","🔥","❤️","⭐","📍","📷","📞","💬","🆗"];
                panel.innerHTML = emojis.map(e => `<span onclick="ponerEmoji('${e}')">${e}</span>`).join("");
            } else { panel.style.display = "none"; }
        }
        function ponerEmoji(emoji) { document.getElementById("chat-input").value += emoji; }

        // 2. Lógica de Imágenes
        async function manejarImagen(input) {
            const file = input.files[0];
            if (!file) return;
            const storageRef = firebase.storage().ref("fotos_chat/" + Date.now() + "_" + file.name);
            const snapshot = await storageRef.put(file);
            const url = await snapshot.ref.getDownloadURL();
            
            // Enviar a Database (Asegúrate que idReceptor esté en mensajes.js)
            const miId = localStorage.getItem("user_phone");
            firebase.database().ref("chats").push({
                emisor: miId,
                receptor: idReceptor,
                tipo: "imagen",
                url: url,
                timestamp: Date.now()
            });
            enviarAvisoDN(idReceptor, "DNPlus", "📷 Te envió una imagen");
        }

        // 3. Redirección a Llamada
        function irALlamada() {
            if (typeof idReceptor !== 'undefined') {
                window.location.href = "llamada.html?id=" + idReceptor;
            }
        }

        // 4. Enviar Texto Manual (Complemento a mensajes.js)
        function enviarTexto() {
            const txt = document.getElementById("chat-input").value;
            if (txt.trim() !== "" && typeof idReceptor !== 'undefined') {
                // Aquí se llama a la función de envío que ya tienes en mensajes.js o se hace el push directo
                enviarAvisoDN(idReceptor, "DNPlus", txt);
                document.getElementById("chat-input").value = "";
                document.getElementById("emoji-panel").style.display = "none";
            }
        }
    </script>
</body>
</html>
