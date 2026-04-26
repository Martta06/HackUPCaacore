import { createSellerCatalog } from '../p2p/seller.js'
import { setupChat } from '../p2p/chat.js'

export function renderSellerView() {
    return `
        <!-- PANTALLA 1: Tienda -->
        <div id="pantalla-tienda">
            <div id="tienda-header">
                <h2>Your Store S2B</h2>
                <button id="btn-abrir-chat-seller">💬 Chat <span id="bolita" style="display:none">🔴</span></button>
            </div>
            <div id="claves-box">
                <p>Share this key with your buyers:</p>
                <div id="clave-row">
                    <span id="clave-texto">Loading...</span>
                    <button id="btn-copiar">Copy</button>
                </div>
            </div>
            <div id="productos-header">
                <h3>Your products</h3>
                <button id="btn-añadir">+ Add product</button>
            </div>
            <div id="lista-productos-seller"></div>
        </div>

        <!-- PANTALLA 2: Chat -->
        <div id="pantalla-chat-seller" style="display:none">
            <div id="chat-header">
                <button id="btn-volver-seller">← Return</button>
                <h3 id="chat-titulo">Chat with the buyer</h3>
            </div>
            <div id="mensajes"></div>
            <div id="chat-input-area">
                <input id="input-chat" type="text" placeholder="Write a message..." />
                <button id="btn-enviar">Send</button>
            </div>
        </div>

        <!-- PANTALLA 3: Añadir producto -->
        <div id="pantalla-añadir" style="display:none">
            <div id="añadir-header">
                <button id="btn-volver-añadir">← Return</button>
                <h3>Add product</h3>
            </div>
            <div id="formulario-producto">
                <input id="input-nombre" type="text" placeholder="Name of the product" />
                <input id="input-precio" type="number" placeholder="Price (€)" />
                <textarea id="input-descripcion" placeholder="Description..."></textarea>
                <input id="input-imagen" type="file" accept="image/*" multiple />
                <button id="btn-guardar-producto">Save</button>
            </div>
        </div>
    `
}

// ============================================================
// Lógica de la vista del seller
// ============================================================

export async function initSellerView(node) {
    document.body.innerHTML = renderSellerView()

    // Crear catálogo P2P
    const catalog = await createSellerCatalog(node)
    const activeImageURLs = new Set()

    // Variable que guardará el socket del comprador conectado

    // Mostrar la clave en pantalla
    document.getElementById('clave-texto').textContent = catalog.publicKey

    // ----------- CHAT: capturar conexiones de compradores -----------

    // Variables para el chat
    let chatSocketActivo = null
    const mensajesPendientes = []  // mensajes recibidos antes de abrir el chat

    catalog.onPeerConnect((socket) => {
        chatSocketActivo = socket
        document.getElementById('bolita').style.display = 'inline'
        console.log('🟢 Comprador conectado al chat')

        // Capturamos mensajes que lleguen antes de abrir el chat
        socket.on('data', (data) => {
            try {
                const parsed = JSON.parse(data.toString())
                if (parsed.tipo === 'direct-message') {
                    mensajesPendientes.push(parsed.texto)
                }
            } catch {

            }
        })
    })
    // ----------- Botones de navegación -----------

    document.getElementById('btn-copiar').onclick = () => {
        navigator.clipboard.writeText(catalog.publicKey)
        const btn = document.getElementById('btn-copiar')
        btn.textContent = '✓ Copied'
        setTimeout(() => { btn.textContent = 'Copy' }, 1500)
    }

    document.getElementById('btn-añadir').onclick = () => {
        mostrarPantalla('pantalla-añadir')
    }

    document.getElementById('btn-volver-añadir').onclick = () => {
        mostrarPantalla('pantalla-tienda')
    }

    document.getElementById('btn-abrir-chat-seller').onclick = () => {
        mostrarPantalla('pantalla-chat-seller')
        document.getElementById('bolita').style.display = 'none'

        if (chatSocketActivo) {
            const boxMensajes = document.getElementById('mensajes')
            boxMensajes.innerHTML = ''

            // Pintamos los mensajes pendientes con las clases CSS correctas
            for (const texto of mensajesPendientes) {
                const p = document.createElement('p')
                p.className = 'msg-vendedor'  // ← usa la clase CSS en lugar de estilos hardcodeados
                p.innerText = `Buyer: ${texto}`
                boxMensajes.appendChild(p)
            }
            mensajesPendientes.length = 0

            setupChat(chatSocketActivo)
        } else {
            document.getElementById('mensajes').innerHTML =
                '<p style="color:#888; padding:10px">No buyers connected.</p>'
        }
    }

    document.getElementById('btn-volver-seller').onclick = () => {
        mostrarPantalla('pantalla-tienda')
    }

    // ----------- Guardar producto -----------

    document.getElementById('btn-guardar-producto').onclick = async () => {
        const nombre = document.getElementById('input-nombre').value.trim()
        const precio = parseFloat(document.getElementById('input-precio').value)
        const descripcion = document.getElementById('input-descripcion').value.trim()
        const fileInput = document.getElementById('input-imagen')

        if (!nombre || isNaN(precio)) {
            alert('Pon al menos nombre y precio')
            return
        }

        const images = await Promise.all(
            Array.from(fileInput.files).map(async (file) => ({
                buffer: Buffer.from(await file.arrayBuffer()),
                filename: file.name,
                mimeType: file.type
            }))
        )

        await catalog.addProduct(
            { name: nombre, price: precio, description: descripcion },
            images
        )

        const productosActualizados = await catalog.listProducts()
        if (chatSocketActivo) {
            console.log('📤 Enviando catalogo-actualizado al buyer')
            chatSocketActivo.write(JSON.stringify({
                tipo: 'catalogo-actualizado',
                productos: productosActualizados
                }))
        } else {
            console.log('⚠️ No hay socket activo')
        }

        document.getElementById('input-nombre').value = ''
        document.getElementById('input-precio').value = ''
        document.getElementById('input-descripcion').value = ''
        fileInput.value = ''

        mostrarPantalla('pantalla-tienda')
        await refrescarProductos()
    }

    // ----------- Lista de productos -----------

    async function refrescarProductos() {
        const productos = await catalog.listProducts()
        const lista = document.getElementById('lista-productos-seller')
        cleanupImages()
        lista.innerHTML = ''

        if (productos.length === 0) {
            lista.innerHTML = '<p class="sin-productos">Aún no tienes productos. ¡Añade el primero!</p>'
            return
        }

        for (const p of productos) {
            const card = document.createElement('div')
            card.className = 'producto-card-seller'

            if (p.images?.length > 0) {
                const img = document.createElement('img')
                const buffer = Buffer.from(p.images[0].data, 'base64')
                const blob = new Blob([buffer], { type: p.images[0].mimeType })
                const url = URL.createObjectURL(blob)
                img.src = url
                activeImageURLs.add(url)
                card.appendChild(img)
            }

            const info = document.createElement('div')
            info.className = 'producto-info'

            const nombre = document.createElement('h4')
            nombre.textContent = p.name
            info.appendChild(nombre)

            const precio = document.createElement('p')
            precio.className = 'precio'
            precio.textContent = `${p.price} €`
            info.appendChild(precio)

            if (p.description) {
                const desc = document.createElement('p')
                desc.className = 'descripcion'
                desc.textContent = p.description
                info.appendChild(desc)
            }

            card.appendChild(info)

            const btnBorrar = document.createElement('button')
            btnBorrar.className = 'btn-eliminar'
            btnBorrar.textContent = '🗑️ Delete'
            btnBorrar.onclick = async () => {
                if (confirm(`¿Eliminar "${p.name}"?`)) {
                    await catalog.deleteProduct(p.id)

                    const productosActualizados = await catalog.listProducts()


                    if (chatSocketActivo) {
                        chatSocketActivo.write(JSON.stringify({ 
                            tipo: 'catalogo-actualizado', 
                        
                            productos: productosActualizados
                        }))
                    }
                    await refrescarProductos()
                }
            }
            card.appendChild(btnBorrar)

            lista.appendChild(card)
        }
    }

    // ----------- Helpers -----------

    function mostrarPantalla(id) {
        ['pantalla-tienda', 'pantalla-chat-seller', 'pantalla-añadir'].forEach(pid => {
            const el = document.getElementById(pid)
            if (el) el.style.display = pid === id ? 'block' : 'none'
        })
    }

    function cleanupImages() {
        for (const url of activeImageURLs) URL.revokeObjectURL(url)
        activeImageURLs.clear()
    }

    await refrescarProductos()
}
