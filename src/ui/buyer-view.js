export function renderBuyerView() {
    return `
        <!-- PANTALLA 1: Conexión -->
        <div id="pantalla-conexion">
            <h2>Tienda P2P de Ropa</h2>
            <p>Introduce la clave de la tienda:</p>
            <input id="input-clave" type="text" placeholder="Pega aquí la clave..." />
            <button id="btn-conectar">Conectar</button>
            <p id="estado-conexion"></p>
        </div>

        <!-- PANTALLA 2: Catálogo -->
        <div id="pantalla-catalogo" style="display:none">
            <div id="catalogo-header">
                <h2>Tienda P2P de Ropa</h2>
                <button id="btn-abrir-chat">💬 Chat</button>
            </div>
            <div id="lista-productos"></div>
        </div>

        <!-- PANTALLA 3: Chat -->
        <div id="pantalla-chat" style="display:none">
            <div id="chat-header">
                <button id="btn-volver">← Volver</button>
                <h3 id="chat-titulo">Chat con la tienda</h3>
            </div>
            <div id="mensajes"></div>
            <div id="chat-input-area">
                <input id="input-chat" type="text" placeholder="Escribe un mensaje..." />
                <button id="btn-enviar">Enviar</button>
            </div>
        </div>
    `;
}