// TIENDA INDIVIDUAL

import Hyperbee from 'hyperbee'
import crypto from 'hypercore-crypto'

export async function createSellerCatalog (node) {
    const core = node.store.get({ name: 'catalog' })
    await core.ready()

    const bee = new Hyperbee(core, {
        keyEncoding: 'utf-8',
        valueEncoding: 'json'
    })
    await bee.ready()

    // Anunciar la tienda en el DHT
    const topic = crypto.hash(core.key)
    node.swarm.join(topic, { server: true, client: false })

    // Flush con timeout para no quedarse colgado
    await Promise.race([
        node.swarm.flush(),
        new Promise(resolve => setTimeout(resolve, 5000))
    ])

    return {
        publicKey: core.key.toString('hex'),



        // Añade un producto. images = [{ buffer, filename, mimeType }]
        async addProduct (product, images = []) {
            const id = product.id || Date.now().toString()

            // Convertimos las imágenes a base64 y las guardamos dentro del producto
            const imageRefs = images.map(img => ({
                data: img.buffer.toString('base64'),
                filename: img.filename,
                mimeType: img.mimeType
            }))

            const entry = {
                ...product,
                id,
                images: imageRefs,
                createdAt: new Date().toISOString()
            }

            await bee.put(`product:${id}`, entry)
            return entry


        },

        // Devuelve la lista de productos del catálogo
        async listProducts () {
            const products = []
            for await (const { value } of bee.createReadStream({
                gt: 'product:',
                lt: 'product:~'
            })) {
                products.push(value)
            }
            return products
        },

        // Borra un producto del catálogo
        async deleteProduct (id) {
            await bee.del(`product:${id}`)
        },


        onPeerConnect (callback) {
            node.swarm.on('connection', (socket) => {
                callback (socket)
            })
        }

    }
}
