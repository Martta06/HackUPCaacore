export function renderSellerView() {
    return `
        <!-- PANTALLA 1: Tienda -->
        <div id="pantalla-tienda">
            <div id="tienda-header">
                <h2>Tu Tienda P2P</h2>
                <button id="btn-abrir-chat-seller">💬 Chat <span id="bolita" style="display:none">🔴</span></button>
            </div>

            <div id="claves-box">
                <p>Comparte esta clave con tus compradores:</p>
                <div id="clave-row">
                    <span id="clave-texto">Cargando...</span>
                    <button id="btn-copiar">Copiar</button>
                </div>
            </div>

            <div id="productos-header">
                <h3>Tus productos</h3>
                <button id="btn-añadir">+ Añadir producto</button>
            </div>
            <div id="lista-productos-seller"></div>
        </div>

        <!-- PANTALLA 2: Chat -->
        <div id="pantalla-chat-seller" style="display:none">
            <div id="chat-header">
                <button id="btn-volver-seller">← Volver</button>
                <h3 id="chat-titulo">Chat con el comprador</h3>
            </div>
            <div id="mensajes"></div>
            <div id="chat-input-area">
                <input id="input-chat" type="text" placeholder="Escribe un mensaje..." />
                <button id="btn-enviar">Enviar</button>
            </div>
        </div>

        <!-- PANTALLA 3: Añadir producto -->
        <div id="pantalla-añadir" style="display:none">
            <div id="añadir-header">
                <button id="btn-volver-añadir">← Volver</button>
                <h3>Añadir producto</h3>
            </div>
            <div id="formulario-producto">
                <input id="input-nombre" type="text" placeholder="Nombre del producto" />
                <input id="input-precio" type="number" placeholder="Precio en €" />
                <textarea id="input-descripcion" placeholder="Descripción del producto..."></textarea>
                <input id="input-imagen" type="file" accept="image/*" />
                <button id="btn-guardar-producto">Guardar producto</button>
            </div>
        </div>
    `;
}