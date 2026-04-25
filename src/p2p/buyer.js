import Hyperbee from 'hyperbee'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'

export async function discoverSeller (node, sellerPublicKey) {
    // Traducimos la clave del seller de hex a binario
    const key = b4a.from(sellerPublicKey, 'hex')

    // Replicamos el core del vendedor (solo lectura)
    const core = node.store.get({ key })
    await core.ready()

    // Nos unimos al topic del vendedor para encontrarlo
    const topic = crypto.hash(key)
    const discovery = node.swarm.join(topic, { server: false, client: true })
    await discovery.flushed()

    // Esperamos a que se descargue el catálogo
    await core.update({ wait: true })
    await new Promise(resolve => setTimeout(resolve, 2000))

    const bee = new Hyperbee(core, {
        keyEncoding: 'utf-8',
        valueEncoding: 'json'
    })
    await bee.ready()

    // Listamos los productos del catálogo
    const products = []
    for await (const { value } of bee.createReadStream({
        gt: 'product:',
        lt: 'product:~'
    })) {
        products.push(value)
    }

    return {
        products,
        sellerKey: sellerPublicKey,

        // Devuelve la imagen como buffer + metadatos
        getImage (imageRef) {
            return {
                buffer: Buffer.from(imageRef.data, 'base64'),
                filename: imageRef.filename,
                mimeType: imageRef.mimeType
            }
        },

        // Devuelve una URL utilizable directamente en <img src="...">
        getImageURL (imageRef) {
            const buffer = Buffer.from(imageRef.data, 'base64')
            const blob = new Blob([buffer], { type: imageRef.mimeType })
            return URL.createObjectURL(blob)
        }
    }
}