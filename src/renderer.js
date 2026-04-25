import b4a from 'b4a'
import { createNode } from './src/p2p/node.js'
import { setupChat } from './src/p2p/chat.js'
import { renderBuyerView } from './src/ui/buyer-view.js'
import { renderSellerView } from './src/ui/seller-view.js'
import { discoverSeller } from './src/p2p/buyer.js'
import { createSellerCatalog } from './src/p2p/seller.js'

let socketActivo = null
let node = null

//Iniciamos el nodo P2P
node = await createNode()

//vendedor o comprador
if (typeof Pear !== 'undefined' && Pear.config.args.includes('--seller')) {
    iniciarSeller()
} else {
    iniciarBuyer()
}

//-----------------VENDEDOR-----------------
async function iniciarSeller() {
    document.body.innerHTML = renderSellerView()

    // Creamos el catálogo del vendedor
    const seller = await createSellerCatalog(node)

    // Mostramos la clave combinada
    const claveCompartir = seller.publicKey + ':' + seller.blobsKey
    document.getElementById('clave-texto').innerText = claveCompartir

    // Botón copiar
    document.getElementById('btn-copiar').onclick = () => {
        navigator.clipboard.writeText(claveCompartir)
        document.getElementById('btn-copiar').innerText = 'Copiado'
        setTimeout(() => document.getElementById('btn-copiar').innerText = 'Copiar', 2000)
    }

    // Cargamos los productos existentes
    const productos = await seller.listProducts()
    renderProductosSeller(productos, seller)

    // Botón abrir chat
    document.getElementById('btn-abrir-chat-seller').onclick = () => {
        mostrarPantalla('pantalla-chat-seller')
        document.getElementById('bolita').style.display = 'none'
    }

    // Botón añadir producto
    document.getElementById('btn-añadir').onclick = () => mostrarPantalla('pantalla-añadir')

    // Botón volver desde añadir
    document.getElementById('btn-volver-añadir').onclick = () => mostrarPantalla('pantalla-tienda')

    // Botón volver desde chat
    document.getElementById('btn-volver-seller').onclick = () => mostrarPantalla('pantalla-tienda')

    // Guardar producto
    document.getElementById('btn-guardar-producto').onclick = async () => {
        const nombre = document.getElementById('input-nombre').value.trim()
        const precio = document.getElementById('input-precio').value.trim()
        const descripcion = document.getElementById('input-descripcion').value.trim()
        const imagenInput = document.getElementById('input-imagen')

        //campos obligatorios
        if (!nombre || !precio) {
            alert('El nombre y el precio son obligatorios')
            return
        }

        // Procesamos la imagen si hay una
        let imagenes = []
        if (imagenInput.files.length > 0) {
            const file = imagenInput.files[0]
            const buffer = await file.arrayBuffer()
            imagenes.push({
                buffer: new Uint8Array(buffer),
                filename: file.name,
                mimeType: file.type
            })
        }

        // Guardamos el producto
        await seller.addProduct({ nombre, precio: parseFloat(precio), descripcion }, imagenes)

        // Limpiamos el formulario
        document.getElementById('input-nombre').value = ''
        document.getElementById('input-precio').value = ''
        document.getElementById('input-descripcion').value = ''
        imagenInput.value = ''

        // Actualizamos la lista y volvemos a la tienda
        const productosActualizados = await seller.listProducts()
        renderProductosSeller(productosActualizados, seller)
        mostrarPantalla('pantalla-tienda')
    }

    // Escuchar conexiones del comprador para el chat
    node.swarm.on('connection', (socket) => {
        socketActivo = socket

        // Mostrar bolita cuando llega un mensaje
        socket.on('data', (data) => {
            try {
                const mensaje = JSON.parse(b4a.toString(data))
                if (mensaje.tipo === 'chat') {
                    // Si no estamos en el chat, mostramos la bolita
                    if (document.getElementById('pantalla-chat-seller').style.display === 'none') {
                        document.getElementById('bolita').style.display = 'inline-block'
                    }
                }
            } catch {}
        })

         // Cuando el comprador abre el chat, inicializamos setupChat
        document.getElementById('btn-abrir-chat-seller').onclick = () => {
            mostrarPantalla('pantalla-chat-seller')
            document.getElementById('bolita').style.display = 'none'
            if (socketActivo) setupChat(socketActivo)
        }
    })
}

// Renderiza los productos del seller
async function renderProductosSeller(productos, seller) {
    const contenedor = document.getElementById('lista-productos-seller')
    contenedor.innerHTML = ''

    if (productos.length === 0) {
        contenedor.innerHTML = '<p style="color:#aaa">No tienes productos todavía</p>'
        return
    }

    for (const producto of productos) {
        const card = document.createElement('div')
        card.className = 'product-card'

        // Imagen
        let imgSrc = 'https://via.placeholder.com/220x180?text=Sin+imagen'
        if (producto.images && producto.images.length > 0) {
            try {
                const url = await seller.getImageURL(producto.images[0])
                imgSrc = url
            } catch {}
        }

        card.innerHTML = `
            <img src="${imgSrc}" alt="${producto.nombre}" />
            <div class="card-body">
                <h3>${producto.nombre}</h3>
                <p class="descripcion">${producto.descripcion || ''}</p>
                <p class="precio">${producto.precio}€</p>
                <button class="btn-eliminar">🗑 Eliminar</button>
            </div>
        `

        card.querySelector('.btn-eliminar').onclick = async () => {
            await seller.deleteProduct(producto.id)
            const productosActualizados = await seller.listProducts()
            renderProductosSeller(productosActualizados, seller)
        }

        contenedor.appendChild(card)
    }
}

//-----------------BUYER-----------------
async function iniciarBuyer() {
    // 1. Pintar la UI
    document.body.innerHTML = renderBuyerView()

    // 3. Botón conectar — usa la clave que introduce el comprador
    document.getElementById('btn-conectar').onclick = async () => {
        const claveHex = document.getElementById('input-clave').value.trim()

        if (!claveHex) {
            document.getElementById('estado-conexion').innerText = '⚠️ Introduce una clave'
            return
        }

        document.getElementById('estado-conexion').innerText = '🔍 Conectando...'

        try {
            const topicBuffer = b4a.from(claveHex, 'hex')
            node.swarm.join(topicBuffer, { client: true, server: false })

            node.swarm.on('connection', (socket) => {
                socketActivo = socket
                document.getElementById('estado-conexion').innerText = '✅ Conectado!'

                mostrarPantalla('pantalla-catalogo')

                socket.write(b4a.from(JSON.stringify({ tipo: 'pedir-catalogo' })))

                socket.on('data', (data) => {
                    try {
                        const mensaje = JSON.parse(b4a.toString(data))
                        if (mensaje.tipo === 'catalogo') {
                            console.log('Productos recibidos:', mensaje.productos)
                            // renderProductos(mensaje.productos)
                        }
                    } catch (e) {
                        console.error('Error al parsear mensaje:', e)
                    }
                })

                socket.on('close', () => {
                    alert('El vendedor se ha desconectado')
                    mostrarPantalla('pantalla-conexion')
                })
            })

        } catch (e) {
            document.getElementById('estado-conexion').innerText = '❌ Clave inválida'
            console.error(e)
        }
    }
}

// 4. Botón chat del catálogo
document.getElementById('btn-abrir-chat').onclick = () => abrirChat()

// 5. Abrir chat
export function abrirChat() {
    if (!socketActivo) return
    mostrarPantalla('pantalla-chat')
    setupChat(socketActivo)
}

// 6. Botón volver al catálogo
document.getElementById('btn-volver').onclick = () => mostrarPantalla('pantalla-catalogo')

// Utilidad para cambiar de pantalla
function mostrarPantalla(id) {
    ['pantalla-conexion', 'pantalla-catalogo', 'pantalla-chat'].forEach(pid => {
        document.getElementById(pid).style.display = pid === id ? 'block' : 'none'
    })
}
