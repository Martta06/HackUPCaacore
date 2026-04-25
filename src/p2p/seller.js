// TIENDA INDIVIDUAL

import Hyperbee from 'hyperbee'
import Hyperblobs from 'hyperblobs'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'hypercore-crypto'

export async function createSellerCatalog (node) {
    const core = node.store.get({name: 'catalog'})
    await core.ready()

    const bee = new Hyperbee (core, {

        // Al decirle a js que usamos utf-8 le decimos que los identificadores van a ser texto normal
        keyEncoding: 'utf-8',

        // Value es la información real del producto. Al poner json decimos que van a ser objetos
        // de Java Script
        valueEncoding: 'json',

    })
    await bee.ready()

    // Para las fotos

    const blobCore = node.store.get ({name: 'catalog-blobs'})  // Separamos las fotos del código general
    await blobCore.ready()
    const blobs = new Hyperblobs (blobCore)


    // Anunciar la tienda en el DHT, (Directorio, (como un directorio telefónico mundial))

    //Encriptar la llave pública
    const topic = crypto.hash (core.key)

    // Indicar al DHT que es tienda y no comprador
    node.swarm.join (topic, {server:true, client: false})

    // Esperar a que el código haya llegado a la red bien
    await node.swarm.flush()

    return {
        publicKey: core.key.toString ('hex'),
        blobsKey: blobCore.key.toString ('hex'),

        async addProduct (product, images = []) {
            
            // Si el producto no tiene id propio le asignamos uno que es la hora exacta en milisegundos
            const id = product.id || Date.now().toString()  


            // Creamos una lista vacía de imágenes y procesa una por una las rutas de las fotos que le pasamos
            const imageRefs = []
            for (const img of images) {

                // Le entregamos el bloque pesado a hyperblobs y  hyperblobs devuelve la identificación, (Id)
                const blobId = await blobs.put(Buffer.from(img.buffer))
                imageRefs.push ({
                    id: blobId,
                    filename: img.filename,
                    mimeType: img.mimeType
                })

            }

            const entry = {

                // Los tres puntos indican que se mete todo lo que tiene que ver con el producto
                ...product, 
                id, 
                images,
                
                // Usado por si alguna vez querríamos mostrar en la web una sección de "Últimos productos añadidos"
                createdAt: new Date().toISOString()
            }

            await bee.put (`product:${id}`, entry)
            return entry

        
        },



        // Función "Escaparate", (Coge los productos guardados en hyperbee y los mete en una lista limpia sobre la que trabaja la página web)
        async listProducts () {

            const products = []

            // Usamos Stream para que el flujo de datos no sea de golpe
            for await (const {value} of bee.createReadStream({

                // Búsqueda por rango: Esto evita que el código coja algo que no sea un producto
                gt: 'product:',  // Mayor que la nada
                lt : 'product: ~' // Menor que ese carácter que es el último de la lista
            }))  {

                products.push (value)  // Añade el producto a la lista, (como carrito de la compra)

            }

            return products
        },

        // Devuelve la imagen a partir del código generado por hyperblobs
        async getImage (blobId) {

            return await blobs.get(blobId)
        },



        async deleteProduct (id) {

            await bee.del (`product:${id}`)
        }

    }

}


// Función que devuelve el tipo de imagen: Si existe en el diccionario, devuelve la info del diccionario. Si no, 'application/octet-stream'
// que básicamente significa que ni idea del archivo introducido

function getMimeType (filepath) {

    const ext = path.extname(filepath).toLowerCase()
    const types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
    }

    return types[ext] || 'application/octet-stream'
}
