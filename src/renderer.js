import b4a from 'b4a'
import { createNode } from './src/p2p/node.js'
import { setupChat } from './src/p2p/chat.js'
import { renderBuyerView } from './src/ui/buyer-view.js'

// 1. Pintar la UI
document.body.innerHTML = renderBuyerView()

let socketActivo = null
let node = null

// 2. Iniciar el nodo P2P (sin conectar a nadie todavía)
node = await createNode()

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