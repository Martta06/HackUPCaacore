export function renderBuyerView() {
    return `
        <!-- PANTALLA 1: Conexión -->
        <div id="pantalla-conexion">
            <h2>🛍️ Tienda P2P de Ropa</h2>
            <p>Introduce la clave de la tienda:</p>
            <input id="input-clave" type="text" placeholder="Pega aquí la clave..." />
            <button id="btn-conectar">Conectar</button>
            <p id="estado-conexion"></p>
        </div>

        <!-- PANTALLA 2: Catálogo -->
        <div id="pantalla-catalogo" style="display:none">
            <h2>🛍️ Tienda P2P de Ropa</h2>
            <div id="lista-productos"></div>
        </div>

        <!-- PANTALLA 3: Chat -->
        <div id="pantalla-chat" style="display:none">
            <button id="btn-volver">← Volver</button>
            <h3 id="chat-titulo">Chat con el vendedor</h3>
            <div id="mensajes" style="height:400px; overflow-y:auto; border:1px solid #ccc;"></div>
            <input id="input-chat" type="text" placeholder="Escribe un mensaje..." />
            <button id="btn-enviar">Enviar</button>
        </div>
    `;
}