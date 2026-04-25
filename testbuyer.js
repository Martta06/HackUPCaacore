import { createNode } from './src/p2p/node.js'
import { discoverSeller } from './src/p2p/buyer.js'
import fs from 'fs/promises'

// Pegad aquí las claves que imprime el seller
const SELLER_KEY = 'PEGA_AQUI_LA_SELLER_KEY'
const BLOBS_KEY  = 'PEGA_AQUI_LA_BLOBS_KEY'

async function main () {
  console.log('🟡 Arrancando nodo buyer...')
  const node = await createNode('buyer')

  console.log('🟡 Buscando al seller...')
  const seller = await discoverSeller(node, SELLER_KEY, BLOBS_KEY)

  console.log('\n✅ Productos encontrados:')
  for (const p of seller.products) {
    console.log(' -', p.name, '| Precio:', p.price, '| Imágenes:', p.images?.length ?? 0)
  }

  if (seller.products[0]?.images?.length > 0) {
    console.log('\n🟡 Descargando imagen...')
    const img = await seller.getImage(seller.products[0].images[0])
    await fs.writeFile('./downloaded-image.jpg', img.buffer)
    console.log('✅ Imagen guardada como downloaded-image.jpg')
  }

  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})