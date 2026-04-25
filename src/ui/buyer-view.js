import { discoverSeller } from '../p2p/buyer.js'
import { setupChat } from '../p2p/chat.js'

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
    `
}

// ============================================================
// Lógica de la vista del buyer
// ============================================================

export async function initBuyerView(node) {
    document.body.innerHTML = renderBuyerView()

    let seller = null
    const activeImageURLs = new Set()

    // Botón conectar
    document.getElementById('btn-conectar').onclick = async () => {
        const sellerKey = document.getElementById('input-clave').value.trim()

        if (!sellerKey) {
            document.getElementById('estado-conexion').innerText = '⚠️ Introduce una clave'
            return
        }

        document.getElementById('estado-conexion').innerText = '🔍 Conectando...'

        try {
            seller = await discoverSeller(node, sellerKey)
            // Damos un poco de tiempo para que llegue el catálogo
            await new Promise(r => setTimeout(r, 2000))

            document.getElementById('estado-conexion').innerText = '✅ Conectado!'
            mostrarPantalla('pantalla-catalogo')
            renderProductos(seller.products)
        } catch (e) {
            document.getElementById('estado-conexion').innerText = '❌ Error al conectar'
            console.error(e)
        }
    }

    // Botón abrir chat
    document.getElementById('btn-abrir-chat').onclick = () => {
        if (!seller) return
        mostrarPantalla('pantalla-chat')
        // setupChat(...) — adáptalo cuando tengas la lógica de chat lista
    }

    // Botón volver al catálogo
    document.getElementById('btn-volver').onclick = () => {
        mostrarPantalla('pantalla-catalogo')
    }

    // ----------------- helpers internos -----------------

    function renderProductos(productos) {
        const lista = document.getElementById('lista-productos')
        cleanupImages()
        lista.innerHTML = ''

        if (productos.length === 0) {
            lista.innerHTML = '<p>Esta tienda aún no tiene productos.</p>'
            return
        }

        for (const p of productos) {
            const card = document.createElement('div')
            card.className = 'producto-card'

            if (p.images?.length > 0) {
                const img = document.createElement('img')
                const url = seller.getImageURL(p.images[0])
                img.src = url
                activeImageURLs.add(url)
                card.appendChild(img)
            }

            const nombre = document.createElement('h3')
            nombre.textContent = p.name
            card.appendChild(nombre)

            const precio = document.createElement('p')
            precio.textContent = `${p.price} €`
            card.appendChild(precio)

            if (p.description) {
                const desc = document.createElement('p')
                desc.textContent = p.description
                card.appendChild(desc)
            }

            lista.appendChild(card)
        }
    }

    function mostrarPantalla(id) {
        ['pantalla-conexion', 'pantalla-catalogo', 'pantalla-chat'].forEach(pid => {
            document.getElementById(pid).style.display = pid === id ? 'block' : 'none'
        })
    }

    function cleanupImages() {
        for (const url of activeImageURLs) URL.revokeObjectURL(url)
        activeImageURLs.clear()
    }
}