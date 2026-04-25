import b4a from 'b4a';

export function setupChat(socket) {
    const inputChat = document.getElementById('input-chat');
    const boxMensajes = document.getElementById('mensajes');

    socket.removeAllListeners('data')

    // Reemplazamos el botón para limpiar listeners viejos
    const btnViejo = document.getElementById('btn-enviar')
    const btnEnviar = btnViejo.cloneNode(true)
    btnViejo.parentNode.replaceChild(btnEnviar, btnViejo)

    // 1. Recibir un mensaje 
    socket.on('data', (data) => {
        try {
            const parsed = JSON.parse(b4a.toString(data));
            if (parsed.tipo === 'direct-message') {
                mostrarMensaje(parsed.texto, 'vendedor', boxMensajes);
            }
        } catch {
            mostrarMensaje(b4a.toString(data), 'vendedor', boxMensajes);
        }
    });

    // 2. Enviar un mensaje
    btnEnviar.onclick = () => {
        const texto = inputChat.value.trim();
        if (texto !== "") {
            socket.write(JSON.stringify({ tipo: 'direct-message', texto }))
            mostrarMensaje(texto, 'tu', boxMensajes);
            inputChat.value = "";
        }
    };

    // 3. Enviar también con la tecla Enter
    inputChat.onkeydown = (e) => {
        if (e.key === 'Enter') btnEnviar.click();
    };

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