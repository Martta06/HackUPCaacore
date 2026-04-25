import { createNode } from './p2p/node.js'
import { renderRoleView } from './ui/role-select.js'
import { initBuyerView } from './ui/buyer-view.js'
import { initSellerView } from './ui/seller-view.js'

let node = null

// Pintamos el selector de rol al arrancar
document.body.innerHTML = renderRoleView()

document.getElementById('btn-rol-seller').onclick = async () => {
    document.body.innerHTML = '<h2>Conectando a la red P2P...</h2>'
    node = await createNode('seller')
    await initSellerView(node)
}

document.getElementById('btn-rol-buyer').onclick = async () => {
    document.body.innerHTML = '<h2>Conectando a la red P2P...</h2>'
    node = await createNode('buyer')
    await initBuyerView(node)
}

// Limpieza al cerrar
window.addEventListener('beforeunload', async () => {
    if (node) await node.destroy()
})
