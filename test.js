import { createNode } from './src/p2p/node.js'
import { createSellerCatalog } from './src/p2p/seller.js'
import { discoverSeller } from './src/p2p/buyer.js'
import fs from 'fs/promises'

async function main () {
  console.log('🟡 Arrancando nodos...')
  
  const sellerNode = await createNode('seller')
  const buyerNode = await createNode('buyer')

  // --- SELLER ---
  console.log('\n🟡 Creando catálogo del vendedor...')
  const catalog = await createSellerCatalog(sellerNode)
  console.log('✅ Seller publicKey:', catalog.publicKey)

  // Añadimos un producto con una imagen de prueba
  const testImage = await fs.readFile('./test-image.jpg')
  const product = await catalog.addProduct(
    { name: 'Camiseta azul', price: 15, description: 'Talla M' },
    [{ buffer: testImage, filename: 'camiseta.jpg', mimeType: 'image/jpeg' }]
  )
  console.log('✅ Producto añadido:', product.name)

  // --- BUYER ---
  console.log('\n🟡 Buyer descubriendo al seller...')
  const seller = await discoverSeller(buyerNode, catalog.publicKey)
  
  console.log('✅ Productos encontrados:', seller.products.length)
  for (const p of seller.products) {
    console.log(' -', p.name, '| Precio:', p.price, '| Imágenes:', p.images?.length ?? 0)
  }

  // Comprobamos que la imagen se puede recuperar
  if (seller.products[0]?.images?.length > 0) {
    const img = seller.getImage(seller.products[0].images[0])
    console.log('\n✅ Imagen recuperada, tamaño:', img.buffer.length, 'bytes')
    await fs.writeFile('./downloaded-image.jpg', img.buffer)
    console.log('✅ Imagen guardada como downloaded-image.jpg')
  }

  console.log('\n🎉 Todo funciona!')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})