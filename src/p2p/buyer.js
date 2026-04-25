import Hyperbee from 'hyperbee' 
import Hyperblobs from 'hyperblobs'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'
import { blob } from 'node:stream/consumers'

export async function discoverSeller(node, sellerPublickey, sellerBlobskey) {

    // Ahora traducimos de letras, (lo que copiamos del seller) a binario
    const key = b4a.from(sellerPublickey, 'hex')
    const blobsKey = b4a.from(sellerBlobskey, 'hex')


    // Replicamos el core de metadatos del vendedor y de las imágenes
    const core = node.store.get({key})
    await core.ready()

    const blobCore = node.store.get({key: blobsKey})
    await blobCore.ready()


    // Nos unimos al topic del vendedor para encontrarlo
    const topic = crypto.hash (key)
    const discovery = node.swarm.join (topic, {server:false, client: true})
    await discovery.flushed()


    // Hasta ahora hemos conectado correctamente los nodos pero aquí vemos el catálogo de lo que ofrecen
    await core.update({wait: true})
    await blobCore.update({wait: true})
    await new Promise(resolve => setTimeout(resolve, 2000)) // Espera después de unirse al swarn


    // Con esto conseguimos una réplica de la infraestructura del vendedor
    const bee = new Hyperbee (core, {
        keyEncoding: 'utf-8',
        valueEncoding: 'json'
    })

    await bee.ready()

    const blobs = new Hyperblobs(blobCore)


    // Lista de productos
    const products = [] 
    for await (const { value } of bee.createReadStream({
        gt: 'product:',
        lt: 'product:~'
    })) {
        products.push(value)
    }

    return {
        products,
        sellerKey: sellerPublickey,

        async getImage (blobRef) {
            // blobRef = { id, filename, mimeType } tal como lo guardó el seller

            const buffer = await blobs.get(blobRef)
            return {
                buffer,
                filename: blobRef.filename,
                mimetype: blobRef.mimeType
            }
        },

        
        async getImageURL (blobRef) {

            // Se conecta a la red P2P y descarga los fragmentos de la imagen, devolviendo los datos en binario
            const buffer = await blobs.get(blobRef) 


            // Empaquetamos los datos en binario crudo en un 'sobre' llamado blob
            const blob = new Blob ([buffer], {type: blobRef.mimeType})

            // Toma el sobre y genera un enlace temporal para que la página web pueda mostrarlo
            return URL.createObjectURL(blob)
        }

    }

}