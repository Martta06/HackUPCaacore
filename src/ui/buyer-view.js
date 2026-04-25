import { discoverSeller } from '../p2p/buyer.js'
import { setupChat } from '../p2p/chat.js'

export function renderBuyerView() {
    return `
        <!-- PANTALLA 1: Conexión -->
        <div id="pantalla-conexion">
            <h2>S2B</h2>
            <p>Insert the store's key:</p>
            <input id="input-clave" type="text" placeholder="Add here the key..." />
            <button id="btn-conectar">Connect</button>
            <p id="estado-conexion"></p>
        </div>

        <!-- PANTALLA 2: Catálogo -->
        <div id="pantalla-catalogo" style="display:none">
            <div id="catalogo-header">
                <h2>S2B</h2>
                <button id="btn-abrir-chat">💬 Chat</button>
            </div>
            <div id="lista-productos"></div>
        </div>

        <!-- PANTALLA 3: Chat -->
        <div id="pantalla-chat" style="display:none">
            <div id="chat-header">
                <button id="btn-volver">← Return</button>
                <h3 id="chat-titulo">Chat with the store</h3>
            </div>
            <div id="mensajes"></div>
            <div id="chat-input-area">
                <input id="input-chat" type="text" placeholder="Write a message..." />
                <button id="btn-enviar">Send</button>
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

        document.getElementById('estado-conexion').innerText = '🔍 Connecting...'

        try {
            seller = await discoverSeller(node, sellerKey)
            // Damos un poco de tiempo para que llegue el catálogo
            await new Promise(r => setTimeout(r, 2000))
            
            const socket = seller.getChatSocket()
            if (socket) {
                socket.on('data', async (data) => {
                    console.log('📨 Dato recibido en buyer:', data.toString())
                    try {
                        const parsed = JSON.parse(data.toString())
                        console.log('✅ Parsed:', parsed)
                        if (parsed.tipo === 'catalogo-actualizado') {
                            console.log('🔄 Refrescando productos...')
                            const nuevos = await seller.refreshProducts()
                            console.log('📦 Productos nuevos:', nuevos)
                            renderProductos(seller.products)
                        }
                    } catch(e){
                        console.log('❌ Error parseando:', e)
                    }
                })
            }

            document.getElementById('estado-conexion').innerText = '✅ Conectado!'
            mostrarPantalla('pantalla-catalogo')
            renderProductos(seller.products)
        } catch (e) {
            document.getElementById('estado-conexion').innerText = '❌ Failed to connect'
            console.error(e)
        }
    }

    // Botón abrir chat
    document.getElementById('btn-abrir-chat').onclick = () => {
        if (!seller) return
        mostrarPantalla('pantalla-chat')

        const socket = seller.getChatSocket()
        if (socket) {
            setupChat(socket)
        } else {
            document.getElementById('mensajes').innerHTML =
                '<p style="color:#888; padding:10px">Esperando conexión con el vendedor...</p>'
        }
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