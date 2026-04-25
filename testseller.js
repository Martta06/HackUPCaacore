import { createNode } from './src/p2p/node.js'
import { createSellerCatalog } from './src/p2p/seller.js'
import fs from 'fs/promises'

async function main () {
  console.log('🟡 Arrancando nodo seller...')
  const node = await createNode('seller')
  
  const catalog = await createSellerCatalog(node)
  
  console.log('\n✅ Catálogo listo. Comparte estas claves con el buyer:')
  console.log('SELLER_KEY:', catalog.publicKey)
  console.log('BLOBS_KEY:', catalog.blobsKey)

  // Añadimos un producto de prueba
  const testImage = await fs.readFile('./test-image.jpg')
  const product = await catalog.addProduct(
    { name: 'Camiseta azul', price: 15, description: 'Talla M' },
    [{ buffer: testImage, filename: 'camiseta.jpg', mimeType: 'image/jpeg' }]
  )
  console.log('\n✅ Producto añadido:', product.name)
  console.log('⏳ Anunciando en el DHT, esto puede tardar 30-60 segundos...')
  await new Promise(resolve => setTimeout(resolve, 30000))
  console.log('✅ Anuncio completado')
  console.log('\n⏳ Esperando compradores... (Ctrl+C para salir)')
  console.log('\n⏳ Esperando compradores... (Ctrl+C para salir)')

  // El seller tiene que quedarse vivo para que el buyer pueda conectarse
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})