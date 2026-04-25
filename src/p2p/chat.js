import b4a from 'b4a';

export function setupChat(socket) {
    const inputChat = document.getElementById('input-chat');
    const btnEnviar = document.getElementById('btn-enviar');
    const boxMensajes = document.getElementById('mensajes');

    // 1. Recibir un mensaje 
    socket.on('data', (data) => {
        try {
            // Intentamos parsear como JSON
            const parsed = JSON.parse(b4a.toString(data));

            // Solo mostramos en el chat si el tipo del mensaje es 'chat'
            if (parsed.tipo === 'chat') {
                mostrarMensaje(parsed.texto, 'vendedor', boxMensajes);
            }

        } catch {
            // Si no es JSON (mensaje plano), lo mostramos directamente
            // Esto es por si Persona A no usa JSON todavía
            mostrarMensaje(b4a.toString(data), 'vendedor', boxMensajes);
        }
    });



    // 2. Enviar un mensaje
    btnEnviar.onclick = () => {
        const texto = inputChat.value.trim();

        if (texto !== "") {
            //enviamos el mensaje en formato JSON
            socket.write(b4a.from(JSON.stringify({ tipo: 'chat', texto: texto })));

            mostrarMensaje(texto, 'tu', boxMensajes); //mostrar el mensaje 
            inputChat.value = ""; //limpia el imput
        }
    };

    // 3. Enviar también con la tecla Enter
    inputChat.onkeydown = (e) => {
        if (e.key === 'Enter') btnEnviar.click();
    };

    //Errores
    socket.on('error', (err) => console.error('Error en el chat:', err));
    socket.on('close', () => alert('El vendedor se ha desconectado.'));
}

function mostrarMensaje(texto, autor, contenedor) {
    const p = document.createElement('p');
    p.style.padding = "5px";
    p.style.margin = "5px";
    p.style.borderRadius = "5px";

    if (autor === 'vendedor') {
        p.style.background = "#3e3e5e";
        p.innerText = `Vendedor: ${texto}`;
    } else {
        p.style.background = "#4e9af1";
        p.style.textAlign = "right";
        p.innerText = `Tú: ${texto}`;
    }

    contenedor.appendChild(p);
    contenedor.scrollTop = contenedor.scrollHeight;
}